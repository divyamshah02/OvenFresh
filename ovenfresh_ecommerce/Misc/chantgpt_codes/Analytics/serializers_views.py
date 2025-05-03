from rest_framework import viewsets, status
from rest_framework.response import Response
from .serializers import (
    SalesAnalyticsSerializer,
    TopProductSerializer,
    CustomerAnalyticsSerializer,
    DeliveryAnalyticsSerializer,
    TimeSlotAnalyticsSerializer
)
from utils.decorators import handle_exceptions, check_authentication

class AnalyticsViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": "Use /sales, /top-products, /top-customers etc.",
            },
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role='admin')
    def sales(self, request):
        period = request.query_params.get('period', 'monthly')  # weekly / monthly / quarterly
        dummy_data = [
            {
                "period": period,
                "total_orders": 120,
                "total_sales": 48000.0,
                "average_order_value": 400.0
            }
        ]
        data = SalesAnalyticsSerializer(dummy_data, many=True).data
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role='admin')
    def top_products(self, request):
        dummy_data = [
            {
                "product_id": "P001",
                "product_name": "Chocolate Cake",
                "total_quantity": 50,
                "total_sales": 15000.0
            },
            {
                "product_id": "P002",
                "product_name": "Vanilla Cake",
                "total_quantity": 30,
                "total_sales": 9000.0
            }
        ]
        data = TopProductSerializer(dummy_data, many=True).data
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role='admin')
    def top_customers(self, request):
        dummy_data = [
            {
                "user_id": "U001",
                "name": "John Doe",
                "contact_number": "9999999999",
                "total_orders": 12,
                "total_spent": 6000.0
            }
        ]
        data = CustomerAnalyticsSerializer(dummy_data, many=True).data
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role='admin')
    def delivery_insights(self, request):
        dummy_data = [
            {
                "delivery_partner_id": "D001",
                "name": "Ravi",
                "orders_delivered": 40,
                "average_delivery_time": "32 min"
            }
        ]
        data = DeliveryAnalyticsSerializer(dummy_data, many=True).data
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        })

    @handle_exceptions
    @check_authentication(required_role='admin')
    def timeslot_analysis(self, request):
        dummy_data = [
            {
                "timeslot_id": "T001",
                "timeslot": "10 AM - 12 PM",
                "orders_count": 45
            },
            {
                "timeslot_id": "T002",
                "timeslot": "4 PM - 6 PM",
                "orders_count": 30
            }
        ]
        data = TimeSlotAnalyticsSerializer(dummy_data, many=True).data
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        })
