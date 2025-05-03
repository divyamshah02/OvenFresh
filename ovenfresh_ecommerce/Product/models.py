from django.db import models
from django.utils import timezone


class Category(models.Model):
    category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.category_id} - {self.title}"


class SubCategory(models.Model):
    category_id = models.BigIntegerField()
    sub_category_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.sub_category_id} - {self.title}"


class Products(models.Model):  # Meta information
    product_id = models.BigIntegerField(unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    photos = models.ImageField(upload_to="product_photos/")
    category_id = models.BigIntegerField()
    sub_category_id = models.BigIntegerField(blank=True, null=True)
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
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Variation {self.product_variation_id} of Product {self.product_id}"


class Reviews(models.Model):
    product_id = models.BigIntegerField()
    ratings = models.FloatField()
    review_text = models.TextField(max_length=3000)
    is_approved_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Review for Product {self.product_id}"


class Pincode(models.Model):
    pincode = models.IntegerField(unique=True)  # 6-digit
    area_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.pincode} - {self.area_name}"


class TimeSlot(models.Model):
    start_time = models.TimeField()
    end_time = models.TimeField()
    time_slot_title = models.CharField(max_length=100)
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

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Availability for Product {self.product_id} - Pincode {self.pincode_id}"
