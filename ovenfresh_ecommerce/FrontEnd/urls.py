from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()
router.register(r'admin-template', AdminTemplateViewSet, basename='admin-template')
router.register(r'admin-products', AdminAllProductViewSet, basename='admin-products')
router.register(r'admin-add-product', AdminAddProductViewSet, basename='admin-add-product')
router.register(r'admin-category', AdminManageCategoryViewSet, basename='admin-category')
router.register(r'admin-pincodes', AdminPincodeViewSet, basename='admin-pincodes')
router.register(r'admin-timeslot', AdminTimeslotViewSet, basename='admin-timeslot')

urlpatterns = [
    path('', include(router.urls)),
]
