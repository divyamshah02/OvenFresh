from django.contrib import admin
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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'category_id', 'title']
    search_fields = ['category_id', 'title']


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'sub_category_id', 'category_id', 'title']
    search_fields = ['sub_category_id', 'title']


@admin.register(Products)
class ProductsAdmin(admin.ModelAdmin):
    list_display = ['id', 'product_id', 'title', 'category_id', 'sub_category_id', 'created_at']
    search_fields = ['product_id', 'title']
    list_filter = ['created_at']


@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'product_id', 'product_variation_id',
        'actual_price', 'discounted_price', 'is_vartied',
        'weight_variation', 'created_at'
    ]
    search_fields = ['product_id', 'product_variation_id']
    list_filter = ['created_at']


@admin.register(Reviews)
class ReviewsAdmin(admin.ModelAdmin):
    list_display = ['id', 'product_id', 'ratings', 'is_approved_admin', 'created_at']
    list_filter = ['ratings', 'is_approved_admin', 'created_at']
    search_fields = ['product_id', 'review_text']


@admin.register(Pincode)
class PincodeAdmin(admin.ModelAdmin):
    list_display = ['id', 'pincode', 'area_name', 'created_at']
    search_fields = ['pincode', 'area_name']
    list_filter = ['created_at']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'start_time', 'end_time', 'time_slot_title', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['time_slot_title']


@admin.register(AvailabilityCharges)
class AvailabilityChargesAdmin(admin.ModelAdmin):
    list_display = ['id', 'product_id', 'product_variation_id', 'pincode_id', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at']
    search_fields = ['product_id', 'product_variation_id']
