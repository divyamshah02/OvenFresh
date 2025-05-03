from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DeliveryPartnerViewSet,
    AssignPartnerViewSet,
    DeliveryStatusViewSet,
    MyOrdersViewSet,
    ConfirmCashViewSet,
)

router = DefaultRouter()
router.register(r'partners', DeliveryPartnerViewSet, basename='delivery-partners')  # GET: all active partners
router.register(r'assign', AssignPartnerViewSet, basename='assign-delivery')       # POST: assign order
router.register(r'status', DeliveryStatusViewSet, basename='delivery-status') # POST: picked_up / delivered
router.register(r'my-orders', MyOrdersViewSet, basename='my-delivery-orders') # GET: orders for delivery user
router.register(r'cod-confirm', ConfirmCashViewSet, basename='cod-confirm')      # POST: confirm COD payment

urlpatterns = [
    path('', include(router.urls)),
]
