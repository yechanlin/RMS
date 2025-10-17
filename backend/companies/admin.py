from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'website', 'created_at']
    list_filter = ['industry', 'created_at']
    search_fields = ['name', 'description', 'industry']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']
