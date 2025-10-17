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
