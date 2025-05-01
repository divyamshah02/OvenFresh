from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from datetime import datetime, timedelta
from Order.models import Order, OrderItem
from Product.models import Product
from UserDetail.models import User
from utils.decorators import handle_exceptions, check_authentication


class AnalyticsViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """
        Query param: type = [sales, top_products, customers, delivery, timeslots]
        Optional param: period = [weekly, monthly, quarterly]
        """
        analytics_type = request.query_params.get('type')
        period = request.query_params.get('period')  # Used for 'sales'

        if analytics_type == "sales":
            return self.sales_summary(period)
        elif analytics_type == "top_products":
            return self.top_products()
        elif analytics_type == "customers":
            return self.customer_insights()
        elif analytics_type == "delivery":
            return self.delivery_performance()
        elif analytics_type == "timeslots":
            return self.timeslot_insights()
        else:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid analytics type."
            }, status=status.HTTP_400_BAD_REQUEST)

    def sales_summary(self, period):
        now = datetime.now()
        if period == "weekly":
            start = now - timedelta(days=7)
        elif period == "monthly":
            start = now.replace(day=1)
        elif period == "quarterly":
            month = (now.month - 1) // 3 * 3 + 1
            start = datetime(now.year, month, 1)
        else:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid or missing period for sales analytics."
            }, status=400)

        orders = Order.objects.filter(created_at__gte=start, status="delivered")

        total_sales = orders.aggregate(total=Sum("total_amount"))["total"] or 0
        order_count = orders.count()
        avg_order_value = total_sales / order_count if order_count else 0

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "period": period,
                "total_sales": total_sales,
                "order_count": order_count,
                "average_order_value": round(avg_order_value, 2)
            },
            "error": None
        })

    def top_products(self):
        top = (OrderItem.objects
            .values("product_id")
            .annotate(quantity_sold=Sum("quantity"), revenue=Sum("final_amount"))
            .order_by("-quantity_sold")[:10])

        for item in top:
            try:
                product = Product.objects.get(product_id=item["product_id"])
                item["product_name"] = product.name
            except:
                item["product_name"] = "Unknown Product"

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": list(top),
            "error": None
        })

    def customer_insights(self):
        orders = Order.objects.all()
        customer_data = orders.values("user_id").annotate(count=Count("order_id"), total=Sum("total_amount"))

        new_customers = customer_data.filter(count=1).count()
        returning_customers = customer_data.filter(count__gt=1).count()

        top_customers = customer_data.order_by("-total")[:10]
        result = []
        for c in top_customers:
            try:
                user = User.objects.get(user_id=c["user_id"])
                result.append({
                    "user_id": user.user_id,
                    "name": user.name,
                    "total_spent": c["total"],
                    "orders": c["count"]
                })
            except:
                continue

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "new_customers": new_customers,
                "returning_customers": returning_customers,
                "top_customers": result
            },
            "error": None
        })

    def delivery_performance(self):
        delivered = Order.objects.filter(status="delivered").count()
        picked_up = Order.objects.filter(status="picked_up").count()
        unassigned = Order.objects.filter(assigned_delivery_partner_id__isnull=True).count()

        by_partner = (Order.objects
                      .filter(status="delivered")
                      .values("assigned_delivery_partner_id")
                      .annotate(count=Count("order_id"))
                      .order_by("-count"))

        result = []
        for dp in by_partner:
            try:
                partner = User.objects.get(user_id=dp["assigned_delivery_partner_id"])
                result.append({
                    "delivery_partner_id": partner.user_id,
                    "name": partner.name,
                    "orders_delivered": dp["count"]
                })
            except:
                continue

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "delivered": delivered,
                "picked_up": picked_up,
                "unassigned_orders": unassigned,
                "partner_stats": result
            },
            "error": None
        })

    def timeslot_insights(self):
        from product.models import TimeSlot  # Assuming timeslot_id points to TimeSlot model

        timeslot_data = (Order.objects
                         .filter(status="delivered")
                         .values("timeslot_id")
                         .annotate(count=Count("order_id"))
                         .order_by("-count"))

        result = []
        for slot in timeslot_data:
            try:
                from product.models import TimeSlot
                ts = TimeSlot.objects.get(timeslot_id=slot["timeslot_id"])
                result.append({
                    "timeslot_id": ts.timeslot_id,
                    "slot": ts.start_time + " - " + ts.end_time,
                    "orders": slot["count"]
                })
            except:
                continue

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": result,
            "error": None
        })
