from rest_framework import serializers
from UserDetail.models import User
from Order.models import Order


class AssignDeliveryPartnerSerializer(serializers.Serializer):
    order_id = serializers.CharField(required=True)
    delivery_partner_id = serializers.CharField(required=True)


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    order_id = serializers.CharField(required=True)
    status = serializers.ChoiceField(choices=["picked_up", "delivered"])


class ConfirmCashSerializer(serializers.Serializer):
    order_id = serializers.CharField(required=True)
