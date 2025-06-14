from rest_framework import serializers
from .models import Order, OrderItem

from Product.models import TimeSlot


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = "__all__"

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


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed order view"""
    order_items = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    timeslot_name = serializers.SerializerMethodField()
    assigned_delivery_partner_name = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    delivery_charge = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'order_id', 'user_id', 'pincode_id', 'timeslot_id',
            'first_name', 'last_name', 'email', 'phone',
            'delivery_date', 'delivery_address', 'shipping_address_id',
            'different_billing_address', 'billing_first_name', 'billing_last_name',
            'billing_address', 'billing_city', 'billing_pincode',
            'billing_phone', 'billing_alternate_phone',
            'status', 'total_amount', 'payment_id', 'payment_method',
            'is_cod', 'payment_received', 'razorpay_link',
            'assigned_delivery_partner_id', 'order_note', 'special_instructions',
            'created_at', 'order_items', 'customer_name', 'status_display',
            'payment_status', 'timeslot_name', 'assigned_delivery_partner_name',
            'subtotal', 'delivery_charge', 'tax_amount'
        ]
    
    def get_order_items(self, obj):
        """Get all items in the order"""
        items = OrderItem.objects.filter(order_id=obj.order_id)
        return OrderItemSerializer(items, many=True).data
    
    def get_customer_name(self, obj):
        """Get full customer name"""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_status_display(self, obj):
        """Get human-readable status"""
        status_map = {
            'placed': 'Placed',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready for Delivery',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        }
        return status_map.get(obj.status, obj.status)
    
    def get_payment_status(self, obj):
        """Get payment status"""
        if obj.payment_received:
            return "Paid"
        return "Pending"
    
    def get_timeslot_name(self, obj):
        """Get timeslot name"""
        try:
            timeslot = TimeSlot.objects.get(timeslot_id=obj.timeslot_id)
            return timeslot.name
        except TimeSlot.DoesNotExist:
            return "Not specified"
    
    def get_assigned_delivery_partner_name(self, obj):
        """Get delivery partner name"""
        if not obj.assigned_delivery_partner_id:
            return None
        
        # In a real implementation, you would fetch this from your User or DeliveryPartner model
        # For now, we'll return a placeholder
        return f"Delivery Partner {obj.assigned_delivery_partner_id}"
    
    def get_subtotal(self, obj):
        """Calculate order subtotal (before tax and delivery)"""
        items = OrderItem.objects.filter(order_id=obj.order_id)
        return sum(item.final_amount for item in items)
    
    def get_delivery_charge(self, obj):
        """Get delivery charge"""
        # In a real implementation, you might have this stored in the order
        # For now, we'll calculate a placeholder
        return 40.00  # Fixed delivery charge
    
    def get_tax_amount(self, obj):
        """Calculate tax amount"""
        # In a real implementation, you might have this stored in the order
        # For now, we'll calculate a placeholder
        subtotal = self.get_subtotal(obj)
        return round(subtotal * 0.05, 2)  # 5% tax


# Optional: Input validation serializers (if desired later)
class AssignDeliveryPartnerSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    delivery_partner_id = serializers.IntegerField()


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    status = serializers.ChoiceField(choices=["picked_up", "delivered"])


class CODApprovalSerializer(serializers.Serializer):
    order_id = serializers.CharField()
