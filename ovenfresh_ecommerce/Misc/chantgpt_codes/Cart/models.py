from django.db import models
from django.utils import timezone


class Cart(models.Model):
    cart_id = models.CharField(max_length=100, unique=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    user_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.cart_id


class CartItem(models.Model):
    cart_id = models.CharField(max_length=100)
    product_id = models.BigIntegerField()
    product_variation_id = models.BigIntegerField()
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.cart_id} - {self.product_id} ({self.product_variation_id})"
