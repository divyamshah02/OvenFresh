from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'cart-api', CartViewSet, basename='cart-api')
router.register(r'transfer-cart-api', CartTransferViewSet, basename='transfer-cart-api')

urlpatterns = [
    path('', include(router.urls)),
]
