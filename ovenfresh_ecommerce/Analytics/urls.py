from django.urls import path
from .views import AnalyticsViewSet, PincodeAnalyticsViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'pincode-analytics', PincodeAnalyticsViewSet, basename='pincode-analytics')

urlpatterns = router.urls
