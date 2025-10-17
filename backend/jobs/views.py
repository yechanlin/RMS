from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Job
from .serializers import JobSerializer

class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing jobs.
    Provides CRUD operations for jobs with company relationships.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    
    def get_queryset(self):
        """Filter jobs by various parameters"""
        queryset = Job.objects.select_related('company').all()
        
        # Filter by company
        company_id = self.request.query_params.get('company', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(company__name__icontains=search)
            )
        
        # Filter by job type
        job_type = self.request.query_params.get('job_type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_company(self, request):
        """Get all jobs for a specific company"""
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response(
                {'error': 'company_id parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        jobs = Job.objects.filter(company_id=company_id)
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get job statistics"""
        total_jobs = Job.objects.count()
        jobs_by_type = {}
        for job_type, _ in Job._meta.get_field('job_type').choices:
            jobs_by_type[job_type] = Job.objects.filter(job_type=job_type).count()
        
        return Response({
            'total_jobs': total_jobs,
            'jobs_by_type': jobs_by_type,
            'message': f'Total jobs in database: {total_jobs}'
        })
