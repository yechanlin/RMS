from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, parsers, generics
from .serializers import CvSerializer
from .models import Cv

class CvUploadView(APIView):
    permission_classes = [permissions.AllowAny] # for public testing change later to [permissions.IsAuthenticated]  
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, format=None):
        serializer = CvSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CvListView(generics.ListAPIView):
    queryset = Cv.objects.all().order_by('-uploaded_at')
    serializer_class = CvSerializer
    permission_classes = [permissions.AllowAny]


class CvDetailView(generics.RetrieveAPIView):
    queryset = Cv.objects.all()
    serializer_class = CvSerializer
    permission_classes = [permissions.AllowAny]