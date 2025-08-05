import calendar
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import (
    Count, Sum, Avg, Q, F, Case, When, Value, CharField, ExpressionWrapper
)
from django.db.models.functions import (
    TruncMonth, TruncWeek, TruncDay, TruncQuarter, TruncYear, Concat
)
from django.db.models import Prefetch
from datetime import *
from Order.models import *
from Product.models import *
from UserDetail.models import *
from utils.decorators import *
from .serializers import *


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
                item["product_name"] = "Unknown Products"

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
        timeslot_data = (Order.objects
                         .filter(status="delivered")
                         .values("timeslot_id")
                         .annotate(count=Count("order_id"))
                         .order_by("-count"))

        result = []
        for slot in timeslot_data:
            try:                
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
        
    # Period-based analytics actions
    @action(detail=False, methods=['get'], url_path='daily')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def daily_analytics(self, request):
        return self._periodic_analytics("daily", TruncDay)

    @action(detail=False, methods=['get'], url_path='weekly')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def weekly_analytics(self, request):
        return self._periodic_analytics("weekly", TruncWeek)

    @action(detail=False, methods=['get'], url_path='monthly')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def monthly_analytics(self, request):
        return self._periodic_analytics("monthly", TruncMonth)

    @action(detail=False, methods=['get'], url_path='quarterly')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def quarterly_analytics(self, request):
        return self._periodic_analytics("quarterly", TruncQuarter)

    @action(detail=False, methods=['get'], url_path='yearly')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def yearly_analytics(self, request):
        return self._periodic_analytics("yearly", TruncYear)

    @action(detail=False, methods=['get'], url_path='financial-yearly')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def financial_yearly_analytics(self, request):
        today = datetime.now().date()
        if today.month < 4:  # Financial year starts April 1
            start_date = datetime(today.year - 1, 4, 1).date()
        else:
            start_date = datetime(today.year, 4, 1).date()
        end_date = start_date.replace(year=start_date.year + 1)

        qs = self._get_base_queryset().filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        )

        # Annotate financial year string
        qs = qs.annotate(
            period=Case(
                When(
                    created_at__month__lt=4,
                    then=Concat(
                        Value('FY'),
                        ExpressionWrapper(F('created_at__year') - 1, output_field=CharField()),
                        Value('-'),
                        F('created_at__year'),
                        output_field=CharField()
                    )),
                default=Concat(
                    Value('FY'),
                    F('created_at__year'),
                    Value('-'),
                    ExpressionWrapper(F('created_at__year') + 1, output_field=CharField()),
                    output_field=CharField()
                )
            )
        )

        results = qs.values('period').annotate(
            total_orders=Count('id'),
            total_sales=Sum('total_amount'),
            average_order_value=Avg('total_amount')
        ).order_by('period')

        serializer = SalesAnalyticsSerializer(results, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })

    def _get_base_queryset(self):
        """Base queryset for all periodic analytics"""
        return Order.objects.filter(
            ~Q(status="not_placed"),
            payment_received=True
        )

    def _periodic_analytics(self, period, trunc_func):
        """Handle common periodic analytics logic"""
        today = datetime.now().date()

        if period == "daily":
            start_date = today
            end_date = today + timedelta(days=1)
        elif period == "weekly":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=7)
        elif period == "monthly":
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1)
        elif period == "quarterly":
            quarter = (today.month - 1) // 3 + 1
            start_date = datetime(today.year, 3 * quarter - 2, 1).date()
            last_day = calendar.monthrange(today.year, 3 * quarter)[1]
            end_date = datetime(today.year, 3 * quarter, last_day).date() + timedelta(days=1)
        elif period == "yearly":
            start_date = today.replace(month=1, day=1)
            end_date = start_date.replace(year=start_date.year + 1)
        else:
            return Response({
                "success": False,
                "error": "Invalid period specified"
            }, status=status.HTTP_400_BAD_REQUEST)

        qs = self._get_base_queryset().filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        ).annotate(period=trunc_func('created_at'))

        results = qs.values('period').annotate(
            total_orders=Count('id'),
            total_sales=Sum('total_amount'),
            average_order_value=Avg('total_amount')
        ).order_by('period')

        serializer = SalesAnalyticsSerializer(results, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })

    # @action(detail=False, methods=['get'], url_path='pincodes')
    # @handle_exceptions
    # # @check_authentication(required_role='admin')
    # def pincode_analytics(self, request):
        # Get all pincodes with orders
        pincodes = Pincode.objects.filter(
            pincode__in=Order.objects.values_list('pincode_id', flat=True).distinct()
        )
        # pincodes = Pincode.objects.all() 

        # Prefetch all timeslots for efficiency
        timeslots = TimeSlot.objects.in_bulk(field_name='id')

        response_data = []

        for pincode in pincodes:
            # Convert pincode to string for matching with Order model
            pincode_str = str(pincode.pincode)

            # Get orders for this pincode
            orders = Order.objects.filter(pincode_id=pincode_str)
            order_data = []
            timeslot_details = {}

            for order in orders:
                # Serialize order fields
                order_dict = {field.name: getattr(order, field.name) for field in order._meta.fields}

                order_data.append(order_dict)

            # Serialize pincode data
            pincode_data = {
                'pincode': pincode.pincode,
                'area_name': pincode.area_name,
                'city': pincode.city,
                'state': pincode.state,
                'delivery_charge': pincode.delivery_charge,
                'is_active': pincode.is_active,
                'created_at': pincode.created_at,
                'orders': order_data
            }

            response_data.append(pincode_data)

        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })

    # @action(detail=False, methods=['get'], url_path='areas')
    # @handle_exceptions
    # @check_authentication(required_role='admin')
    # def area_analytics(self, request):
        # Get all distinct area names that have orders
        area_names = Pincode.objects.filter(
            pincode__in=Order.objects.values_list('pincode_id', flat=True).distinct()
        ).values_list('area_name', flat=True).distinct()

        # Prefetch all timeslots and pincodes for efficiency
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        all_pincodes = Pincode.objects.in_bulk(field_name='pincode')
        
        response_data = []
        
        for area_name in area_names:
            # Get all pincodes in this area
            area_pincodes = Pincode.objects.filter(area_name=area_name)
            pincode_data = []
            
            for pincode in area_pincodes:
                pincode_str = str(pincode.pincode)
                
                # Get orders for this pincode
                orders = Order.objects.filter(pincode_id=pincode_str)
                order_data = []
                timeslot_details = {}
                
                for order in orders:
                    # Serialize order fields
                    order_dict = {field.name: getattr(order, field.name) for field in order._meta.fields}
                    
                    # Get timeslot details
                    try:
                        timeslot_id = int(order.timeslot_id)
                        timeslot = timeslots.get(timeslot_id)
                        if timeslot:
                            # Initialize timeslot entry if not exists
                            if timeslot_id not in timeslot_details:
                                timeslot_details[timeslot_id] = {
                                    'timeslot_id': timeslot_id,
                                    'title': timeslot.time_slot_title,
                                    'start_time': timeslot.start_time,
                                    'end_time': timeslot.end_time,
                                    'delivery_charges': pincode.delivery_charge.get(str(timeslot_id)).get("charges"),
                                    'orders_count': 0
                                }
                            # Increment order count for this timeslot
                            timeslot_details[timeslot_id]['orders_count'] += 1
                    except (ValueError, TypeError):
                        # Handle invalid timeslot IDs
                        if order.timeslot_id not in timeslot_details:
                            timeslot_details[order.timeslot_id] = {
                                'error': 'Invalid timeslot ID format'
                            }
                    
                    order_data.append(order_dict)
                
                # Serialize pincode data
                pincode_dict = {
                    'pincode': pincode.pincode,
                    'area_name': pincode.area_name,
                    'city': pincode.city,
                    'state': pincode.state,
                    'delivery_charge': pincode.delivery_charge,
                    'is_active': pincode.is_active,
                    'created_at': pincode.created_at,
                    'orders': order_data,
                    'timeslot_details': timeslot_details
                }
                
                pincode_data.append(pincode_dict)
            
            # Serialize area data
            area_data = {
                'area_name': area_name,
                'pincodes': pincode_data,
                'total_orders': sum(len(p['orders']) for p in pincode_data),
                'total_pincodes': len(pincode_data)
            }
            
            response_data.append(area_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })

    # @action(detail=False, methods=['get'], url_path='categories')
    # @handle_exceptions
    # @check_authentication(required_role='admin')
    # def category_analytics(self, request):
    #     # Get all categories
    #     categories = Category.objects.all()
        
    #     # Prefetch related data for efficiency
    #     # all_products = Product.objects.in_bulk(field_name='product_id')
    #     all_order_items = OrderItem.objects.select_related('order').all()
        
    #     response_data = []
        
    #     for category in categories:
    #         # Get products for this category
    #         products = Product.objects.filter(category_id=category.category_id)
    #         category_products = []
            
    #         for product in products:
    #             # Get order items for this product
    #             product_order_items = [oi for oi in all_order_items if oi.product_id == str(product.product_id)]
    #             product_order_data = []
                
    #             for order_item in product_order_items:
    #                 # Get related order
    #                 order = order_item.order
                    
    #                 # Serialize order item
    #                 order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
    #                 # Serialize order
    #                 order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                    
    #                 product_order_data.append({
    #                     'order_item': order_item_dict,
    #                     'order_details': order_dict
    #                 })
                
    #             # Serialize product
    #             product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                
    #             # Add product variations
    #             variations = ProductVariation.objects.filter(product_id=product.product_id)
    #             variation_data = []
                
    #             for variation in variations:
    #                 variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
    #                 variation_data.append(variation_dict)
                
    #             # Add reviews
    #             reviews = Reviews.objects.filter(product_id=product.product_id)
    #             review_data = []
                
    #             for review in reviews:
    #                 review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
    #                 review_data.append(review_dict)
                
    #             category_products.append({
    #                 'product': product_dict,
    #                 'variations': variation_data,
    #                 'reviews': review_data,
    #                 'orders': product_order_data
    #             })
            
    #         # Serialize category
    #         category_dict = {field.name: getattr(category, field.name) for field in Category._meta.fields}

    #         # Add subcategories
    #         subcategories = SubCategory.objects.filter(category_id=category.category_id)
    #         subcategory_data = []

    #         for subcategory in subcategories:
    #             sub_dict = {field.name: getattr(subcategory, field.name) for field in SubCategory._meta.fields}
    #             subcategory_data.append(sub_dict)

    #         response_data.append({
    #             'category': category_dict,
    #             'subcategories': subcategory_data,
    #             'products': category_products
    #         })
        
    #     return Response({
    #         "success": True,
    #         "data": response_data,
    #         "error": None
    #     })


    # @action(detail=False, methods=['get'], url_path='sub-categories')
    # @handle_exceptions
    # @check_authentication(required_role='admin')
    # def sub_category_analytics(self, request):
    #     # Get all sub-categories
    #     sub_categories = SubCategory.objects.all()
        
    #     # Prefetch related data for efficiency
    #     all_order_items = OrderItem.objects.select_related('order').all()
        
    #     response_data = []
        
    #     for sub_category in sub_categories:
    #         # Get products for this sub - category
    #         products = Product.objects.filter(sub_category_id=sub_category.sub_category_id)
    #         sub_category_products = []
            
    #         for product in products:
    #             # Get order items for this product
    #             product_order_items = [oi for oi in all_order_items if oi.product_id == str(product.product_id)]
    #             product_order_data = []
                
    #             for order_item in product_order_items:
    #                 # Get related order
    #                 order = order_item.order
                    
    #                 # Serialize order item
    #                 order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
    #                 # Serialize order
    #                 order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                    
    #                 product_order_data.append({
    #                     'order_item': order_item_dict,
    #                     'order_details': order_dict
    #                 })
                
    #             # Serialize product
    #             product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                
    #             # Add product variations
    #             variations = ProductVariation.objects.filter(product_id=product.product_id)
    #             variation_data = []
                
    #             for variation in variations:
    #                 variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
    #                 variation_data.append(variation_dict)
                
    #             # Add reviews
    #             reviews = Reviews.objects.filter(product_id=product.product_id)
    #             review_data = []
                
    #             for review in reviews:
    #                 review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
    #                 review_data.append(review_dict)
                
    #             sub_category_products.append({
    #                 'product': product_dict,
    #                 'variations': variation_data,
    #                 'reviews': review_data,
    #                 'orders': product_order_data
    #             })
            
    #         # Serialize category
    #         sub_category_dict = {field.name: getattr(sub_category, field.name) for field in SubCategory._meta.fields}

    #         # Add categories
    #         categories = Category.objects.filter(category_id=sub_category.category_id)
    #         category_data = []

    #         for category in categories:
    #             cat_dict = {field.name: getattr(category, field.name) for field in Category._meta.fields}
    #             category_data.append(cat_dict)

    #         response_data.append({
    #             'subcategories': sub_category_dict,
    #             'category': category_data,
    #             'products': sub_category_products
    #         })
        
    #     return Response({
    #         "success": True,
    #         "data": response_data,
    #         "error": None
    #     })


    # @action(detail=False, methods=['get'], url_path='timeslots')
    # @handle_exceptions
    # @check_authentication(required_role='admin')
    # def timeslot_analytics(self, request):
    #     # Get all timeslots
    #     timeslots = TimeSlot.objects.all()
        
    #     # Prefetch related data for efficiency
    #     all_products = Product.objects.in_bulk(field_name='product_id')
    #     all_variations = ProductVariation.objects.in_bulk(field_name='product_variation_id')
    #     all_pincodes = Pincode.objects.all()
        
    #     response_data = []
        
    #     for timeslot in timeslots:
    #         # Get orders for this timeslot
    #         orders = Order.objects.filter(timeslot_id=str(timeslot.id))
    #         timeslot_orders = []
            
    #         for order in orders:
    #             # Get order items for this order
    #             order_items = OrderItem.objects.filter(order_id=order.order_id)
    #             order_item_data = []
                
    #             for order_item in order_items:
    #                 # Get product details
    #                 try:
    #                     product_id = int(order_item.product_id)
    #                     product = all_products.get(product_id)
    #                     if product:
    #                         product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                            
    #                         # Get product variations
    #                         variations = [v for v in all_variations.values() if v.product_id == product_id]
    #                         variation_data = []
                            
    #                         for variation in variations:
    #                             variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
    #                             variation_data.append(variation_dict)
                            
    #                         # Get reviews for this product
    #                         reviews = Reviews.objects.filter(product_id=product_id)
    #                         review_data = []
                            
    #                         for review in reviews:
    #                             review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
    #                             review_data.append(review_dict)
    #                     else:
    #                         product_dict = {}
    #                         variation_data = []
    #                         review_data = []
    #                 except (ValueError, TypeError):
    #                     product_dict = {}
    #                     variation_data = []
    #                     review_data = []
                    
    #                 # Serialize order item
    #                 order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
    #                 order_item_data.append({
    #                     'order_item': order_item_dict,
    #                     'product': product_dict,
    #                     'variations': variation_data,
    #                     'reviews': review_data
    #                 })
                
    #             # Serialize order
    #             order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                
    #             timeslot_orders.append({
    #                 'order': order_dict,
    #                 'order_items': order_item_data
    #             })
            
    #         # Serialize timeslot
    #         timeslot_dict = {field.name: getattr(timeslot, field.name) for field in TimeSlot._meta.fields}

    #         availability_data = []
            
    #         for pincode in all_pincodes:
    #             delivery_data = pincode.delivery_charge.get(str(timeslot.id))
    #             if delivery_data:
    #                 availability_data.append({
    #                     'pincode': pincode.pincode,
    #                     'area_name': pincode.area_name,
    #                     'city': pincode.city,
    #                     'state': pincode.state,
    #                     'timeslot_charge': delivery_data.get('charges', 0),
    #                     'timeslot_available': delivery_data.get('available', False)
    #                 })
            
    #         response_data.append({
    #             'timeslot': timeslot_dict,
    #             'orders': timeslot_orders,
    #             'availability_charges': availability_data
    #         })
        
    #     return Response({
    #         "success": True,
    #         "data": response_data,
    #         "error": None
    #     })


    # @action(detail=False, methods=['get'], url_path='timeslots')
    # @handle_exceptions
    # @check_authentication(required_role='admin')
    # def product_analytics(self, request):
        # Get all timeslots
        products = Product.objects.all()
        
        # Prefetch related data for efficiency
        all_variations = ProductVariation.objects.in_bulk(field_name='product_variation_id')
        all_pincodes = Pincode.objects.all()
        
        response_data = []
        
        for timeslot in timeslots:
            # Get orders for this timeslot
            orders = Order.objects.filter(timeslot_id=str(timeslot.id))
            timeslot_orders = []
            
            for order in orders:
                # Get order items for this order
                order_items = OrderItem.objects.filter(order_id=order.order_id)
                order_item_data = []
                
                for order_item in order_items:
                    # Get product details
                    try:
                        product_id = int(order_item.product_id)
                        product = all_products.get(product_id)
                        if product:
                            product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                            
                            # Get product variations
                            variations = [v for v in all_variations.values() if v.product_id == product_id]
                            variation_data = []
                            
                            for variation in variations:
                                variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
                                variation_data.append(variation_dict)
                            
                            # Get reviews for this product
                            reviews = Reviews.objects.filter(product_id=product_id)
                            review_data = []
                            
                            for review in reviews:
                                review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
                                review_data.append(review_dict)
                        else:
                            product_dict = {}
                            variation_data = []
                            review_data = []
                    except (ValueError, TypeError):
                        product_dict = {}
                        variation_data = []
                        review_data = []
                    
                    # Serialize order item
                    order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
                    order_item_data.append({
                        'order_item': order_item_dict,
                        'product': product_dict,
                        'variations': variation_data,
                        'reviews': review_data
                    })
                
                # Serialize order
                order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                
                timeslot_orders.append({
                    'order': order_dict,
                    'order_items': order_item_data
                })
            
            # Serialize timeslot
            timeslot_dict = {field.name: getattr(timeslot, field.name) for field in TimeSlot._meta.fields}

            availability_data = []
            
            for pincode in all_pincodes:
                delivery_data = pincode.delivery_charge.get(str(timeslot.id))
                if delivery_data:
                    availability_data.append({
                        'pincode': pincode.pincode,
                        'area_name': pincode.area_name,
                        'city': pincode.city,
                        'state': pincode.state,
                        'timeslot_charge': delivery_data.get('charges', 0),
                        'timeslot_available': delivery_data.get('available', False)
                    })
            
            response_data.append({
                'timeslot': timeslot_dict,
                'orders': timeslot_orders,
                'availability_charges': availability_data
            })
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class PincodeAnalyticsViewSet(viewsets.ViewSet):
    """
    Pincode Analytics with custom order format (includes all pincodes)
    """
    @handle_exceptions
    def list(self, request):
        # Get all orders
        orders = Order.objects.all()
        
        # Get all order items in bulk
        order_items = OrderItem.objects.all()
        order_items_map = {}
        for item in order_items:
            order_items_map.setdefault(item.order_id, []).append(item)
        
        # Get all product IDs
        product_ids = set()
        variation_ids = set()
        for items in order_items_map.values():
            for item in items:
                try:
                    product_ids.add(int(item.product_id))
                    variation_ids.add(int(item.product_variation_id))
                except ValueError:
                    pass
        
        # Get products in bulk
        products = Product.objects.filter(product_id__in=product_ids).in_bulk(field_name='product_id')
        variations = ProductVariation.objects.filter(
            product_variation_id__in=variation_ids
        ).in_bulk(field_name='product_variation_id')
        
        # Get timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        # Group orders by pincode
        orders_by_pincode = {}
        for order in orders:
            pincode = order.pincode_id
            orders_by_pincode.setdefault(pincode, []).append(order)
        
        # Get ALL pincodes
        pincodes = Pincode.objects.all()
        
        response_data = []
        
        for pincode in pincodes:
            pincode_str = str(pincode.pincode)
            pincode_orders = orders_by_pincode.get(pincode_str, [])
            formatted_orders = []
            
            for order in pincode_orders:
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Get order items
                order_items = order_items_map.get(order.order_id, [])
                formatted_items = []
                
                for item in order_items:
                    try:
                        product_id = int(item.product_id)
                        product = products.get(product_id)
                        title = product.title if product else "Unknown Product"
                    except (ValueError, TypeError):
                        title = "Unknown Product"
                        
                    weight_variation = ""
                    try:
                        variation_id = int(item.product_variation_id)
                        variation = variations.get(variation_id)
                        if variation:
                            weight_variation = variation.weight_variation
                    except (ValueError, TypeError):
                        pass
                    
                    formatted_items.append({
                        "title": title,
                        "quantity": item.quantity,
                        "price": float(item.final_amount),
                        "weight_variation": weight_variation
                    })
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            pincode_data = {
                "pincode": pincode.pincode,
                "area_name": pincode.area_name,
                "city": pincode.city,
                "state": pincode.state,
                "delivery_charge": pincode.delivery_charge,
                "is_active": pincode.is_active,
                "created_at": pincode.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(pincode_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class AreaAnalyticsViewSet(viewsets.ViewSet):
    """
    Area Analytics with orders grouped directly by area name
    """
    @handle_exceptions
    def list(self, request):
        # Get all orders
        orders = Order.objects.all()
        
        # Get all order items in bulk
        order_items = OrderItem.objects.all()
        order_items_map = {}
        for item in order_items:
            order_items_map.setdefault(item.order_id, []).append(item)
        
        # Get all product IDs and variation IDs
        product_ids = set()
        variation_ids = set()
        for items in order_items_map.values():
            for item in items:
                try:
                    product_ids.add(int(item.product_id))
                    variation_ids.add(int(item.product_variation_id))
                except ValueError:
                    pass
        
        # Get products and variations in bulk
        products = Product.objects.filter(product_id__in=product_ids).in_bulk(field_name='product_id')
        variations = ProductVariation.objects.filter(
            product_variation_id__in=variation_ids
        ).in_bulk(field_name='product_variation_id')
        
        # Get timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        # Create mapping from pincode to area name
        pincodes = Pincode.objects.all()
        pincode_to_area = {}
        for pincode in pincodes:
            pincode_to_area[str(pincode.pincode)] = pincode.area_name
        
        # Group orders by area name
        orders_by_area = {}
        for order in orders:
            area_name = pincode_to_area.get(order.pincode_id, "Unknown Area")
            if area_name not in orders_by_area:
                orders_by_area[area_name] = []
            orders_by_area[area_name].append(order)
        
        # Get all unique area names
        area_names = set(pincode_to_area.values())
        
        response_data = []
        
        for area_name in area_names:
            area_orders = orders_by_area.get(area_name, [])
            formatted_orders = []
            
            for order in area_orders:
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Get order items
                order_items = order_items_map.get(order.order_id, [])
                formatted_items = []
                
                for item in order_items:
                    try:
                        product_id = int(item.product_id)
                        product = products.get(product_id)
                        title = product.title if product else "Unknown Product"
                    except (ValueError, TypeError):
                        title = "Unknown Product"
                        
                    weight_variation = ""
                    try:
                        variation_id = int(item.product_variation_id)
                        variation = variations.get(variation_id)
                        if variation:
                            weight_variation = variation.weight_variation
                    except (ValueError, TypeError):
                        pass
                    
                    formatted_items.append({
                        "title": title,
                        "quantity": item.quantity,
                        "price": float(item.final_amount),
                        "weight_variation": weight_variation
                    })
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            # Create area data
            area_data = {
                "area_name": area_name,
                "total_orders": len(formatted_orders),
                "orders": formatted_orders
            }
            
            response_data.append(area_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class CategoryAnalyticsViewSet(viewsets.ViewSet):
    """
    Category Analytics with orders containing products from each category
    """
    @handle_exceptions
    def list(self, request):
        # Get all categories
        categories = Category.objects.all()
        
        # Get all products grouped by category
        products_by_category = {}
        all_products = Product.objects.all()
        for product in all_products:
            products_by_category.setdefault(product.category_id, []).append(product)
        
        # Get all order items
        order_items = OrderItem.objects.all()
        
        # Create mapping from product ID to category ID
        product_to_category = {}
        for product in all_products:
            product_to_category[str(product.product_id)] = product.category_id
        
        # Get all orders in bulk
        orders = Order.objects.in_bulk(field_name='order_id')
        
        # Group order items by order ID and category
        orders_by_category = {}
        for item in order_items:
            # Get category for this product
            category_id = product_to_category.get(item.product_id)
            if not category_id:
                continue
                
            # Get order details
            order = orders.get(item.order_id)
            if not order:
                continue
                
            # Add to category orders
            if category_id not in orders_by_category:
                orders_by_category[category_id] = {}
                
            if order.order_id not in orders_by_category[category_id]:
                orders_by_category[category_id][order.order_id] = {
                    'order': order,
                    'items': []
                }
                
            orders_by_category[category_id][order.order_id]['items'].append(item)
        
        # Get timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        response_data = []
        
        for category in categories:
            category_orders = orders_by_category.get(category.category_id, {})
            formatted_orders = []
            
            for order_data in category_orders.values():
                order = order_data['order']
                order_items = order_data['items']
                
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Format order items for this category
                formatted_items = []
                for item in order_items:
                    try:
                        product_id = int(item.product_id)
                        product = products_by_category.get(category.category_id, [])
                        product = next((p for p in product if p.product_id == product_id), None)
                        title = product.title if product else "Unknown Product"
                    except (ValueError, TypeError):
                        title = "Unknown Product"
                    
                    formatted_items.append({
                        "title": title,
                        "quantity": item.quantity,
                        "price": float(item.final_amount)
                    })
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            category_data = {
                "category_id": category.category_id,
                "title": category.title,
                "is_active": category.is_active,
                "created_at": category.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(category_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class SubcategoryAnalyticsViewSet(viewsets.ViewSet):
    """
    Subcategory Analytics with orders containing products from each subcategory
    """
    @handle_exceptions
    def list(self, request):
        # Get all subcategories
        subcategories = SubCategory.objects.all()
        
        # Get all products grouped by subcategory
        products_by_subcategory = {}
        all_products = Product.objects.all()
        for product in all_products:
            if product.sub_category_id:
                products_by_subcategory.setdefault(product.sub_category_id, []).append(product)
        
        # Get all order items
        order_items = OrderItem.objects.all()
        
        # Create mapping from product ID to subcategory ID
        product_to_subcategory = {}
        for product in all_products:
            if product.sub_category_id:
                product_to_subcategory[str(product.product_id)] = product.sub_category_id
        
        # Get all orders in bulk
        orders = Order.objects.in_bulk(field_name='order_id')
        
        # Group order items by order ID and subcategory
        orders_by_subcategory = {}
        for item in order_items:
            # Get subcategory for this product
            subcategory_id = product_to_subcategory.get(item.product_id)
            if not subcategory_id:
                continue
                
            # Get order details
            order = orders.get(item.order_id)
            if not order:
                continue
                
            # Add to subcategory orders
            if subcategory_id not in orders_by_subcategory:
                orders_by_subcategory[subcategory_id] = {}
                
            if order.order_id not in orders_by_subcategory[subcategory_id]:
                orders_by_subcategory[subcategory_id][order.order_id] = {
                    'order': order,
                    'items': []
                }
                
            orders_by_subcategory[subcategory_id][order.order_id]['items'].append(item)
        
        # Get timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        response_data = []
        
        for subcategory in subcategories:
            subcategory_orders = orders_by_subcategory.get(subcategory.sub_category_id, {})
            formatted_orders = []
            
            for order_data in subcategory_orders.values():
                order = order_data['order']
                order_items = order_data['items']
                
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Format order items for this subcategory
                formatted_items = []
                for item in order_items:
                    try:
                        product_id = int(item.product_id)
                        # Get products for this subcategory
                        products = products_by_subcategory.get(subcategory.sub_category_id, [])
                        product = next((p for p in products if p.product_id == product_id), None)
                        title = product.title if product else "Unknown Product"
                    except (ValueError, TypeError):
                        title = "Unknown Product"
                    
                    formatted_items.append({
                        "title": title,
                        "quantity": item.quantity,
                        "price": float(item.final_amount)
                    })
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            # Get category for this subcategory
            category = Category.objects.filter(category_id=subcategory.category_id).first()
            category_title = category.title if category else "Unknown Category"
            
            subcategory_data = {
                "category_id": subcategory.category_id,
                "category_title": category_title,
                "sub_category_id": subcategory.sub_category_id,
                "title": subcategory.title,
                "is_active": subcategory.is_active,
                "created_at": subcategory.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(subcategory_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class TimeslotAnalyticsViewSet(viewsets.ViewSet):
    """
    Timeslot Analytics with orders for each timeslot
    """
    @handle_exceptions
    def list(self, request):
        # Get all timeslots
        timeslots = TimeSlot.objects.all()
        
        # Get all orders
        orders = Order.objects.all()
        
        # Group orders by timeslot_id
        orders_by_timeslot = {}
        for order in orders:
            timeslot_id = order.timeslot_id
            orders_by_timeslot.setdefault(timeslot_id, []).append(order)
        
        # Get all order items
        order_items = OrderItem.objects.all()
        order_items_map = {}
        for item in order_items:
            order_items_map.setdefault(item.order_id, []).append(item)
        
        # Get all product IDs and variation IDs
        product_ids = set()
        variation_ids = set()
        for items in order_items_map.values():
            for item in items:
                try:
                    product_ids.add(int(item.product_id))
                    variation_ids.add(int(item.product_variation_id))
                except ValueError:
                    pass
        
        # Get products and variations in bulk
        products = Product.objects.filter(product_id__in=product_ids).in_bulk(field_name='product_id')
        variations = ProductVariation.objects.filter(
            product_variation_id__in=variation_ids
        ).in_bulk(field_name='product_variation_id')
        
        response_data = []
        
        for timeslot in timeslots:
            timeslot_id_str = str(timeslot.id)
            timeslot_orders = orders_by_timeslot.get(timeslot_id_str, [])
            formatted_orders = []
            
            for order in timeslot_orders:
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Get order items
                order_items = order_items_map.get(order.order_id, [])
                formatted_items = []
                
                for item in order_items:
                    try:
                        product_id = int(item.product_id)
                        product = products.get(product_id)
                        title = product.title if product else "Unknown Product"
                    except (ValueError, TypeError):
                        title = "Unknown Product"
                    
                    # Get weight variation
                    weight_variation = ""
                    try:
                        variation_id = int(item.product_variation_id)
                        variation = variations.get(variation_id)
                        if variation:
                            weight_variation = variation.weight_variation
                    except (ValueError, TypeError):
                        pass
                    
                    formatted_items.append({
                        "title": title,
                        "quantity": item.quantity,
                        "price": float(item.final_amount),
                        "weight_variation": weight_variation
                    })
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            timeslot_data = {
                "timeslot_id": timeslot.id,
                "start_time": timeslot.start_time,
                "end_time": timeslot.end_time,
                "time_slot_title": timeslot.time_slot_title,
                "delivery_charges": timeslot.delivery_charges,
                "is_active": timeslot.is_active,
                "created_at": timeslot.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(timeslot_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class ProductAnalyticsViewSet(viewsets.ViewSet):
    """
    Product Analytics with orders for each product
    """
    @handle_exceptions
    def list(self, request):
        # Get all products
        products = Product.objects.all()
        
        # Get all order items
        order_items = OrderItem.objects.all()
        
        # Group order items by product_id
        order_items_by_product = {}
        for item in order_items:
            product_id = item.product_id
            order_items_by_product.setdefault(product_id, []).append(item)
        
        # Get all orders in bulk
        orders = Order.objects.in_bulk(field_name='order_id')
        
        # Get all timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        # Get all categories and subcategories in bulk
        categories = Category.objects.in_bulk(field_name='category_id')
        subcategories = SubCategory.objects.in_bulk(field_name='sub_category_id')
        
        response_data = []
        
        for product in products:
            product_id_str = str(product.product_id)
            product_order_items = order_items_by_product.get(product_id_str, [])
            formatted_orders = []
            
            for item in product_order_items:
                order = orders.get(item.order_id)
                if not order:
                    continue
                
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Get category and subcategory details
                category = categories.get(product.category_id)
                subcategory = subcategories.get(product.sub_category_id) if product.sub_category_id else None
                
                # Format order items for this product
                formatted_items = [{
                    "quantity": item.quantity,
                    "amount": float(item.amount),
                    "discount": float(item.discount),
                    "final_amount": float(item.final_amount),
                    "created_at": item.created_at
                }]
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            # Format category and subcategory titles
            category_title = category.title if category else "Unknown Category"
            subcategory_title = subcategory.title if subcategory else "No Subcategory"
            
            product_data = {
                "product_id": product.product_id,
                "category_id": product.category_id,
                "category_title": category_title,
                "sub_category_id": product.sub_category_id,
                "subcategory_title": subcategory_title,
                "title": product.title,
                "description": product.description,
                "photos": product.photos,
                "is_active": product.is_active,
                "created_at": product.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(product_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class ProductVariationAnalyticsViewSet(viewsets.ViewSet):
    """
    Product Variation Analytics with orders for each product variation
    """
    @handle_exceptions
    def list(self, request):
        # Get all product variations
        variations = ProductVariation.objects.all()
        
        # Get all order items
        order_items = OrderItem.objects.all()
        
        # Group order items by product_variation_id
        order_items_by_variation = {}
        for item in order_items:
            variation_id = item.product_variation_id
            order_items_by_variation.setdefault(variation_id, []).append(item)
        
        # Get all orders in bulk
        orders = Order.objects.in_bulk(field_name='order_id')
        
        # Get all timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        # Get all products in bulk
        products = Product.objects.in_bulk(field_name='product_id')
        
        response_data = []
        
        for variation in variations:
            variation_id_str = str(variation.product_variation_id)
            variation_order_items = order_items_by_variation.get(variation_id_str, [])
            formatted_orders = []
            
            # Get product details
            product = products.get(variation.product_id)
            product_title = product.title if product else "Unknown Product"
            
            for item in variation_order_items:
                order = orders.get(item.order_id)
                if not order:
                    continue
                
                # Format timeslot
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
                except (ValueError, TypeError, AttributeError):
                    timeslot_time = "Unknown Timeslot"
                
                # Format dates
                delivery_date = order.delivery_date.strftime("%d-%m-%Y")
                order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
                
                # Format order items for this variation
                formatted_items = [{
                    "quantity": item.quantity,
                    "amount": float(item.amount),
                    "discount": float(item.discount),
                    "final_amount": float(item.final_amount),
                    "created_at": item.created_at
                }]
                
                formatted_orders.append({
                    "order_id": order.order_id,
                    "user_id": order.user_id,
                    "pincode_id": order.pincode_id,
                    "timeslot_time": timeslot_time,
                    "first_name": order.first_name,
                    "last_name": order.last_name,
                    "delivery_date": delivery_date,
                    "order_date": order_date,
                    "order_items": formatted_items
                })
            
            variation_data = {
                "product_variation_id": variation.product_variation_id,
                "product_id": variation.product_id,
                "product_title": product_title,
                "actual_price": variation.actual_price,
                "discounted_price": variation.discounted_price,
                "is_vartied": variation.is_vartied,
                "weight_variation": variation.weight_variation,
                "is_active": variation.is_active,
                "created_at": variation.created_at,
                "orders": formatted_orders
            }
            
            response_data.append(variation_data)
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


class PeriodicOrdersViewSet(viewsets.ViewSet):
    """
    Detailed order listings for various time periods
    """
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        return Response({
            "available_actions": [
                "daily",
                "weekly",
                "monthly",
                "quarterly",
                "yearly",
                "financial-yearly"
            ]
        })
    
    @action(detail=False, methods=['get'])
    def daily(self, request):
        return self._periodic_orders("daily", TruncDay)
    
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        return self._periodic_orders("weekly", TruncWeek)
    
    @action(detail=False, methods=['get'])
    def monthly(self, request):
        return self._periodic_orders("monthly", TruncMonth)
    
    @action(detail=False, methods=['get'])
    def quarterly(self, request):
        return self._periodic_orders("quarterly", TruncQuarter)
    
    @action(detail=False, methods=['get'])
    def yearly(self, request):
        return self._periodic_orders("yearly", TruncYear)
    
    @action(detail=False, methods=['get'])
    def financial_yearly(self, request):
        today = datetime.now().date()
        if today.month < 4:  # Financial year starts April 1
            start_date = datetime(today.year - 1, 4, 1).date()
        else:
            start_date = datetime(today.year, 4, 1).date()
        end_date = start_date.replace(year=start_date.year + 1)
        
        orders = self._get_orders_in_date_range(start_date, end_date)
        return self._format_orders(orders, "financial_yearly", start_date, end_date)
    
    def _get_base_queryset(self):
        return Order.objects.filter(
            ~Q(status="not_placed"),
            payment_received=True
        )
    
    def _periodic_orders(self, period, trunc_func):
        today = datetime.now().date()
        
        if period == "daily":
            start_date = today
            end_date = today + timedelta(days=1)
        elif period == "weekly":
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=7)
        elif period == "monthly":
            start_date = today.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1)
        elif period == "quarterly":
            quarter = (today.month - 1) // 3 + 1
            start_date = datetime(today.year, 3 * quarter - 2, 1).date()
            last_day = calendar.monthrange(today.year, 3 * quarter)[1]
            end_date = datetime(today.year, 3 * quarter, last_day).date() + timedelta(days=1)
        elif period == "yearly":
            start_date = today.replace(month=1, day=1)
            end_date = start_date.replace(year=start_date.year + 1)
        else:
            return Response({
                "success": False,
                "error": "Invalid period specified"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        orders = self._get_orders_in_date_range(start_date, end_date)
        return self._format_orders(orders, period, start_date, end_date)
    
    def _get_orders_in_date_range(self, start_date, end_date):
        # Prefetch related order items for efficiency
        return self._get_base_queryset().filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        ).prefetch_related('items')
    
    def _format_orders(self, orders, period, start_date, end_date):
        # Get timeslots in bulk
        timeslots = TimeSlot.objects.in_bulk(field_name='id')
        
        # Get all product IDs and variation IDs
        product_ids = set()
        variation_ids = set()
        for order in orders:
            for item in order.items.all():
                try:
                    product_ids.add(int(item.product_id))
                    variation_ids.add(int(item.product_variation_id))
                except ValueError:
                    pass
        
        # Get products and variations in bulk
        products = Product.objects.filter(product_id__in=product_ids).in_bulk(field_name='product_id')
        variations = ProductVariation.objects.filter(
            product_variation_id__in=variation_ids
        ).in_bulk(field_name='product_variation_id')
        
        formatted_orders = []
        for order in orders:
            # Format timeslot
            try:
                timeslot_id = int(order.timeslot_id)
                timeslot = timeslots.get(timeslot_id)
                timeslot_time = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
            except (ValueError, TypeError, AttributeError):
                timeslot_time = "Unknown Timeslot"
            
            # Format dates
            delivery_date = order.delivery_date.strftime("%d-%m-%Y")
            order_date = order.created_at.strftime("%d, %B %Y - %H:%M")
            
            # Get order items
            formatted_items = []
            for item in order.items.all():
                try:
                    product_id = int(item.product_id)
                    product = products.get(product_id)
                    title = product.title if product else "Unknown Product"
                except (ValueError, TypeError):
                    title = "Unknown Product"
                
                # Get weight variation
                weight_variation = ""
                try:
                    variation_id = int(item.product_variation_id)
                    variation = variations.get(variation_id)
                    if variation:
                        weight_variation = variation.weight_variation
                except (ValueError, TypeError):
                    pass
                
                formatted_items.append({
                    "title": title,
                    "quantity": item.quantity,
                    "price": float(item.final_amount),
                    "weight_variation": weight_variation
                })
            
            formatted_orders.append({
                "order_id": order.order_id,
                "user_id": order.user_id,
                "pincode_id": order.pincode_id,
                "timeslot_time": timeslot_time,
                "first_name": order.first_name,
                "last_name": order.last_name,
                "delivery_date": delivery_date,
                "order_date": order_date,
                "order_items": formatted_items,
                "total_amount": float(order.total_amount),
                "status": order.status
            })
        
        return Response({
            "success": True,
            "data": {
                "period": period,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "order_count": len(formatted_orders),
                "orders": formatted_orders
            },
            "error": None
        })


#########################################################
class DashboardStatsViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard statistics
    """
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get dashboard statistics"""
        try:
            range_type = request.query_params.get('range', '7days')
            start_date, end_date = self.get_date_range(range_type)
            
            # Get previous period for comparison
            period_length = end_date - start_date
            prev_start_date = start_date - period_length
            prev_end_date = start_date
            
            # Current period stats
            current_orders = Order.objects.filter(
                created_at__range=[start_date, end_date]
            )
            
            # Previous period stats
            previous_orders = Order.objects.filter(
                created_at__range=[prev_start_date, prev_end_date]
            )
            
            # Calculate main metrics
            total_orders = current_orders.count()
            prev_total_orders = previous_orders.count()
            
            total_revenue = float(current_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or 0)
            prev_total_revenue = float(previous_orders.aggregate(
                total=Sum('total_amount')
            )['total'] or 0)
            
            # Active customers (customers who placed orders in current period)
            active_customers = current_orders.values('user_id').distinct().count()
            prev_active_customers = previous_orders.values('user_id').distinct().count()
            
            # Total products
            total_products = Product.objects.filter(is_active=True).count()
            active_products = Product.objects.filter(is_active=True).count()
            
            # Calculate percentage changes
            orders_change = self.calculate_percentage_change(total_orders, prev_total_orders)
            revenue_change = self.calculate_percentage_change(total_revenue, prev_total_revenue)
            customers_change = self.calculate_percentage_change(active_customers, prev_active_customers)
            
            # Order status counts
            status_counts = current_orders.values('status').annotate(count=Count('status'))
            status_dict = {item['status']: item['count'] for item in status_counts}
            
            # Payment method counts
            payment_counts = current_orders.values('payment_method').annotate(count=Count('payment_method'))
            payment_dict = {item['payment_method']: item['count'] for item in payment_counts}
            
            # Performance metrics
            delivered_orders = current_orders.filter(status='delivered')
            delivery_success_rate = round(
                (delivered_orders.count() / total_orders * 100) if total_orders > 0 else 0
            )
            
            # Average order value
            avg_order_value = round(total_revenue / total_orders if total_orders > 0 else 0)
            
            # Mock customer satisfaction (you can implement actual rating system)
            customer_satisfaction = 85  # Placeholder
            
            # Mock average delivery time (you can calculate from actual delivery data)
            avg_delivery_time = 45  # Placeholder in minutes
            
            data = {
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'active_customers': active_customers,
                'total_products': total_products,
                'active_products': active_products,
                
                'orders_change': orders_change,
                'revenue_change': revenue_change,
                'customers_change': customers_change,
                
                'pending_orders': status_dict.get('placed', 0) + status_dict.get('confirmed', 0),
                'out_for_delivery': status_dict.get('out_for_delivery', 0),
                'delivered_orders': status_dict.get('delivered', 0),
                'cancelled_orders': status_dict.get('cancelled', 0),
                'cod_orders': payment_dict.get('cod', 0),
                'online_orders': payment_dict.get('razorpay', 0),
                
                'delivery_success_rate': delivery_success_rate,
                'customer_satisfaction': customer_satisfaction,
                'avg_order_value': avg_order_value,
                'avg_delivery_time': avg_delivery_time,
            }
            
            return Response({
                'success': True,
                'data': data,
                'error': None
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'data': None,
                'error': str(e)
            }, status=500)
    
    def get_date_range(self, range_type):
        """Get date range based on range type"""
        now = timezone.now()
        
        if range_type == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif range_type == 'yesterday':
            yesterday = now - timedelta(days=1)
            start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_type == '7days':
            start_date = now - timedelta(days=7)
            end_date = now
        elif range_type == '30days':
            start_date = now - timedelta(days=30)
            end_date = now
        elif range_type == '90days':
            start_date = now - timedelta(days=90)
            end_date = now
        else:
            # Default to last 7 days
            start_date = now - timedelta(days=7)
            end_date = now
            
        return start_date, end_date
    
    def calculate_percentage_change(self, current, previous):
        """Calculate percentage change between two values"""
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)


class DashboardChartsViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard chart data
    """
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get chart data for dashboard"""
        try:
            range_type = request.query_params.get('range', '7days')
            start_date, end_date = self.get_date_range(range_type)
            
            # Sales data for line chart
            sales_data = self.get_sales_chart_data(start_date, end_date, range_type)
            
            # Order status data for pie chart
            order_status_data = self.get_order_status_chart_data(start_date, end_date)
            
            # Delivery areas data for bar chart
            delivery_areas_data = self.get_delivery_areas_chart_data(start_date, end_date)
            
            data = {
                'sales_data': sales_data,
                'order_status_data': order_status_data,
                'delivery_areas_data': delivery_areas_data
            }
            
            return Response({
                'success': True,
                'data': data,
                'error': None
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'data': None,
                'error': str(e)
            }, status=500)
    
    def get_date_range(self, range_type):
        """Get date range based on range type"""
        now = timezone.now()
        
        if range_type == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif range_type == 'yesterday':
            yesterday = now - timedelta(days=1)
            start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_type == '7days':
            start_date = now - timedelta(days=7)
            end_date = now
        elif range_type == '30days':
            start_date = now - timedelta(days=30)
            end_date = now
        elif range_type == '90days':
            start_date = now - timedelta(days=90)
            end_date = now
        else:
            start_date = now - timedelta(days=7)
            end_date = now
            
        return start_date, end_date
    
    def get_sales_chart_data(self, start_date, end_date, range_type):
        """Generate sales chart data"""
        if range_type in ['today', 'yesterday']:
            interval = 'hour'
            date_format = '%H:00'
        elif range_type == '7days':
            interval = 'day'
            date_format = '%m/%d'
        else:
            interval = 'day'
            date_format = '%m/%d'
        
        labels = []
        revenue_data = []
        orders_data = []
        
        current = start_date
        while current <= end_date:
            if interval == 'hour':
                next_period = current + timedelta(hours=1)
                label = current.strftime(date_format)
            else:
                next_period = current + timedelta(days=1)
                label = current.strftime(date_format)
            
            period_orders = Order.objects.filter(
                created_at__gte=current,
                created_at__lt=next_period
            )
            
            labels.append(label)
            revenue_data.append(float(period_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0))
            orders_data.append(period_orders.count())
            
            current = next_period
        
        return {
            'labels': labels,
            'revenue': revenue_data,
            'orders': orders_data
        }
    
    def get_order_status_chart_data(self, start_date, end_date):
        """Generate order status chart data"""
        status_counts = Order.objects.filter(
            created_at__range=[start_date, end_date]
        ).values('status').annotate(count=Count('status'))
        
        status_labels = {
            'placed': 'Placed',
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'ready': 'Ready',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        }
        
        labels = []
        values = []
        
        for item in status_counts:
            labels.append(status_labels.get(item['status'], item['status']))
            values.append(item['count'])
        
        return {
            'labels': labels,
            'values': values
        }
    
    def get_delivery_areas_chart_data(self, start_date, end_date):
        """Generate delivery areas chart data"""
        areas_data = Order.objects.filter(
            created_at__range=[start_date, end_date]
        ).values('pincode_id').annotate(
            count=Count('order_id')
        ).order_by('-count')[:10]
        
        labels = []
        values = []
        
        for area in areas_data:
            labels.append(f"Area {area['pincode_id']}")
            values.append(area['count'])
        
        return {
            'labels': labels,
            'values': values
        }


class RecentOrdersViewSet(viewsets.ViewSet):
    """
    ViewSet for recent orders data
    """
    @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get recent orders for dashboard"""
        try:
            limit = int(request.query_params.get('limit', 10))
            recent_orders = Order.objects.select_related().order_by('-created_at')[:limit]
            
            orders_data = []
            for order in recent_orders:
                orders_data.append({
                    'order_id': order.order_id,
                    'customer_name': f"{order.first_name} {order.last_name}",
                    'phone': order.phone,
                    'total_amount': float(order.total_amount),
                    'status': order.status,
                    'payment_method': order.payment_method,
                    'created_at': order.created_at.isoformat(),
                })
            
            return Response({
                'success': True,
                'data': {'orders': orders_data},
                'error': None
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'data': None,
                'error': str(e)
            }, status=500)


class TopProductsViewSet(viewsets.ViewSet):
    """
    ViewSet for top products data
    """
    # @handle_exceptions
    @check_authentication(required_role='admin')
    def list(self, request):
        """Get top products for dashboard"""
        
        range_type = request.query_params.get('range', '7days')
        limit = int(request.query_params.get('limit', 5))
        start_date, end_date = self.get_date_range(range_type)
        
        # Get top products by order count and revenue
        top_products = OrderItem.objects.filter(
            created_at__range=[start_date, end_date]
        ).values(
            'product_id'
        ).annotate(
            orders_count=Count('order_id', distinct=True),
            total_quantity=Sum('quantity'),
            revenue=Sum('final_amount')
        ).order_by('-revenue')[:limit]
        
        products_data = []
        max_revenue = max([p['revenue'] for p in top_products]) if top_products else 1
        
        for product in top_products:
            try:
                product_name = f"Product {product['product_id']}"  # Placeholder
                # product_obj = Product.objects.get(id=product['product_id'])
                # product_name = product_obj.name
            except:
                product_name = f"Product {product['product_id']}"
            
            products_data.append({
                'product_id': product['product_id'],
                'name': product_name,
                'orders_count': product['orders_count'],
                'total_quantity': product['total_quantity'],
                'revenue': float(product['revenue']),
                # 'percentage': round((float(product['revenue']) / max_revenue) * 100)
                'percentage': 100
            })
        
        return Response({
            'success': True,
            'data': {'products': products_data},
            'error': None
        })

    
    def get_date_range(self, range_type):
        """Get date range based on range type"""
        now = timezone.now()
        
        if range_type == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now
        elif range_type == 'yesterday':
            yesterday = now - timedelta(days=1)
            start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif range_type == '7days':
            start_date = now - timedelta(days=7)
            end_date = now
        elif range_type == '30days':
            start_date = now - timedelta(days=30)
            end_date = now
        elif range_type == '90days':
            start_date = now - timedelta(days=90)
            end_date = now
        else:
            start_date = now - timedelta(days=7)
            end_date = now
            
        return start_date, end_date


class DashboardNotificationsViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard notifications
    """
    
    def list(self, request):
        """Get dashboard notifications"""
        try:
            # Get low stock alerts
            low_stock_products = Product.objects.filter(
                stock_quantity__lt=10,  # Assuming you have stock_quantity field
                is_active=True
            ).count()
            
            # Get pending orders
            pending_orders = Order.objects.filter(
                status__in=['placed', 'confirmed']
            ).count()
            
            # Get orders requiring attention (old pending orders)
            old_pending = Order.objects.filter(
                status__in=['placed', 'confirmed'],
                created_at__lt=timezone.now() - timedelta(hours=2)
            ).count()
            
            notifications = []
            
            if low_stock_products > 0:
                notifications.append({
                    'type': 'warning',
                    'title': 'Low Stock Alert',
                    'message': f'{low_stock_products} products are running low on stock',
                    'action_url': '/admin/products/?filter=low_stock'
                })
            
            if old_pending > 0:
                notifications.append({
                    'type': 'danger',
                    'title': 'Pending Orders',
                    'message': f'{old_pending} orders are pending for more than 2 hours',
                    'action_url': '/admin/orders/?status=pending'
                })
            
            if pending_orders > 0:
                notifications.append({
                    'type': 'info',
                    'title': 'New Orders',
                    'message': f'{pending_orders} orders need processing',
                    'action_url': '/admin/orders/?status=placed'
                })
            
            return Response({
                'success': True,
                'data': {'notifications': notifications},
                'error': None
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'data': None,
                'error': str(e)
            }, status=500)
