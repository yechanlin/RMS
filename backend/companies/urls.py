from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet

# Create router and register ViewSet
router = DefaultRouter()
router.register(r'', CompanyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
