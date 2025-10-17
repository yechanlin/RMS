from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BaseCVViewSet, TailoredResumeViewSet

router = DefaultRouter()
router.register(r'base-cv', BaseCVViewSet)
router.register(r'tailored-resumes', TailoredResumeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('tailor-resume/', BaseCVViewSet.as_view({'post': 'tailor_resume'}), name='tailor-resume'),
]
