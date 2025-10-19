from rest_framework import serializers
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'website', 'industry', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Ensure company name is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Company name cannot be empty")
        return value.strip()
    
    def validate(self, data):
        """Custom validation for the entire object"""
        # Check for duplicate company names
        if 'name' in data:
            name = data['name'].strip()
            # Check if this is an update (instance exists) or create (no instance)
            if hasattr(self, 'instance') and self.instance:
                # This is an update - exclude current instance from uniqueness check
                if Company.objects.exclude(pk=self.instance.pk).filter(name__iexact=name).exists():
                    raise serializers.ValidationError({
                        'name': f"A company with the name '{name}' already exists. Company names must be unique."
                    })
            else:
                # This is a create - check if any company with this name exists
                if Company.objects.filter(name__iexact=name).exists():
                    raise serializers.ValidationError({
                        'name': f"A company with the name '{name}' already exists. Company names must be unique."
                    })
        
        return data
