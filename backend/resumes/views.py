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
            
            # Load the LaTeX template
            template_path = os.path.join(settings.BASE_DIR, 'resume_template.tex')
            with open(template_path, 'r', encoding='utf-8') as f:
                latex_template = f.read()
            
            # System prompt for resume tailoring with LaTeX template
            system_prompt = f"""You are an expert resume writer and LaTeX specialist. You will tailor a resume to a specific job and company, then output the complete LaTeX code using the provided template.

CRITICAL: Output ONLY raw LaTeX code. Do NOT use markdown formatting, code blocks, or any wrapping. Start directly with \\documentclass and end with \\end{{document}}.

TASK:
1. Analyze the candidate's CV and job description
2. Tailor the content to match the job requirements 
3. Fill in the LaTeX template with the tailored content
4. Output ONLY the complete LaTeX code (no commentary, no markdown, no code blocks)

TEMPLATE TO USE:
{latex_template}

INSTRUCTIONS:
- Replace ALL placeholder content with actual tailored information
- Use the candidate's real name, contact info, and details
- Tailor objective/summary to the specific role and company
- Include only relevant sections (remove Publications if not needed for the role)
- Emphasize keywords from the job description
- Keep achievements quantified where possible
- Ensure all LaTeX syntax is correct and complete
- Output the FULL LaTeX document ready for compilation
- DO NOT wrap in ```latex or ``` - output pure LaTeX code only"""
            
            # User prompt with CV text and job description
            user_prompt = f"""TARGET COMPANY: {company}

JOB DESCRIPTION:
{job_description}

CANDIDATE'S CURRENT CV:
{cv_text}"""

            # Add additional feedback if provided
            if additional_feedback and additional_feedback.strip():
                user_prompt += f"""

ADDITIONAL FEEDBACK FOR THIS VERSION:
{additional_feedback.strip()}"""

            user_prompt += """

Please create a complete LaTeX resume document using the provided template. Fill in ALL sections with relevant, tailored content. Remove sections like Publications if they're not relevant to this role. 

IMPORTANT: Output ONLY the raw LaTeX code starting with \\documentclass and ending with \\end{document}. Do NOT use markdown code blocks or any formatting."""
            
            # Call OpenAI API using the new format
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,  # Increased for LaTeX code
                temperature=0.3
            )
            
            # Clean the response to remove any markdown formatting
            latex_code = response.choices[0].message.content.strip()
            cleaned_latex = self._clean_latex_code(latex_code)
            
            return cleaned_latex
            
        except Exception as e:
            raise ValueError(f"OpenAI API call failed: {str(e)}")
    
    def _clean_latex_code(self, latex_code):
        """Clean LaTeX code by removing markdown formatting and unwanted content"""
        # Remove markdown code blocks
        if latex_code.startswith('```latex'):
            latex_code = latex_code[8:]  # Remove ```latex
        elif latex_code.startswith('```'):
            latex_code = latex_code[3:]   # Remove ```
        
        if latex_code.endswith('```'):
            latex_code = latex_code[:-3]  # Remove trailing ```
        
        # Remove any leading/trailing whitespace
        latex_code = latex_code.strip()
        
        # Ensure it starts with \documentclass
        if not latex_code.startswith('\\documentclass'):
            # Find the first occurrence of \documentclass and start from there
            doc_start = latex_code.find('\\documentclass')
            if doc_start != -1:
                latex_code = latex_code[doc_start:]
        
        # Ensure it ends with \end{document}
        if not latex_code.rstrip().endswith('\\end{document}'):
            # Find the last occurrence of \end{document} and end there
            doc_end = latex_code.rfind('\\end{document}')
            if doc_end != -1:
                latex_code = latex_code[:doc_end + len('\\end{document}')]
        
        return latex_code
    
    def _save_tailored_resume(self, tailored_resume, company):
        """Save tailored resume as LaTeX code (.tex file)"""
        try:
            # Create tailored_resumes directory if it doesn't exist
            tailored_resumes_dir = os.path.join(settings.MEDIA_ROOT, 'tailored_resumes')
            os.makedirs(tailored_resumes_dir, exist_ok=True)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_company = "".join(c for c in company if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_company = safe_company.replace(' ', '_')
            filename = f"tailored_resume_{safe_company}_{timestamp}.tex"
            
            # Save LaTeX code as .tex file
            file_path = os.path.join(tailored_resumes_dir, filename)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(tailored_resume)
            
            # Return relative path for API response
            return os.path.join('tailored_resumes', filename)
            
        except Exception as e:
            raise ValueError(f"Failed to save tailored resume: {str(e)}")


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
