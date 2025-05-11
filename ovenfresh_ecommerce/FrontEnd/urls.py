from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *


router = DefaultRouter()
router.register(r'admin-add-product', AdminAddProductViewSet, basename='admin-add-product')  # GET: all active partners

urlpatterns = [
    path('', include(router.urls)),
]
