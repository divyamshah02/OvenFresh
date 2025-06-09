from django.db import models

class Order(models.Model):
    order_id = models.CharField(max_length=20, unique=True)  # 10-digit custom ID
    user_id = models.CharField(max_length=20)
    pincode_id = models.CharField(max_length=20)
    timeslot_id = models.CharField(max_length=20)

    status = models.CharField(max_length=30, default="not_placed")  # e.g., not_placed, placed, preparing, delivered
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField()
    payment_id = models.CharField(max_length=100, null=True, blank=True)  # Payment gateway ID
    payment_method = models.CharField(max_length=50)
    is_cod = models.BooleanField(default=False)
    payment_received = models.BooleanField(default=False)

    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)

    assigned_delivery_partner_id = models.CharField(max_length=20, null=True, blank=True)
    order_note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

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
