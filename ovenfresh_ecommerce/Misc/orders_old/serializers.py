from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_variation_id', 
            'quantity', 'amount', 'discount', 
            'final_amount', 'payment_id', 'item_note', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'pincode_id', 'timeslot_id', 'status',
            'total_amount', 'delivery_address', 'payment_id',
            'payment_method', 'is_cod', 'payment_recieved',
            'assigned_delivery_partner_id', 'order_note', 'created_at',
            'items',
        ]
        read_only_fields = ['id', 'created_at', 'status', 'payment_recieved', 'payment_id']
