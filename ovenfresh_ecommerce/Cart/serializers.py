from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = [
            'product_id',
            'product_variation_id',
            'quantity'
        ]

    def to_representation(self, instance):
        return {
            "product_id": instance.product_id,
            "product_variation_id": instance.product_variation_id,
            "quantity": instance.quantity
        }
