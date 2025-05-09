from django.urls import path
from . import views

urlpatterns = [
    path('razorpay/checkout/', views.RazorpayCheckoutAPIView.as_view(), name='razorpay-checkout'),
    path('razorpay/confirm/', views.RazorpayPaymentConfirmationAPIView.as_view(), name='razorpay-confirmation'),
]
