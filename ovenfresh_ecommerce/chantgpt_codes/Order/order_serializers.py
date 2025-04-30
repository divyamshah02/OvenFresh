from rest_framework import serializers
from .order_models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "order_item_id",
            "order_id",
            "product_id",
            "product_variation_id",
            "quantity",
            "amount",
            "discount",
            "final_amount",
            "payment_id",
            "item_note",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "order_id",
            "user_id",
            "pincode_id",
            "timeslot_id",
            "delivery_address",
            "total_amount",
            "payment_method",
            "payment_received",
            "is_cod",
            "order_note",
            "status",
            "payment_id",
            "created_at",
            "items"
        ]

    def get_items(self, obj):
        order_items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(order_items, many=True).data


class KitchenNoteSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["order_id", "items"]

    def get_items(self, obj):
        order_items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(order_items, many=True).data


# Optional: Input validation serializers (if desired later)
class AssignDeliveryPartnerSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    delivery_partner_id = serializers.IntegerField()


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    status = serializers.ChoiceField(choices=["picked_up", "delivered"])


class CODApprovalSerializer(serializers.Serializer):
    order_id = serializers.CharField()
