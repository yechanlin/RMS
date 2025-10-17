from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BaseCVViewSet

router = DefaultRouter()
router.register(r'base-cv', BaseCVViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
