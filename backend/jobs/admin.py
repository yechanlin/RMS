from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'job_type', 'location', 'created_at']
    list_filter = ['job_type', 'company', 'created_at']
    search_fields = ['title', 'description', 'company__name', 'location']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    # Group related fields
    fieldsets = (
        ('Job Information', {
            'fields': ('title', 'description', 'company')
        }),
        ('Details', {
            'fields': ('requirements', 'location', 'salary_range', 'job_type')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
