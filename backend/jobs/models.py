from django.db import models

class Job(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='jobs')
    requirements = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    job_type = models.CharField(max_length=50, choices=[
        ('full-time', 'Full Time'),
        ('part-time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ], default='full-time')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['title', 'company']  # Same job title can't exist twice for same company
    
    def __str__(self):
        return f"{self.title} at {self.company.name}"
