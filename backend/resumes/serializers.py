from rest_framework import serializers
from .models import BaseCV

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
