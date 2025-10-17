from rest_framework import serializers
from .models import BaseCV, TailoredResume

class BaseCVSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseCV
        fields = ['id', 'filename', 'file_size', 'content_type', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'filename', 'file_size', 'content_type', 'uploaded_at', 'updated_at']

class BaseCVUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaseCV
        fields = ['file']
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        # Check file extension
        allowed_extensions = ['pdf', 'doc', 'docx', 'txt']
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value

class TailorResumeSerializer(serializers.Serializer):
    """Serializer for tailoring resume endpoint"""
    cv = serializers.FileField(help_text="Upload your CV (PDF or TXT)")
    company = serializers.CharField(max_length=255, help_text="Target company name")
    job_description = serializers.CharField(help_text="Full job description")
    
    def validate_cv(self, value):
        """Validate uploaded CV file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        # Check file extension
        allowed_extensions = ['pdf', 'txt']
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def validate_company(self, value):
        """Validate company name"""
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be empty")
        return value.strip()
    
    def validate_job_description(self, value):
        """Validate job description"""
        if not value.strip():
            raise serializers.ValidationError("Job description cannot be empty")
        return value.strip()

class TailoredResumeSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    
    class Meta:
        model = TailoredResume
        fields = ['id', 'job', 'job_title', 'company_name', 'file_path', 'tailored_content', 'created_at']
        read_only_fields = ['id', 'created_at']