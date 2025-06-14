from rest_framework import serializers
from .models import CartItem

from Product.models import *


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if 'product_id' in representation:
            product_data = Product.objects.filter(product_id=representation['product_id']).first()
            representation['product_image'] = product_data.photos[0]
            representation['product_name'] = product_data.title
        
        if 'product_variation_id' in representation:
            product_varation_data = ProductVariation.objects.filter(product_variation_id=representation['product_variation_id']).first()
            representation['price'] = product_varation_data.discounted_price
            representation['weight'] = product_varation_data.weight_variation

        return representation
