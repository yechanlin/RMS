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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
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
    
    @action(detail=False, methods=['post'])
    def tailor_resume(self, request):
        """Tailor resume for a specific company and job description using OpenAI"""
        serializer = TailorResumeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Extract text from uploaded CV
            cv_file = serializer.validated_data['cv']
            company = serializer.validated_data['company']
            job_description = serializer.validated_data['job_description']
            
            # Extract text from CV based on file type
            cv_text = self._extract_text_from_cv(cv_file)
            
            # Call OpenAI API
            tailored_resume = self._call_openai_api(cv_text, company, job_description)
            
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
    
    def _call_openai_api(self, cv_text, company, job_description):
        """Call OpenAI API to tailor the resume"""
        try:
            # Initialize OpenAI client with explicit http_client to avoid proxy issues
            import httpx
            http_client = httpx.Client()
            client = OpenAI(api_key=settings.OPENAI_API_KEY, http_client=http_client)
            
            # System prompt for resume tailoring
            system_prompt = """You are an expert resume writer. Create a concise, ATS-friendly, single-page resume tailored to the target role and company, using keywords from the job description and the candidate's CV. Keep it within one page, prioritize relevant achievements with quantified impact, and use clean sections.

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
{cv_text}

Please create a tailored resume for this position."""
            
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
        """Save tailored resume to PDF file"""
        try:
            # Create tailored_resumes directory if it doesn't exist
            tailored_resumes_dir = os.path.join(settings.MEDIA_ROOT, 'tailored_resumes')
            os.makedirs(tailored_resumes_dir, exist_ok=True)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_company = "".join(c for c in company if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_company = safe_company.replace(' ', '_')
            filename = f"tailored_resume_{safe_company}_{timestamp}.pdf"
            
            # Create PDF file
            file_path = os.path.join(tailored_resumes_dir, filename)
            doc = SimpleDocTemplate(file_path, pagesize=letter)
            
            # Get styles
            styles = getSampleStyleSheet()
            
            # Create custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=12,
                alignment=1  # Center alignment
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=6,
                spaceBefore=12
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=10,
                spaceAfter=6,
                leading=12
            )
            
            # Parse the tailored resume text and create PDF content
            story = []
            lines = tailored_resume.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    story.append(Spacer(1, 6))
                    continue
                
                # Check if it's a title (usually the name at the top)
                if len(line) < 50 and not any(char in line for char in ['•', '-', '*', '|']):
                    if len(story) < 3:  # Likely the name/title
                        story.append(Paragraph(line, title_style))
                    else:
                        story.append(Paragraph(line, heading_style))
                # Check if it's a section heading (usually in caps or with specific patterns)
                elif line.isupper() or line.startswith('**') or any(keyword in line.upper() for keyword in ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'PROJECTS']):
                    clean_line = line.replace('**', '').strip()
                    story.append(Paragraph(clean_line, heading_style))
                else:
                    # Regular content
                    story.append(Paragraph(line, body_style))
            
            # Build PDF
            doc.build(story)
            
            # Return relative path for API response
            return os.path.join('tailored_resumes', filename)
            
        except Exception as e:
            raise ValueError(f"Failed to save tailored resume: {str(e)}")

class TailoredResumeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for retrieving tailored resumes"""
    queryset = TailoredResume.objects.all()
    serializer_class = TailoredResumeModelSerializer
    
    def get_queryset(self):
        """Filter by job if provided"""
        queryset = TailoredResume.objects.all()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
        return queryset
    
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
