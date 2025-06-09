from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()

router.register(r'otp-api', OtpAuthViewSet, basename='otp-api')
router.register(r'update-user-api', UserDetailViewSet, basename='update-user-api')

router.register(r'add-address-api', AddAddressViewSet, basename='add-address-api')

router.register(r'is-user-logged-in-api', IsUserLoggedInViewSet, basename='is-user-logged-in-api')

router.register(r'user-api', UserViewSet, basename='user-api')

router.register(r'login-api', LoginApiViewSet, basename='login-api')
router.register(r'logout-api', LogoutApiViewSet, basename='logout-api')

router.register(r'get-all-user-api', UserListViewSet, basename='get-all-user-api')

router.register(r'address', AddressViewSet, basename='address')

# router.register(r'generate-otp', OTPApiViewSet, basename='generate-otp')
# router.register(r'validate-otp', OTPValidateApiViewSet, basename='validate-otp')


urlpatterns = [
    path('', include(router.urls)),
    
    path('custom-admin/login_to_account', login_to_account, name='login_to_account'),
]
