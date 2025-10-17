from django.contrib import admin
from .models import BaseCV

@admin.register(BaseCV)
class BaseCVAdmin(admin.ModelAdmin):
    list_display = ['filename', 'file_size', 'content_type', 'uploaded_at']
    list_filter = ['content_type', 'uploaded_at']
    search_fields = ['filename']
    readonly_fields = ['filename', 'file_size', 'content_type', 'uploaded_at', 'updated_at']
    ordering = ['-uploaded_at']
    
    fieldsets = (
        ('File Information', {
            'fields': ('file', 'filename', 'file_size', 'content_type')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make file field readonly after creation"""
        if obj:  # editing an existing object
            return self.readonly_fields + ('file',)
        return self.readonly_fields