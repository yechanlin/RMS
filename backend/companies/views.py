from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer

class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing companies.
    Provides CRUD operations for companies.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    
    def get_queryset(self):
        """Filter companies by name if search parameter is provided"""
        queryset = Company.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get company statistics"""
        total_companies = Company.objects.count()
        return Response({
            'total_companies': total_companies,
            'message': f'Total companies in database: {total_companies}'
        })
