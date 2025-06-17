from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

# Create router and register ViewSets
router = DefaultRouter()
router.register(r'hero-banners', HeroBannerViewSet, basename='hero-banners')
router.register(r'delivery-policy', DeliveryPolicyViewSet, basename='delivery-policy')
router.register(r'homepage-categories', HomepageCategoryViewSet, basename='homepage-categories')
router.register(r'video-content', VideoContentViewSet, basename='video-content')
router.register(r'features', FeatureViewSet, basename='features')
router.register(r'about-section', AboutSectionViewSet, basename='about-section')
router.register(r'product-sections', ProductSectionViewSet, basename='product-sections')
router.register(r'client-logos', ClientLogoViewSet, basename='client-logos')
router.register(r'footer-content', FooterContentViewSet, basename='footer-content')

urlpatterns = [
    # API URLs
    path('', include(router.urls)),
    path('test/', test, name="test")
]
