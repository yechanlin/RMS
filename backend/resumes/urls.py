from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.CvUploadView.as_view(), name='cv-upload'),
    path('', views.CvListView.as_view(), name='cv-list'),
    path('<int:pk>/', views.CvDetailView.as_view(), name='cv-detail'),
]
