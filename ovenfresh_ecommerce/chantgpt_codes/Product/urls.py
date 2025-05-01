from django.urls import path
from .views import ProductViewSet

product_list = ProductViewSet.as_view({
    'get': 'list',
    'post': 'create',
    'put': 'update',
    'delete': 'destroy',
})

urlpatterns = [
    path('product/', product_list, name='product-list'),
]
