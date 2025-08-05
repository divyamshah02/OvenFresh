from django.contrib import admin
from .models import (
    Category,
    SubCategory,
    Product,
    ProductVariation,
    Reviews,
    Pincode,
    TimeSlot,
    AvailabilityCharges,
    Coupon
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'category_id', 'title']
    search_fields = ['category_id', 'title']


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'sub_category_id', 'category_id', 'title']
    search_fields = ['sub_category_id', 'title']


@admin.register(Product)
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
    list_filter = ['area_name']


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['id', 'time_slot_title', 'start_time', 'end_time', 'delivery_charges', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['time_slot_title']


@admin.register(AvailabilityCharges)
class AvailabilityChargesAdmin(admin.ModelAdmin):
    list_display = ['id', 'product_id', 'product_variation_id', 'pincode_id', 'is_available', 'created_at']
    list_filter = ['is_available', 'created_at']
    search_fields = ['product_id', 'product_variation_id']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        'coupon_code', 'discount_type', 'discount_value', 
        'minimum_order_amount', 'usage_count', 'usage_limit',
        'valid_from', 'valid_until', 'is_active'
    ]
    list_filter = ['discount_type', 'is_active', 'valid_from', 'valid_until']
    search_fields = ['coupon_code']
    readonly_fields = ['usage_count', 'created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('coupon_code', 'discount_type', 'discount_value')
        }),
        ('Conditions', {
            'fields': ('minimum_order_amount', 'maximum_discount_amount')
        }),
        ('Usage Limits', {
            'fields': ('usage_limit', 'usage_count')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )
