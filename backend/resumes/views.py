from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.conf import settings
import os
from .models import BaseCV
from .serializers import BaseCVSerializer, BaseCVUploadSerializer

class BaseCVViewSet(viewsets.ModelViewSet):
    """ViewSet for managing base CV uploads"""
    queryset = BaseCV.objects.all()
    serializer_class = BaseCVSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'upload':
            return BaseCVUploadSerializer
        return BaseCVSerializer
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a new base CV file"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            base_cv = serializer.save()
            response_serializer = BaseCVSerializer(base_cv)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the CV file"""
        try:
            base_cv = self.get_object()
            file_path = base_cv.file.path
            
            if os.path.exists(file_path):
                response = FileResponse(
                    open(file_path, 'rb'),
                    content_type=base_cv.content_type
                )
                response['Content-Disposition'] = f'attachment; filename="{base_cv.filename}"'
                return response
            else:
                return Response(
                    {'error': 'File not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except BaseCV.DoesNotExist:
            return Response(
                {'error': 'CV not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the most recently uploaded CV"""
        latest_cv = BaseCV.objects.first()
        if latest_cv:
            serializer = self.get_serializer(latest_cv)
            return Response(serializer.data)
        return Response(
            {'message': 'No CV uploaded yet'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get CV upload statistics"""
        total_cvs = BaseCV.objects.count()
        total_size = sum(cv.file_size for cv in BaseCV.objects.all())
        
        return Response({
            'total_cvs': total_cvs,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'message': f'Total CVs uploaded: {total_cvs}'
        })
