import calendar
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import (
    Count, Sum, Avg, Q, F, Case, When, Value, CharField, ExpressionWrapper
)
from django.db.models.functions import (
    TruncMonth, TruncWeek, TruncDay, TruncQuarter, TruncYear, Concat
)
from datetime import datetime, timedelta
from Order.models import Order, OrderItem
from Product.models import Category, Pincode, Product, ProductVariation, Reviews, SubCategory, TimeSlot
from UserDetail.models import User
from utils.decorators import handle_exceptions, check_authentication
from .serializers import (
    SalesAnalyticsSerializer,
    TopProductSerializer,
    CustomerAnalyticsSerializer,
    DeliveryAnalyticsSerializer,
    TimeSlotAnalyticsSerializer,
    PincodeAnalyticsSerializer
)


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

    @action(detail=False, methods=['get'], url_path='pincodes')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def pincode_analytics(self, request):
        # Get all pincodes with orders
        pincodes = Pincode.objects.filter(
            pincode__in=Order.objects.values_list('pincode_id', flat=True).distinct()
        )

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

                # Get timeslot details
                try:
                    timeslot_id = int(order.timeslot_id)
                    timeslot = timeslots.get(timeslot_id)
                    if timeslot:
                        timeslot_details[timeslot_id] = {
                            'timeslot_id': timeslot_id,
                            'title': timeslot.time_slot_title,
                            'start_time': timeslot.start_time,
                            'end_time': timeslot.end_time,
                            'delivery_charges': pincode.delivery_charge.get(str(timeslot_id)).get("charges")
                        }
                except (ValueError, TypeError):
                    timeslot_details[order.timeslot_id] = {
                        'error': 'Invalid timeslot ID format'
                    }

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
                'orders': order_data,
                'timeslot_details': timeslot_details
            }

            response_data.append(pincode_data)

        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })

    @action(detail=False, methods=['get'], url_path='areas')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def area_analytics(self, request):
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

    @action(detail=False, methods=['get'], url_path='categories')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def category_analytics(self, request):
        # Get all categories
        categories = Category.objects.all()
        
        # Prefetch related data for efficiency
        # all_products = Product.objects.in_bulk(field_name='product_id')
        all_order_items = OrderItem.objects.select_related('order').all()
        
        response_data = []
        
        for category in categories:
            # Get products for this category
            products = Product.objects.filter(category_id=category.category_id)
            category_products = []
            
            for product in products:
                # Get order items for this product
                product_order_items = [oi for oi in all_order_items if oi.product_id == str(product.product_id)]
                product_order_data = []
                
                for order_item in product_order_items:
                    # Get related order
                    order = order_item.order
                    
                    # Serialize order item
                    order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
                    # Serialize order
                    order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                    
                    product_order_data.append({
                        'order_item': order_item_dict,
                        'order_details': order_dict
                    })
                
                # Serialize product
                product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                
                # Add product variations
                variations = ProductVariation.objects.filter(product_id=product.product_id)
                variation_data = []
                
                for variation in variations:
                    variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
                    variation_data.append(variation_dict)
                
                # Add reviews
                reviews = Reviews.objects.filter(product_id=product.product_id)
                review_data = []
                
                for review in reviews:
                    review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
                    review_data.append(review_dict)
                
                category_products.append({
                    'product': product_dict,
                    'variations': variation_data,
                    'reviews': review_data,
                    'orders': product_order_data
                })
            
            # Serialize category
            category_dict = {field.name: getattr(category, field.name) for field in Category._meta.fields}

            # Add subcategories
            subcategories = SubCategory.objects.filter(category_id=category.category_id)
            subcategory_data = []

            for subcategory in subcategories:
                sub_dict = {field.name: getattr(subcategory, field.name) for field in SubCategory._meta.fields}
                subcategory_data.append(sub_dict)

            response_data.append({
                'category': category_dict,
                'subcategories': subcategory_data,
                'products': category_products
            })
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


    @action(detail=False, methods=['get'], url_path='sub-categories')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def sub_category_analytics(self, request):
        # Get all sub-categories
        sub_categories = SubCategory.objects.all()
        
        # Prefetch related data for efficiency
        all_order_items = OrderItem.objects.select_related('order').all()
        
        response_data = []
        
        for sub_category in sub_categories:
            # Get products for this sub - category
            products = Product.objects.filter(sub_category_id=sub_category.sub_category_id)
            sub_category_products = []
            
            for product in products:
                # Get order items for this product
                product_order_items = [oi for oi in all_order_items if oi.product_id == str(product.product_id)]
                product_order_data = []
                
                for order_item in product_order_items:
                    # Get related order
                    order = order_item.order
                    
                    # Serialize order item
                    order_item_dict = {field.name: getattr(order_item, field.name) for field in OrderItem._meta.fields}
                    
                    # Serialize order
                    order_dict = {field.name: getattr(order, field.name) for field in Order._meta.fields}
                    
                    product_order_data.append({
                        'order_item': order_item_dict,
                        'order_details': order_dict
                    })
                
                # Serialize product
                product_dict = {field.name: getattr(product, field.name) for field in Product._meta.fields}
                
                # Add product variations
                variations = ProductVariation.objects.filter(product_id=product.product_id)
                variation_data = []
                
                for variation in variations:
                    variation_dict = {field.name: getattr(variation, field.name) for field in ProductVariation._meta.fields}
                    variation_data.append(variation_dict)
                
                # Add reviews
                reviews = Reviews.objects.filter(product_id=product.product_id)
                review_data = []
                
                for review in reviews:
                    review_dict = {field.name: getattr(review, field.name) for field in Reviews._meta.fields}
                    review_data.append(review_dict)
                
                sub_category_products.append({
                    'product': product_dict,
                    'variations': variation_data,
                    'reviews': review_data,
                    'orders': product_order_data
                })
            
            # Serialize category
            sub_category_dict = {field.name: getattr(sub_category, field.name) for field in SubCategory._meta.fields}

            # Add categories
            categories = Category.objects.filter(category_id=sub_category.category_id)
            category_data = []

            for category in categories:
                cat_dict = {field.name: getattr(category, field.name) for field in Category._meta.fields}
                category_data.append(cat_dict)

            response_data.append({
                'subcategories': sub_category_dict,
                'category': category_data,
                'products': sub_category_products
            })
        
        return Response({
            "success": True,
            "data": response_data,
            "error": None
        })


    @action(detail=False, methods=['get'], url_path='timeslots')
    @handle_exceptions
    @check_authentication(required_role='admin')
    def timeslot_analytics(self, request):
        # Get all timeslots
        timeslots = TimeSlot.objects.all()
        
        # Prefetch related data for efficiency
        all_products = Product.objects.in_bulk(field_name='product_id')
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
