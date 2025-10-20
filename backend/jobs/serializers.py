from rest_framework import serializers
from .models import Job
from companies.serializers import CompanySerializer

class JobSerializer(serializers.ModelSerializer):
    # Include company details in the response
    company_details = CompanySerializer(source='company', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'company', 'company_details',
            'requirements', 'location', 'salary_range', 'job_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        """Ensure job title is not empty and properly formatted"""
        if not value.strip():
            raise serializers.ValidationError("Job title cannot be empty")
        return value.strip()
    
    def validate(self, data):
        """Custom validation for the entire object"""
        # Check if job with same title already exists for this company
        if self.instance is None:  # Only for new jobs, not updates
            title = data.get('title')
            company = data.get('company')
            if title and company:
                if Job.objects.filter(title=title, company=company).exists():
                    raise serializers.ValidationError(
                        f"Job '{title}' already exists at {company.name}"
                    )
        return data
