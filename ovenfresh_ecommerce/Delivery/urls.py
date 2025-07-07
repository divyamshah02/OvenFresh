from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'login', DeliveryLoginViewSet, basename='delivery-login')
router.register(r'dashboard', DeliveryDashboardViewSet, basename='delivery-dashboard')
router.register(r'availability-toggle', DeliveryAvailabilityToggleViewSet, basename='delivery-availability')
router.register(r'delivery-partners', DeliveryPartnerViewSet, basename='delivery-partners')
router.register(r'assign-partner', AssignPartnerViewSet, basename='assign-partner')
router.register(r'update-status', DeliveryStatusViewSet, basename='delivery-status')
router.register(r'my-orders', MyOrdersViewSet, basename='my-orders')
router.register(r'confirm-cash', ConfirmCashViewSet, basename='confirm-cash')
router.register(r'history', DeliveryHistoryViewSet, basename='delivery-history')
router.register(r'admin-delivery-partners-api', AdminDeliveryPartnerManagementViewSet, basename='admin-delivery-partners-api')

urlpatterns = [
    path('', include(router.urls)),
]
