from django.urls import path
from .views import AnalyticsViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = router.urls
