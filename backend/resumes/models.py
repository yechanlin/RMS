from django.db import models
from django.core.validators import FileExtensionValidator

class Cv(models.Model):
    file = models.FileField(
        upload_to='cv/',
        validators=[FileExtensionValidator(['pdf'])]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)