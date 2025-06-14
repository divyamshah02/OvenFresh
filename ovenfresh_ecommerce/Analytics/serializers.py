from rest_framework import serializers
from rest_framework import serializers
from Order.models import Order, OrderItem
from Product.models import Product, ProductVariation, TimeSlot
from datetime import datetime


class SalesAnalyticsSerializer(serializers.Serializer):
    period = serializers.CharField()
    total_orders = serializers.IntegerField()
    total_sales = serializers.FloatField()
    average_order_value = serializers.FloatField()


class TopProductSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    product_name = serializers.CharField()
    total_quantity = serializers.IntegerField()
    total_sales = serializers.FloatField()


class CustomerAnalyticsSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    name = serializers.CharField()
    contact_number = serializers.CharField()
    total_orders = serializers.IntegerField()
    total_spent = serializers.FloatField()


class DeliveryAnalyticsSerializer(serializers.Serializer):
    delivery_partner_id = serializers.CharField()
    name = serializers.CharField()
    orders_delivered = serializers.IntegerField()
    average_delivery_time = serializers.CharField()


class TimeSlotAnalyticsSerializer(serializers.Serializer):
    timeslot_id = serializers.CharField()
    timeslot = serializers.CharField()
    orders_count = serializers.IntegerField()


class PincodeAnalyticsSerializer(serializers.Serializer):
    pincode = serializers.IntegerField()
    area_name = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    delivery_charge = serializers.JSONField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    orders = serializers.ListField(child=serializers.DictField())
    timeslot_details = serializers.DictField()

class OrderItemAnalyticsSerializer(serializers.Serializer):
    title = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.FloatField()

class OrderAnalyticsSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    user_id = serializers.CharField()
    pincode_id = serializers.CharField()
    timeslot_time = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    delivery_date = serializers.CharField()
    order_date = serializers.CharField()
    order_items = OrderItemAnalyticsSerializer(many=True)

class PincodeAnalyticsSerializer(serializers.Serializer):
    pincode = serializers.IntegerField()
    area_name = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    orders = OrderAnalyticsSerializer(many=True)


class OrderItemSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['title', 'quantity', 'price']
    
    def get_title(self, obj):
        try:
            product = Product.objects.get(product_id=obj.product_id)
            return product.title
        except Product.DoesNotExist:
            return "Unknown Product"
    
    def get_price(self, obj):
        return float(obj.final_amount)

class PincodeOrderSerializer(serializers.ModelSerializer):
    timeslot_time = serializers.SerializerMethodField()
    delivery_date = serializers.SerializerMethodField()
    order_date = serializers.SerializerMethodField()
    order_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id', 
            'user_id', 
            'pincode_id', 
            'timeslot_time',
            'first_name',
            'last_name',
            'delivery_date',
            'order_date',
            'order_items'
        ]
    
    def get_timeslot_time(self, obj):
        try:
            timeslot = TimeSlot.objects.get(id=int(obj.timeslot_id))
            return f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
        except (ValueError, TypeError, TimeSlot.DoesNotExist):
            return "Unknown Timeslot"
    
    def get_delivery_date(self, obj):
        return obj.delivery_date.strftime("%d-%m-%Y")
    
    def get_order_date(self, obj):
        return obj.created_at.strftime("%d, %B %Y - %H:%M")
    
    def get_order_items(self, obj):
        order_items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(order_items, many=True).data