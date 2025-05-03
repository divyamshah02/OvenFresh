from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AddressViewSet, AdminLoginApiViewSet, OTPApiViewSet, OTPValidateApiViewSet

router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')
router.register(r'address', AddressViewSet, basename='address')
router.register(r'admin-login', AdminLoginApiViewSet, basename='admin-login')
router.register(r'generate-otp', OTPApiViewSet, basename='generate-otp')
router.register(r'validate-otp', OTPValidateApiViewSet, basename='validate-otp')

urlpatterns = router.urls
