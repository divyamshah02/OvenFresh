from django.contrib import admin
from .models import Cart, CartItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('cart_id', 'session_id', 'user_id', 'created_at')
    search_fields = ('cart_id', 'session_id', 'user_id')
    list_filter = ('created_at',)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart_id', 'product_id', 'product_variation_id', 'quantity', 'added_at')
    search_fields = ('cart_id', 'product_id', 'product_variation_id')
    list_filter = ('added_at',)
