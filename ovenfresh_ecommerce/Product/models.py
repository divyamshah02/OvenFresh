from django.db import models
from django.utils import timezone


class Category(models.Model):
    category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.category_id} - {self.title}"


class SubCategory(models.Model):
    category_id = models.BigIntegerField()
    sub_category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.sub_category_id} - {self.title}"


class Product(models.Model):  # Meta information
    product_id = models.BigIntegerField(unique=True)  # 10-digit
    category_id = models.BigIntegerField()
    sub_category_id = models.BigIntegerField(blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    photos = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.product_id} - {self.title}"


class ProductVariation(models.Model):
    product_id = models.BigIntegerField()
    product_variation_id = models.BigIntegerField(unique=True)  # 10-digit
    actual_price = models.CharField(max_length=20)
    discounted_price = models.CharField(max_length=20)
    is_vartied = models.BooleanField(default=True)
    weight_variation = models.CharField(max_length=100)  # E.g., "500g"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Variation {self.product_variation_id} of Product {self.product_id}"


class Reviews(models.Model):
    product_id = models.BigIntegerField()
    ratings = models.FloatField()
    review_text = models.TextField(max_length=3000)
    is_approved_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Review for Product {self.product_id}"


class Pincode(models.Model):
    pincode = models.IntegerField(unique=True)  # 6-digit
    area_name = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    delivery_charge = models.JSONField(default=dict, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.pincode} - {self.area_name}"


class TimeSlot(models.Model):
    start_time = models.CharField(max_length=10)
    end_time = models.CharField(max_length=10)
    time_slot_title = models.CharField(max_length=100)
    delivery_charges = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.time_slot_title


class AvailabilityCharges(models.Model):
    product_id = models.BigIntegerField()
    product_variation_id = models.BigIntegerField()
    pincode_id = models.IntegerField()
    
    # Store as JSON: { "1": { "available": true, "charge": 50 }, ... }
    timeslot_data = models.JSONField(default=dict)

    delivery_charges = models.CharField(max_length=20, blank=True, null=True)
    is_available = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Availability for Product {self.product_id} - Pincode {self.pincode_id}"


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    coupon_code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maximum_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)  # Total usage limit
    usage_count = models.IntegerField(default=0)  # Current usage count
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.coupon_code} - {self.discount_value}{'%' if self.discount_type == 'percentage' else '₹'}"
    
    def is_valid(self):
        now = timezone.now()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            (self.usage_limit is None or self.usage_count < self.usage_limit)
        )
    
    def calculate_discount(self, order_amount):
        if not self.is_valid() or order_amount < self.minimum_order_amount:
            return 0
        
        if self.discount_type == 'percentage':
            discount = (order_amount * self.discount_value) / 100
            if self.maximum_discount_amount:
                discount = min(discount, self.maximum_discount_amount)
        else:
            discount = self.discount_value
        
        return min(discount, order_amount)
