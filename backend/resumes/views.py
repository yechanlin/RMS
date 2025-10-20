from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.conf import settings
import os
import PyPDF2
import io
from openai import OpenAI
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from .models import BaseCV, TailoredResume
from .serializers import BaseCVSerializer, BaseCVUploadSerializer, TailorResumeSerializer, TailoredResumeSerializer as TailoredResumeModelSerializer
from jobs.models import Job
from django.conf import settings

class BaseCVViewSet(viewsets.ModelViewSet):
    """ViewSet for managing base CV uploads"""
    queryset = BaseCV.objects.all()
    serializer_class = BaseCVSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'upload':
            return BaseCVUploadSerializer
        return BaseCVSerializer
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a new base CV file"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            base_cv = serializer.save()
            response_serializer = BaseCVSerializer(base_cv)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the CV file"""
        try:
            base_cv = self.get_object()
            file_path = base_cv.file.path
            
            if os.path.exists(file_path):
                response = FileResponse(
                    open(file_path, 'rb'),
                    content_type=base_cv.content_type
                )
                response['Content-Disposition'] = f'attachment; filename="{base_cv.filename}"'
                return response
            else:
                return Response(
                    {'error': 'File not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except BaseCV.DoesNotExist:
            return Response(
                {'error': 'CV not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the most recently uploaded CV"""
        latest_cv = BaseCV.objects.first()
        if latest_cv:
            serializer = self.get_serializer(latest_cv)
            return Response(serializer.data)
        return Response(
            {'message': 'No CV uploaded yet'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get CV upload statistics"""
        total_cvs = BaseCV.objects.count()
        total_size = sum(cv.file_size for cv in BaseCV.objects.all())
        
        return Response({
            'total_cvs': total_cvs,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'message': f'Total CVs uploaded: {total_cvs}'
        })
    
    @action(detail=True, methods=['get'])
    def extract_text(self, request, pk=None):
        """Extract plain text from the CV for user verification"""
        try:
            base_cv = self.get_object()
            
            # If we have stored extracted text (potentially user-corrected), return that
            if base_cv.extracted_text:
                return Response({
                    'text': base_cv.extracted_text,
                    'filename': base_cv.filename,
                    'message': 'Text retrieved successfully (user-corrected version)',
                    'is_corrected': True
                })
            
            # Otherwise, extract from the original file
            file_path = base_cv.file.path
            if not os.path.exists(file_path):
                return Response(
                    {'error': 'File not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Extract text from the CV file
            with open(file_path, 'rb') as file:
                extracted_text = self._extract_text_from_cv(file)
            
            return Response({
                'text': extracted_text,
                'filename': base_cv.filename,
                'message': 'Text extracted from original file',
                'is_corrected': False
            })
            
        except BaseCV.DoesNotExist:
            return Response(
                {'error': 'CV not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to extract text: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_text(self, request, pk=None):
        """Update the CV text content (for user corrections after text extraction)"""
        try:
            base_cv = self.get_object()
            
            # Get the updated text from request
            updated_text = request.data.get('text', '')
            if not updated_text:
                return Response(
                    {'error': 'Text content is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the updated text (we'll store it in a text field in the model)
            base_cv.extracted_text = updated_text
            base_cv.save()
            
            return Response({
                'message': 'CV text updated successfully',
                'text': updated_text,
                'filename': base_cv.filename
            })
            
        except BaseCV.DoesNotExist:
            return Response(
                {'error': 'CV not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update text: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def tailor_resume(self, request):
        """Tailor resume for a specific company and job description using OpenAI"""
        serializer = TailorResumeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get CV text either from file or directly from text field
            cv_file = serializer.validated_data.get('cv')
            cv_text_input = serializer.validated_data.get('cv_text')
            company = serializer.validated_data['company']
            job_description = serializer.validated_data['job_description']
            additional_feedback = serializer.validated_data.get('additional_feedback', '')
            
            # Extract text from CV based on input type
            if cv_text_input:
                cv_text = cv_text_input
            else:
                cv_text = self._extract_text_from_cv(cv_file)
            
            # Call OpenAI API
            tailored_resume = self._call_openai_api(cv_text, company, job_description, additional_feedback)
            
            # Save tailored resume to file
            tailored_resume_path = self._save_tailored_resume(tailored_resume, company)
            
            # Find the job by company name and save to database
            try:
                job = Job.objects.filter(company__name__icontains=company).first()
                if job:
                    tailored_resume_obj = TailoredResume.objects.create(
                        job=job,
                        file_path=tailored_resume_path,
                        tailored_content=tailored_resume
                    )
            except Exception as e:
                print(f"Warning: Could not save to database: {e}")
            
            return Response({
                'tailored_resume': tailored_resume,
                'file_path': tailored_resume_path,
                'company': company,
                'message': 'Resume tailored successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to tailor resume: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _extract_text_from_cv(self, cv_file):
        """Extract text from uploaded CV file"""
        try:
            # Reset file pointer to beginning
            cv_file.seek(0)
            
            # Get file extension
            file_extension = cv_file.name.split('.')[-1].lower()
            
            if file_extension == 'pdf':
                # Extract text from PDF using PyPDF2
                pdf_reader = PyPDF2.PdfReader(cv_file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
            
            elif file_extension == 'txt':
                # Read text file directly
                text = cv_file.read().decode('utf-8')
                return text.strip()
            
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            raise ValueError(f"Failed to extract text from CV: {str(e)}")
    
    def _call_openai_api(self, cv_text, company, job_description, additional_feedback=None):
        """Call OpenAI API to tailor the resume"""
        try:
            # Initialize OpenAI client with explicit http_client to avoid proxy issues
            import httpx
            http_client = httpx.Client()
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            
            # System prompt for resume tailoring
            system_prompt = """You are an expert resume writer. Create a concise, ATS-friendly, single-page resume tailored to the target role and company, based on the format of the candidate's CV, using keywords from the job description and the candidate's CV. Keep it within one page, prioritize relevant achievements with quantified impact, and use clean sections.

Instructions:
- Output ONLY the final resume text (no commentary).
- Keep it to one page.
- Use strong, quantified bullet points where possible.
- Emphasize keywords from the job description.
- Include sections like Summary, Skills, Experience, Education (and Projects if relevant).
- Remove irrelevant details."""
            
            # User prompt with CV text and job description
            user_prompt = f"""Target Company: {company}

Job Description:
{job_description}

Candidate's Current CV:
{cv_text}"""

            # Add additional feedback if provided
            if additional_feedback and additional_feedback.strip():
                user_prompt += f"""

Additional Feedback for this version:
{additional_feedback.strip()}"""

            user_prompt += "\n\nPlease create a tailored resume for this position."
            
            # Call OpenAI API using the new format
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise ValueError(f"OpenAI API call failed: {str(e)}")
    
    def _save_tailored_resume(self, tailored_resume, company):
        """Save tailored resume to a professionally formatted PDF file"""
        try:
            # Create tailored_resumes directory if it doesn't exist
            tailored_resumes_dir = os.path.join(settings.MEDIA_ROOT, 'tailored_resumes')
            os.makedirs(tailored_resumes_dir, exist_ok=True)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_company = "".join(c for c in company if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_company = safe_company.replace(' ', '_')
            filename = f"tailored_resume_{safe_company}_{timestamp}.pdf"
            
            # Create PDF file with margins
            file_path = os.path.join(tailored_resumes_dir, filename)
            doc = SimpleDocTemplate(
                file_path, 
                pagesize=letter,
                rightMargin=0.75*inch,
                leftMargin=0.75*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch
            )
            
            # Create professional styles
            name_style = ParagraphStyle(
                'NameStyle',
                fontSize=20,
                textColor=colors.HexColor('#2E4057'),
                spaceAfter=4,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold'
            )
            
            contact_style = ParagraphStyle(
                'ContactStyle',
                fontSize=10,
                textColor=colors.HexColor('#666666'),
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName='Helvetica'
            )
            
            section_header_style = ParagraphStyle(
                'SectionHeaderStyle',
                fontSize=14,
                textColor=colors.HexColor('#2E4057'),
                spaceAfter=8,
                spaceBefore=16,
                fontName='Helvetica-Bold',
                borderWidth=0,
                borderColor=colors.HexColor('#2E4057'),
                underlineProportion=0.3,
                underlineGap=2
            )
            
            subsection_style = ParagraphStyle(
                'SubsectionStyle',
                fontSize=11,
                textColor=colors.black,
                spaceAfter=4,
                spaceBefore=8,
                fontName='Helvetica-Bold'
            )
            
            body_style = ParagraphStyle(
                'BodyStyle',
                fontSize=10,
                textColor=colors.black,
                spaceAfter=6,
                leading=14,
                fontName='Helvetica',
                alignment=TA_JUSTIFY
            )
            
            bullet_style = ParagraphStyle(
                'BulletStyle',
                fontSize=10,
                textColor=colors.black,
                spaceAfter=4,
                leading=14,
                fontName='Helvetica',
                leftIndent=20,
                bulletIndent=10
            )
            
            # Parse the tailored resume text into structured sections
            story = []
            lines = [line.strip() for line in tailored_resume.split('\n')]
            
            # Extract structured information
            sections = self._parse_resume_sections(lines)
            
            # Build the PDF with professional formatting
            
            # Header - Name and Contact Info
            if 'name' in sections:
                story.append(Paragraph(sections['name'], name_style))
            
            if 'contact' in sections:
                contact_info = ' | '.join(sections['contact'])
                story.append(Paragraph(contact_info, contact_style))
            
            # Professional Summary
            if 'summary' in sections:
                story.append(Paragraph('<u>PROFESSIONAL SUMMARY</u>', section_header_style))
                summary_text = ' '.join(sections['summary'])
                story.append(Paragraph(summary_text, body_style))
            
            # Skills Section with organized layout
            if 'skills' in sections:
                story.append(Paragraph('<u>CORE COMPETENCIES</u>', section_header_style))
                skills_text = ', '.join(sections['skills'])
                story.append(Paragraph(skills_text, body_style))
            
            # Experience Section with proper formatting
            if 'experience' in sections:
                story.append(Paragraph('<u>PROFESSIONAL EXPERIENCE</u>', section_header_style))
                for exp in sections['experience']:
                    if 'title' in exp and 'company' in exp:
                        title_company = f"<b>{exp['title']}</b> | {exp['company']}"
                        if 'dates' in exp:
                            title_company += f" | {exp['dates']}"
                        story.append(Paragraph(title_company, subsection_style))
                    
                    if 'description' in exp:
                        for bullet in exp['description']:
                            story.append(Paragraph(f"• {bullet}", bullet_style))
                    
                    story.append(Spacer(1, 6))
            
            # Education Section
            if 'education' in sections:
                story.append(Paragraph('<u>EDUCATION</u>', section_header_style))
                for edu in sections['education']:
                    edu_text = f"<b>{edu.get('degree', '')}</b>"
                    if 'school' in edu:
                        edu_text += f" | {edu['school']}"
                    if 'year' in edu:
                        edu_text += f" | {edu['year']}"
                    story.append(Paragraph(edu_text, body_style))
            
            # Projects Section
            if 'projects' in sections:
                story.append(Paragraph('<u>KEY PROJECTS</u>', section_header_style))
                for project in sections['projects']:
                    if isinstance(project, dict):
                        if 'name' in project:
                            story.append(Paragraph(f"<b>{project['name']}</b>", subsection_style))
                        if 'description' in project:
                            for desc in project['description']:
                                story.append(Paragraph(f"• {desc}", bullet_style))
                    else:
                        story.append(Paragraph(f"• {project}", bullet_style))
            
            # Additional sections (Certifications, etc.)
            for section_name, section_content in sections.items():
                if section_name not in ['name', 'contact', 'summary', 'skills', 'experience', 'education', 'projects']:
                    story.append(Paragraph(f'<u>{section_name.upper()}</u>', section_header_style))
                    if isinstance(section_content, list):
                        for item in section_content:
                            story.append(Paragraph(f"• {item}", bullet_style))
                    else:
                        story.append(Paragraph(str(section_content), body_style))
            
            # Build PDF
            doc.build(story)
            
            # Return relative path for API response
            return os.path.join('tailored_resumes', filename)
            
        except Exception as e:
            raise ValueError(f"Failed to save tailored resume: {str(e)}")
    
    def _parse_resume_sections(self, lines):
        """Parse resume text into structured sections"""
        sections = {}
        current_section = None
        current_content = []
        
        # Common section keywords
        section_keywords = {
            'summary': ['summary', 'profile', 'objective', 'overview'],
            'experience': ['experience', 'work', 'employment', 'career'],
            'education': ['education', 'academic', 'degree'],
            'skills': ['skills', 'competencies', 'technologies', 'technical'],
            'projects': ['projects', 'portfolio'],
            'certifications': ['certifications', 'certificates', 'licenses']
        }
        
        name_found = False
        contact_info = []
        
        for i, line in enumerate(lines):
            if not line:
                continue
            
            # First non-empty line is likely the name
            if not name_found and line and not any(keyword in line.lower() for keywords in section_keywords.values() for keyword in keywords):
                sections['name'] = line
                name_found = True
                continue
            
            # Detect contact information (email, phone, address)
            if not current_section and (
                '@' in line or 
                any(char.isdigit() for char in line) and ('(' in line or '-' in line) or
                any(word in line.lower() for word in ['street', 'ave', 'rd', 'blvd', 'city', 'state'])
            ):
                contact_info.append(line)
                continue
            
            # Detect section headers
            is_section_header = False
            for section, keywords in section_keywords.items():
                if any(keyword in line.lower() for keyword in keywords) and (line.isupper() or line.startswith('**') or len(line.split()) <= 3):
                    # Save previous section
                    if current_section and current_content:
                        sections[current_section] = self._process_section_content(current_section, current_content)
                    
                    current_section = section
                    current_content = []
                    is_section_header = True
                    break
            
            if not is_section_header:
                if current_section:
                    current_content.append(line)
                elif contact_info:
                    # If we have contact info, this might be additional contact details
                    if len(contact_info) < 3:  # Limit contact info lines
                        contact_info.append(line)
        
        # Save the last section
        if current_section and current_content:
            sections[current_section] = self._process_section_content(current_section, current_content)
        
        # Add contact info if found
        if contact_info:
            sections['contact'] = contact_info
        
        return sections
    
    def _process_section_content(self, section_type, content):
        """Process content based on section type"""
        if section_type == 'experience':
            return self._parse_experience_entries(content)
        elif section_type == 'education':
            return self._parse_education_entries(content)
        elif section_type == 'projects':
            return self._parse_project_entries(content)
        elif section_type == 'skills':
            # Join skills and split by common delimiters
            skills_text = ' '.join(content)
            skills = [skill.strip() for skill in skills_text.replace('•', ',').replace('-', ',').split(',') if skill.strip()]
            return skills
        else:
            # For summary and other sections, return as list
            return content
    
    def _parse_experience_entries(self, content):
        """Parse experience section into structured entries"""
        entries = []
        current_entry = {}
        
        for line in content:
            # Check if line contains job title and company (usually bold or structured)
            if '|' in line or (' at ' in line and not line.startswith('•') and not line.startswith('-')):
                # Save previous entry
                if current_entry:
                    entries.append(current_entry)
                
                # Parse new entry
                current_entry = {}
                parts = line.split('|') if '|' in line else line.split(' at ')
                current_entry['title'] = parts[0].strip()
                if len(parts) > 1:
                    company_and_date = parts[1].strip()
                    # Try to extract dates (look for years)
                    import re
                    date_pattern = r'\d{4}[-–]\d{4}|\d{4}[-–]Present|Present|\d{4}'
                    dates = re.findall(date_pattern, company_and_date)
                    if dates:
                        current_entry['dates'] = dates[0]
                        current_entry['company'] = re.sub(date_pattern, '', company_and_date).strip(' |-')
                    else:
                        current_entry['company'] = company_and_date
            elif line.startswith('•') or line.startswith('-') or line.startswith('*'):
                # Bullet point - add to current entry description
                if 'description' not in current_entry:
                    current_entry['description'] = []
                bullet_text = line.lstrip('•-* ').strip()
                if bullet_text:
                    current_entry['description'].append(bullet_text)
            elif current_entry and not line.strip().isupper():
                # Continuation of description or additional info
                if 'description' not in current_entry:
                    current_entry['description'] = []
                current_entry['description'].append(line)
        
        # Add last entry
        if current_entry:
            entries.append(current_entry)
        
        return entries
    
    def _parse_education_entries(self, content):
        """Parse education section"""
        entries = []
        for line in content:
            if line and not line.startswith('•'):
                entry = {}
                # Try to parse degree | school | year format
                if '|' in line:
                    parts = [part.strip() for part in line.split('|')]
                    entry['degree'] = parts[0]
                    if len(parts) > 1:
                        entry['school'] = parts[1]
                    if len(parts) > 2:
                        entry['year'] = parts[2]
                else:
                    entry['degree'] = line
                entries.append(entry)
        return entries
    
    def _parse_project_entries(self, content):
        """Parse projects section"""
        entries = []
        current_project = {}
        
        for line in content:
            if not line.startswith('•') and not line.startswith('-') and line:
                # New project
                if current_project:
                    entries.append(current_project)
                current_project = {'name': line, 'description': []}
            elif (line.startswith('•') or line.startswith('-')) and current_project:
                # Project description
                desc = line.lstrip('•- ').strip()
                if desc:
                    current_project['description'].append(desc)
        
        if current_project:
            entries.append(current_project)
        
        return entries

class TailoredResumeViewSet(viewsets.ModelViewSet):
    """ViewSet for retrieving and managing tailored resumes"""
    queryset = TailoredResume.objects.all()
    serializer_class = TailoredResumeModelSerializer
    
    def get_queryset(self):
        """Filter by job if provided"""
        queryset = TailoredResume.objects.all()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Delete a tailored resume and its associated file"""
        try:
            instance = self.get_object()
            
            # Delete the physical file if it exists
            if instance.file_path:
                file_path = os.path.join(settings.MEDIA_ROOT, instance.file_path)
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete the database record
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except TailoredResume.DoesNotExist:
            return Response(
                {'error': 'Tailored resume not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete tailored resume: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def view(self, request, pk=None):
        """Serve the tailored resume file for viewing"""
        try:
            tailored_resume = self.get_object()
            file_path = os.path.join(settings.MEDIA_ROOT, tailored_resume.file_path)
            
            if os.path.exists(file_path):
                response = FileResponse(
                    open(file_path, 'rb'),
                    content_type='application/pdf'
                )
                response['Content-Disposition'] = 'inline; filename="tailored_resume.pdf"'
                response['X-Frame-Options'] = 'SAMEORIGIN'
                return response
            else:
                return Response(
                    {'error': 'File not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except TailoredResume.DoesNotExist:
            return Response(
                {'error': 'Tailored resume not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
