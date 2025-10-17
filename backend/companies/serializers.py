from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'website', 'industry', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Ensure company name is not empty and properly formatted"""
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be empty")
        return value.strip().title()
