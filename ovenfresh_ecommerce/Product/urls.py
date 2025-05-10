from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()

router.register(r'category', CategoryViewSet, basename='category')
router.register(r'sub-category', SubCategoryViewSet, basename='sub-category')

router.register(r'product', ProductViewSet, basename='product')
router.register(r'product-variation', ProductVariationViewSet, basename='product-variation')
router.register(r'availability-charges', AvailabilityChargesViewSet, basename='availability-charges')

router.register(r'pincode', PincodeViewSet, basename='pincode')
router.register(r'timeslot', TimeSlotViewSet, basename='timeslot')
router.register(r'pincode-timeslots', TimeSlotAndPincodeViewSet, basename='pincode-timeslots')


urlpatterns = [
    path('', include(router.urls)),
]
