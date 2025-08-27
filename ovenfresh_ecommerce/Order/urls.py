from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
router = DefaultRouter()
router.register(r'place-order-api', OrderViewSet, basename='place-order-api')
router.register(r'confirm-order-api', ConfirmOrderViewSet, basename='confirm-order-api')
router.register(r'payment_status_check', PaymentStatusCheckViewSet, basename='payment-status-check')
router.register(r'confirm-payment-order-api', ConfirmPaymentViewSet, basename='confirm-payment-order-api')


router.register(r'order-detail-api', OrderDetailViewSet, basename='order-detail-api')
router.register(r'all-my-orders-api', OrderListViewSet, basename='all-my-orders-api')

router.register(r'active-timeslots', ActiveTimeSlotsViewSet, basename='active-timeslots')
router.register(r'admin-update-delivery-details', AdminUpdateDeliveryDetailsViewSet, basename='admin-update-delivery-details')

router.register(r'admin-all-orders-api', AdminOrderListViewSet, basename='admin-all-orders-api')
router.register(r'admin-create-order', AdminCreateOrderViewSet, basename='admin-create-order')
router.register(r'admin-order-briefe-api', AdminOrderBriefeViewSet, basename='admin-order-briefe-api')
router.register(r'admin-orders-export-api', AdminExportOrdersViewSet, basename='admin-orders-export-api')

router.register(r'admin-order-detail-api', AdminOrderDetailViewSet, basename='admin-order-detail-api')
router.register(r'admin-update-corporate-status', AdminUpdateCorporateStatusViewSet, basename='admin-update-corporate-status')
router.register(r'admin-update-corporate-order', AdminUpdateCorporateOrderViewSet, basename='admin-update-corporate-order')
router.register(r'admin-delivery-persons-api', AdminDeliveryPeronsViewSet, basename='admin-delivery-persons-api')
router.register(r'admin-update-order-status-api', AdminUpdateOrderStatusViewSet, basename='admin-update-order-status-api')
router.register(r'admin-assign-delivery-api', AdminAssignDeliveryPartnerViewSet, basename='admin-assign-delivery-api')

router.register(r'kitchen_note', KitchenNoteViewSet, basename='kitchen-note')
router.register(r'assign_delivery_partner', AssignDeliveryPartnerViewSet, basename='assign-delivery-partner')
router.register(r'delivery_status', DeliveryStatusViewSet, basename='delivery-status')
router.register(r'cod_approval', CODApprovalViewSet, basename='cod-approval')

router.register(r'generate-invoice', GenerateInvoiceViewSet, basename='generate-invoice')

urlpatterns = [
    path('', include(router.urls)),    
]
