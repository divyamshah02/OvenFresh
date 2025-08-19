from django.db import models
from django.utils import timezone


class Category(models.Model):
    category_id = models.CharField(max_length=20, unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_extras = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.category_id} - {self.title}"


class SubCategory(models.Model):
    category_id = models.CharField(max_length=20)
    sub_category_id = models.CharField(max_length=20, unique=True)  # 10-digit
    title = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_extras = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sub_category_id} - {self.title}"


class Product(models.Model):  # Meta information
    product_id = models.CharField(max_length=20, unique=True)  # 10-digit
    category_id = models.CharField(max_length=20)
    sub_category_id = models.CharField(max_length=20, blank=True, null=True)
    sub_category_id_list = models.JSONField(default=[], blank=True, null=True)
    title = models.CharField(max_length=255)
    tags = models.CharField(max_length=255, default="", null=True, blank=True)  # Comma-separated tags
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=20, null=True, blank=True)
    hsn = models.CharField(max_length=20, null=True, blank=True)
    features = models.TextField(blank=True, null=True)
    special_note = models.TextField(blank=True, null=True)
    photos = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_veg = models.BooleanField(default=True)  # True for Veg, False for Non-Veg
    ingredients = models.TextField(blank=True, null=True)
    allergen_information = models.TextField(blank=True, null=True)
    storage_instructions = models.TextField(blank=True, null=True)
    is_extras = models.BooleanField(default=False)  # True if product is an extra item (like sauces, etc.)
    slug = models.CharField(max_length=255, unique=True, blank=True, null=True)  # Slug for SEO

    def __str__(self):
        return f"{self.product_id} - {self.title}"


class ProductVariation(models.Model):
    product_id = models.CharField(max_length=20)
    product_variation_id = models.CharField(max_length=20, unique=True)  # 10-digit
    actual_price = models.CharField(max_length=20)
    discounted_price = models.CharField(max_length=20)
    is_vartied = models.BooleanField(default=True)
    weight_variation = models.CharField(max_length=100)  # E.g., "500g"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    stock_toggle_mode = models.BooleanField(default=True)  # True for toggle mode, False for quantity mode
    stock_quantity = models.IntegerField(default=None, null=True) # Quantity-based stock management
    in_stock_bull = models.BooleanField(default=True) # True if in stock, False if out of stock

    def __str__(self):
        return f"Variation {self.product_variation_id} of Product {self.product_id}"
    
    def update_stock(self, quantity_sold):
        """Update stock after an order is placed"""
        if self.stock_quantity is not None:
            # Quantity-based stock management
            self.stock_quantity = max(0, self.stock_quantity - quantity_sold)
            self.in_stock_bull = self.stock_quantity > 0
            self.save()
    
    @property
    def stock_status(self):
        """Returns human-readable stock status"""
        if self.stock_quantity is not None:
            return f"In Stock ({self.stock_quantity})" if self.in_stock_bull else "Out of Stock"
        return "In Stock" if self.in_stock_bull else "Out of Stock"
    
    # def save(self, *args, **kwargs):
    #     """Automatically update in_stock_bull when saving with quantity"""
    #     if self.stock_quantity is not None:
    #         self.in_stock_bull = self.stock_quantity > 0
    #     super().save(*args, **kwargs)

    def save(self, *args, **kwargs):
        """Automatically update in_stock_bull when saving with quantity"""
        if not self.stock_toggle_mode:
            if self.stock_quantity is not None:
                self.in_stock_bull = self.stock_quantity > 0
            else:
                self.in_stock_bull = False
        super().save(*args, **kwargs)

class Reviews(models.Model):
    product_id = models.CharField(max_length=20)
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
    product_id = models.CharField(max_length=20)
    product_variation_id = models.CharField(max_length=20)
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
