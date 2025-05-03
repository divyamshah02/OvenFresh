from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .other_views import PincodeViewSet, TimeSlotViewSet, ProductViewSet, ProductVariationViewSet, AvailabilityChargesViewSet

router = DefaultRouter()
router.register(r'pincode', PincodeViewSet, basename='pincode')
router.register(r'timeslot', TimeSlotViewSet, basename='timeslot')
router.register(r'product', ProductViewSet, basename='product')
router.register(r'product-variation', ProductVariationViewSet, basename='product-variation')
router.register(r'availability-charges', AvailabilityChargesViewSet, basename='availability-charges')

urlpatterns = [
    path('api/', include(router.urls)),
]
