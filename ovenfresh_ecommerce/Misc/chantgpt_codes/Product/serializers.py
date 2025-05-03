from rest_framework import serializers
from .models import (
    Category,
    SubCategory,
    Products,
    ProductVariation,
    Reviews,
    Pincode,
    TimeSlot,
    AvailabilityCharges
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'category_id', 'title']


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'category_id', 'sub_category_id', 'title']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = [
            'id', 'product_id', 'title', 'description', 'photos',
            'category_id', 'sub_category_id', 'created_at'
        ]


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = [
            'id', 'product_id', 'product_variation_id', 'actual_price',
            'discounted_price', 'is_vartied', 'weight_variation', 'created_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reviews
        fields = [
            'id', 'product_id', 'ratings', 'review_text',
            'is_approved_admin', 'created_at'
        ]


class PincodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pincode
        fields = ['id', 'pincode', 'area_name', 'created_at']


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = [
            'id', 'start_time', 'end_time', 'time_slot_title',
            'is_active', 'created_at'
        ]


class AvailabilityChargesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityCharges
        fields = [
            'id', 'product_id', 'product_variation_id',
            'pincode_id', 'timeslot_data',
            'delivery_charges', 'is_available', 'created_at'
        ]
