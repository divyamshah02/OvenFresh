from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()

router.register(r'', HomeViewSet, basename='home')
# router.register(r'login', HomeViewSet, basename='login')
router.register(r'shop', ShopViewSet, basename='shop')
router.register(r'product-detail', ProductDetailViewSet, basename='product-detail')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'checkout', CheckoutViewSet, basename='checkout')

router.register(r'order-success', OrderSuccessDetailViewSet, basename='order-success')
router.register(r'order-detail', OrderDetailViewSet, basename='order-detail')

router.register(r'account', AccountViewSet, basename='account')

router.register(r'admin-template', AdminTemplateViewSet, basename='admin-template')
router.register(r'admin-dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'admin-cms', AdminCmsViewSet, basename='admin-cms')
router.register(r'admin-products', AdminAllProductViewSet, basename='admin-products')
router.register(r'admin-add-product', AdminAddProductViewSet, basename='admin-add-product')
router.register(r'admin-category', AdminManageCategoryViewSet, basename='admin-category')
router.register(r'admin-pincodes', AdminPincodeViewSet, basename='admin-pincodes')
router.register(r'admin-timeslot', AdminTimeslotViewSet, basename='admin-timeslot')
router.register(r'admin-coupon', AdminCouponViewSet, basename='admin-coupon')
router.register(r'admin-delivery-person', AdminDeliverPersonViewSet, basename='admin-delivery-person')

router.register(r'admin-all-orders', AdminAllOrdersViewSet, basename='admin-all-orders')
router.register(r'admin-order-detail', AdminOrderDetailViewSet, basename='admin-order-detail')
router.register(r'admin-pincode-order', AdminPincodeOrderDetailViewSet, basename='admin-pincode-order')



router.register(r'delivery-login', DeliveryLoginViewSet, basename='delivery-login')
router.register(r'delivery-dashobard', DeliveryDashboardViewSet, basename='delivery-dashobard')

# # Delivery URLs
# path('delivery/login/', DeliveryLoginViewSet.as_view({'get': 'list'}), name='delivery-login'),
# path('delivery/dashboard/', DeliveryDashboardViewSet.as_view({'get': 'list'}), name='delivery-dashboard'),


urlpatterns = [
    path('', include(router.urls)),
    path("payment-success-callback/", payment_success_callback, name="payment-success-callback"),
    path('admin-login/', admin_login, name='admin_login'),
]
