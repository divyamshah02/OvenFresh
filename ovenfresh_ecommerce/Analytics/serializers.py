from rest_framework import serializers

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
