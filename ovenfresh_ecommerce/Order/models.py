from django.db import models, transaction

# class Order(models.Model):
#     order_id = models.CharField(max_length=20, unique=True)  # 10-digit custom ID
#     user_id = models.CharField(max_length=20)
#     pincode_id = models.CharField(max_length=20)
#     timeslot_id = models.CharField(max_length=20)

#     status = models.CharField(max_length=30, default="not_placed")  # e.g., not_placed, placed, preparing, delivered
#     total_amount = models.DecimalField(max_digits=10, decimal_places=2)
#     delivery_address = models.TextField()
#     payment_id = models.CharField(max_length=100, null=True, blank=True)  # Payment gateway ID
#     payment_method = models.CharField(max_length=50)
#     is_cod = models.BooleanField(default=False)
#     payment_received = models.BooleanField(default=False)

#     razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
#     razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)

#     assigned_delivery_partner_id = models.CharField(max_length=20, null=True, blank=True)
#     order_note = models.TextField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.order_id


# class OrderItem(models.Model):
#     order_id = models.CharField(max_length=20)
#     product_id = models.CharField(max_length=20)
#     product_variation_id = models.CharField(max_length=20)

#     quantity = models.PositiveIntegerField()
#     amount = models.DecimalField(max_digits=10, decimal_places=2)
#     discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     final_amount = models.DecimalField(max_digits=10, decimal_places=2)

#     payment_id = models.CharField(max_length=100, null=True, blank=True)
#     item_note = models.TextField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"OrderItem ({self.order_id} - {self.product_id})"


class Order(models.Model):
    order_id = models.CharField(max_length=20, unique=True)  # 10-digit custom ID
    order_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    user_id = models.CharField(max_length=20, null=True, blank=True)
    session_id = models.CharField(max_length=40, null=True, blank=True)
    pincode_id = models.CharField(max_length=20)
    timeslot_id = models.CharField(max_length=20)
    
    # Customer details
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    
    # Shipping details
    delivery_date = models.DateField()
    delivery_address = models.TextField()
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_address_id = models.CharField(max_length=20, null=True, blank=True)  # If using saved address
    
    # Billing details
    different_billing_address = models.BooleanField(default=False)
    billing_first_name = models.CharField(max_length=100, null=True, blank=True)
    billing_last_name = models.CharField(max_length=100, null=True, blank=True)
    billing_address = models.TextField(null=True, blank=True)
    billing_city = models.CharField(max_length=100, null=True, blank=True)
    billing_pincode = models.CharField(max_length=10, null=True, blank=True)
    billing_phone = models.CharField(max_length=15, null=True, blank=True)
    billing_alternate_phone = models.CharField(max_length=15, null=True, blank=True)
    
    # Order details
    status = models.CharField(max_length=30, default="not_placed")  # e.g., not_placed, placed, preparing, delivered
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal_amount = models.CharField(max_length=255)
    tax_amount = models.CharField(max_length=255)
    discount_amount = models.CharField(max_length=255, null=True, blank=True)
    coupon_code = models.CharField(max_length=255, null=True, blank=True)
    coupon_discount = models.CharField(max_length=255, null=True, blank=True)
    
    # Payment details
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)  # Payment gateway ID
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)  # Payment gateway ID
    payment_method = models.CharField(max_length=50)  # 'cod' or 'razorpay'
    is_cod = models.BooleanField(default=False)
    payment_received = models.BooleanField(default=False)
    razorpay_link = models.URLField(null=True, blank=True)
    
    # Other details
    assigned_delivery_partner_id = models.CharField(max_length=20, null=True, blank=True)
    assigned_delivery_partner_commission = models.CharField(max_length=20, null=True, blank=True)
    order_note = models.TextField(null=True, blank=True)
    special_instructions = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    delivery_photos = models.JSONField(default=list, blank=True, null=True)
    transport_mode = models.CharField(max_length=255, blank=True, null=True, default="")
    extra_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, null=True, blank=True)
    
    is_corporate = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # When status is "placed" AND order_number is not yet assigned
        if self.status == "placed" and self.order_number is None:
            with transaction.atomic():
                last_order_number = (
                    Order.objects.select_for_update()
                    .filter(order_number__isnull=False)
                    .order_by("-order_number")
                    .values_list("order_number", flat=True)
                    .first()
                )
                self.order_number = (last_order_number + 1) if last_order_number else 3000

        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order_id = models.CharField(max_length=20)
    product_id = models.CharField(max_length=20)
    product_variation_id = models.CharField(max_length=20)

    quantity = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_id = models.CharField(max_length=100, null=True, blank=True)
    item_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OrderItem ({self.order_id} - {self.product_id})"
