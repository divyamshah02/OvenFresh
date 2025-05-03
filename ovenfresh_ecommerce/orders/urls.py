from django.urls import path
from . import views

urlpatterns = [
    path('checkout/', views.CheckoutAPIView.as_view(), name='checkout'),
    path('place-order/', views.PlaceOrderAPIView.as_view(), name='place-order'),
    path('complete-payment/<int:order_id>/', views.CompletePaymentAPIView.as_view(), name='complete-payment'),
    path('orders/', views.OrderListAPIView.as_view(), name='order-list'),
    path('orders/<int:order_id>/', views.OrderDetailAPIView.as_view(), name='order-detail'),
]
