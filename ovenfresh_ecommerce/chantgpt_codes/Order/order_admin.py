from django.contrib import admin
from .order_models import Order, OrderItem

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_id', 'user', 'status', 'payment_received',
        'payment_method', 'total_amount', 'created_at'
    )
    list_filter = ('status', 'payment_received', 'payment_method', 'is_cod')
    search_fields = ('order_id', 'user__name', 'delivery_address')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order', 'product', 'product_variation', 'quantity',
        'final_amount', 'payment_id'
    )
    list_filter = ('product', 'product_variation')
    search_fields = ('order__order_id', 'product__name', 'product_variation__variation')
    ordering = ('-order__created_at',)
