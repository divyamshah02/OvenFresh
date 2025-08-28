from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()

router.register(r'category', CategoryViewSet, basename='category')
router.register(r'sub-category', SubCategoryViewSet, basename='sub-category')

router.register(r'product', ProductViewSet, basename='product')
router.register(r'all-products', AllProductsViewSet, basename='all-products')
router.register(r'admin-product-tax-rates-api', AdminProductTaxRateViewSet, basename='admin-product-tax-rates-api')
router.register(r'all-shop-products', ShopAllProductsViewSet, basename='all-shop-products')
router.register(r'product-variation', ProductVariationViewSet, basename='product-variation')
router.register(r'availability-charges', AvailabilityChargesViewSet, basename='availability-charges')
# router.register(r'product-maintenance', ProductMaintenanceViewSet, basename='product-maintenance')

router.register(r'all-admin-products', AllProductsAdminViewSet, basename='all-admin-products')

router.register(r'pincode', PincodeViewSet, basename='pincode')
router.register(r'timeslot', TimeSlotViewSet, basename='timeslot')
router.register(r'pincode-timeslots', TimeSlotAndPincodeViewSet, basename='pincode-timeslots')

router.register(r'check-pincode', CheckPincodeViewSet, basename='check-pincode')

# Coupon URLs
router.register(r'coupons', CouponViewSet, basename='coupons')
router.register(r'apply-coupon', ApplyCouponViewSet, basename='apply-coupon')

router.register(r'reviews', ReviewsViewSet, basename='reviews')
router.register(r'admin-reviews', AdminReviewsViewSet, basename='admin-reviews')

router.register(r'product-search', SearchViewSet, basename='product-search')

urlpatterns = [
    path('', include(router.urls)),
    path('test_add_slug', test, name="test_add_slug")
]
