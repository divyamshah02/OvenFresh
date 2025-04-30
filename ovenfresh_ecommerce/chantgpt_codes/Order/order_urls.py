from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .order_views import (
    OrderViewSet,
    ConfirmOrderViewSet,
    PaymentStatusCheckViewSet,
    KitchenNoteViewSet,
    AssignDeliveryPartnerViewSet,
    DeliveryStatusViewSet,
    CODApprovalViewSet,
)

router = DefaultRouter()
router.register(r'order', OrderViewSet, basename='order')
router.register(r'confirm_order', ConfirmOrderViewSet, basename='confirm-order')
router.register(r'payment_status_check', PaymentStatusCheckViewSet, basename='payment-status-check')
router.register(r'kitchen_note', KitchenNoteViewSet, basename='kitchen-note')
router.register(r'assign_delivery_partner', AssignDeliveryPartnerViewSet, basename='assign-delivery-partner')
router.register(r'delivery_status', DeliveryStatusViewSet, basename='delivery-status')
router.register(r'cod_approval', CODApprovalViewSet, basename='cod-approval')

urlpatterns = [
    path('', include(router.urls)),
]
