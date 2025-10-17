from django.db import models
from django.core.validators import FileExtensionValidator
import os

def cv_upload_path(instance, filename):
    """Generate upload path for CV files"""
    return f'cvs/{instance.id}_{filename}'

class BaseCV(models.Model):
    """Model to store uploaded base CV files"""
    file = models.FileField(
        upload_to=cv_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt'])],
        help_text="Upload your base CV (PDF, DOC, DOCX, or TXT)"
    )
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    content_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Base CV"
        verbose_name_plural = "Base CVs"
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"Base CV: {self.filename}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.filename = os.path.basename(self.file.name)
            self.file_size = self.file.size
            # Get content type from the file object
            if hasattr(self.file, 'content_type'):
                self.content_type = self.file.content_type
            else:
                # Fallback for when content_type is not available
                import mimetypes
                self.content_type, _ = mimetypes.guess_type(self.file.name)
                if not self.content_type:
                    self.content_type = 'application/octet-stream'
        super().save(*args, **kwargs)

def tailored_resume_upload_path(instance, filename):
    """Generate upload path for tailored resume files"""
    return f'tailored_resumes/{filename}'

class TailoredResume(models.Model):
    """Model to store tailored resume files"""
    job = models.ForeignKey('jobs.Job', on_delete=models.CASCADE, related_name='tailored_resumes')
    file_path = models.CharField(max_length=500)
    tailored_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Tailored Resume"
        verbose_name_plural = "Tailored Resumes"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Tailored Resume for {self.job.title} at {self.job.company.name}"
