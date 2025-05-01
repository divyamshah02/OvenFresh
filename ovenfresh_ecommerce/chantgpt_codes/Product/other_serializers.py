from rest_framework import serializers
from .models import Pincode, TimeSlot, Product, ProductVariation, AvailabilityCharges

# Serializer for Pincode
class PincodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pincode
        fields = ['id', 'pincode', 'area_name', 'created_at']

# Serializer for TimeSlot
class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'start_time', 'end_time', 'time_slot_title', 'is_active', 'created_at']

# Serializer for Product
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'product_id', 'category_id', 'sub_category_id', 'title', 'description', 'photos', 'created_at']

# Serializer for ProductVariation
class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = ['id', 'product_id', 'product_variation_id', 'actual_price', 'discounted_price', 'is_vartied', 'weight_variation', 'created_at']

# Serializer for AvailabilityCharges
class AvailabilityChargesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityCharges
        fields = ['id', 'product_id', 'product_variation_id', 'pincode_id', 'timeslot_data', 'delivery_charges', 'is_available', 'created_at']
