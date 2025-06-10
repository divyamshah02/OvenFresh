from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
router = DefaultRouter()
router.register(r'place-order-api', OrderViewSet, basename='place-order-api')
router.register(r'confirm-order-api', ConfirmOrderViewSet, basename='confirm-order-api')
router.register(r'payment_status_check', PaymentStatusCheckViewSet, basename='payment-status-check')

router.register(r'order-detail-api', OrderDetailViewSet, basename='order-detail-api')
router.register(r'all-my-orders-api', OrderListViewSet, basename='all-my-orders-api')

router.register(r'kitchen_note', KitchenNoteViewSet, basename='kitchen-note')
router.register(r'assign_delivery_partner', AssignDeliveryPartnerViewSet, basename='assign-delivery-partner')
router.register(r'delivery_status', DeliveryStatusViewSet, basename='delivery-status')
router.register(r'cod_approval', CODApprovalViewSet, basename='cod-approval')

urlpatterns = [
    path('', include(router.urls)),    
]
