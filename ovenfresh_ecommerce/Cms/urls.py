from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

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

# Additional viewsets for admin functionality
router.register(r'categories', CategoryViewSet, basename='cms-categories')
router.register(r'subcategories', SubCategoryViewSet, basename='cms-subcategories')
router.register(r'products', ProductViewSet, basename='cms-products')

router.register(r'upload-file', FileUploadView, basename='upload-file')

urlpatterns = [
    path('', include(router.urls)),
    path('test/', test, name='cms_test'),
]
