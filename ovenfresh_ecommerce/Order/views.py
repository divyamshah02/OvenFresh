from rest_framework import viewsets, status
from rest_framework.response import Response

from django.conf import settings
from django.http import HttpResponse
from django.core.paginator import Paginator
from django.db.models import Q, Sum, Count, F
from django.utils.crypto import get_random_string

from .models import *
from .serializers import *

from Cart.models import *
from Cart.serializers import *
from Product.models import *
from UserDetail.models import *

import csv
import datetime
import razorpay
import xlsxwriter
from io import BytesIO

from utils.razorpay_utils import *
from utils.decorators import *


class OrderViewSet(viewsets.ViewSet):
    
    # @handle_exceptions
    @check_authentication()
    def create(self, request):
        """
        Place order from cart (status = not_placed)
        """
        user_id = request.user.user_id
        data = request.data
        
        # Check required fields
        required = [
            "first_name", "last_name", "email", "phone", 
            "address", "city", "pincode", "timeslot_id", 
            "delivery_date", "payment_method"
        ]
        
        if any(key not in data for key in required):
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Missing required fields."
            }, status=400)

        # Get cart items
        cart = Cart.objects.filter(user_id=user_id).first()
        if not cart:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Cart not found."
            }, status=400)
            
        cart_obj = CartItem.objects.filter(cart_id=cart.cart_id)
        if not cart_obj.exists():
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Cart is empty."
            }, status=400)
        
        cart_items = CartItemSerializer(cart_obj, many=True).data

        # Calculate total amount
        pincode_data = Pincode.objects.filter(pincode=data["pincode"]).first()
        if not pincode_data:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Invalid pincode."
            }, status=400)
        
        delivery_details = pincode_data.delivery_charge.get(str(data["timeslot_id"]), None)
        if not delivery_details or not delivery_details.get("available", False):
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Delivery not available for this pincode and timeslot."
            }, status=400)

        delivery_charge = delivery_details.get("charges", 0)
        amount = sum(float(float(item['price']) * float(item['quantity'])) for item in cart_items)
        tax_amount = amount * 0.18  # Assuming 18% tax
        total_amount = float(delivery_charge) + float(amount) + float(tax_amount)
        
        # Format delivery address
        delivery_address = f"{data['address']}, {data['city']}, {data['pincode']}"
        
        # Create order
        order_id = self.generate_unique_order_id()
        order = Order.objects.create(
            order_id=order_id,
            user_id=user_id,
            pincode_id=data["pincode"],  # Using pincode directly
            timeslot_id=data["timeslot_id"],
            
            # Customer details
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            phone=data["phone"],
            
            # Shipping details
            delivery_date=data["delivery_date"],
            delivery_address=delivery_address,
            delivery_charge=delivery_charge,
            shipping_address_id=data.get("shipping_address_id"),
            
            # Billing details
            different_billing_address=data.get("different_billing_address", False),
            
            # Order details
            status = "placed" if data["payment_method"] == "cod" else "not_placed",
            total_amount=str(total_amount),
            
            # Payment details
            payment_method=data["payment_method"],
            is_cod=(data["payment_method"] == "cod"),
            payment_received=False,  # For COD, mark as not received
            
            # Other details
            special_instructions=data.get("special_instructions", ""),
            order_note=data.get("order_note", "")
        )
        
        # Handle billing address if different
        if data.get("different_billing_address") and data.get("billing_address"):
            billing = data.get("billing_address", {})
            order.billing_first_name = billing.get("first_name")
            order.billing_last_name = billing.get("last_name")
            order.billing_address = billing.get("address")
            order.billing_city = billing.get("city")
            order.billing_pincode = billing.get("pincode")
            order.billing_phone = billing.get("phone")
            order.billing_alternate_phone = billing.get("alternate_phone")
            order.save()

        # Create order items
        for item in cart_items:
            discount = 0
            OrderItem.objects.create(
                order_id=order.order_id,
                product_id=item['product_id'],
                product_variation_id=item['product_variation_id'],
                quantity=item['quantity'],
                amount=float(item['price']),
                discount=discount,
                final_amount=(float(item['price']) * float(item['quantity'])) - discount,
            )

        # Clear the cart after order is placed
        cart_obj.delete()

        # Handle payment method
        response_data = {"order_id": order.order_id}
        paisa_amount = float(total_amount)*100
        if not order.is_cod:
            razorpay_order = create_razorpay_order(
                order_id=order.order_id,
                amount=paisa_amount,
            )

            if razorpay_order:
                # Update order with Razorpay ID
                # order.razorpay_order_id = razorpay_order['id']
                order.razorpay_order_id = razorpay_order['id']
                order.save()

                response_data.update({
                    "payment_id": razorpay_order['id'],
                    "total_amount": paisa_amount,
                    "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                })

        return Response({
            "success": True, 
            "user_not_logged_in": False, 
            "user_unauthorized": False, 
            "data": response_data, 
            "error": None
        }, status=201)

    def generate_unique_order_id(self):
        while True:
            order_id = get_random_string(10, allowed_chars='0123456789')
            if not Order.objects.filter(order_id=order_id).exists():
                return order_id


class ConfirmOrderViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role="customer")
    def create(self, request):
        """
        Verify payment status with Razorpay and update order
        """
        user_id = request.user.user_id
        data = request.data
        
        # Validate required fields
        if 'order_id' not in data:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Order ID is required."
            }, status=400)
        
        order_id = data['order_id']
        payment_id = data.get('payment_id')
        
        try:
            # Get order from database
            order = Order.objects.filter(order_id=order_id, user_id=user_id).first()
            if not order:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Order not found."
                }, status=404)
            
            # Check if order is already paid
            if order.payment_received:
                return Response({
                    "success": True, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": {
                        "message": "Payment already verified",
                        "order_id": order_id,
                        "payment_status": "completed"
                    }, 
                    "error": None
                }, status=200)
            
            # For COD orders, no payment verification needed
            if order.is_cod or order.payment_method == 'cod':
                return Response({
                    "success": True, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": {
                        "message": "COD order confirmed",
                        "order_id": order_id,
                        "payment_status": "cod"
                    }, 
                    "error": None
                }, status=200)
            
            # Initialize Razorpay client
            if not hasattr(settings, 'RAZORPAY_KEY_ID') or not hasattr(settings, 'RAZORPAY_KEY_SECRET'):
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Payment gateway configuration error."
                }, status=500)
            
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Get payment details from Razorpay
            razorpay_order_id = order.razorpay_order_id
            if not razorpay_order_id:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Payment ID not found for this order."
                }, status=400)
            
            try:
                # Fetch order details from Razorpay
                razorpay_order = client.order.fetch(razorpay_order_id)
                
                # Check order status
                if razorpay_order['status'] == 'paid':
                    # Payment is successful, update order
                    order.payment_received = True
                    order.status = 'confirmed'  # or whatever status indicates confirmed payment
                    
                    if payment_id:
                        order.razorpay_payment_id = payment_id

                    order.save()
                    
                    return Response({
                        "success": True, 
                        "user_not_logged_in": False, 
                        "user_unauthorized": False, 
                        "data": {
                            "message": "Payment verified successfully",
                            "order_id": order_id,
                            "payment_status": "completed",
                            "razorpay_order_id": razorpay_order_id,
                        }, 
                        "error": None
                    }, status=200)
                
                elif razorpay_order['status'] == 'created':
                    # Payment is still pending
                    return Response({
                        "success": False, 
                        "user_not_logged_in": False, 
                        "user_unauthorized": False, 
                        "data": None, 
                        "error": "Payment is still pending. Please complete the payment."
                    }, status=400)
                
                else:
                    # Payment failed or other status
                    return Response({
                        "success": False, 
                        "user_not_logged_in": False, 
                        "user_unauthorized": False, 
                        "data": None, 
                        "error": f"Payment verification failed. Status: {razorpay_order['status']}"
                    }, status=400)
                
            except razorpay.errors.BadRequestError as e:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Invalid payment details."
                }, status=400)
            
            except Exception as e:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Error communicating with payment gateway."
                }, status=500)
        
        except Exception as e:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": str(e)
            }, status=500)
    
    @handle_exceptions
    @check_authentication(required_role="customer")
    def check_payment_status(self, request):
        """
        Quick check for payment status without full verification
        """
        user_id = request.user.user_id
        order_id = request.GET.get('order_id')
        
        if not order_id:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": "Order ID is required."
            }, status=400)
        
        try:
            order = Order.objects.filter(order_id=order_id, user_id=user_id).first()
            if not order:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Order not found."
                }, status=404)
            
            return Response({
                "success": True, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": {
                    "order_id": order_id,
                    "payment_received": order.payment_received,
                    "payment_method": order.payment_method,
                    "order_status": order.status,
                    "is_cod": order.is_cod
                }, 
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": str(e)
            }, status=500)


class PaymentStatusCheckViewSet(viewsets.ViewSet):

    @handle_exceptions
    def list(self, request):
        """
        Cronjob: Check for payment status for not_placed orders.
        """
        pending_orders = Order.objects.filter(status="not_placed", created_at__gte=datetime.datetime.now()-datetime.timedelta(days=2))
        updated = []

        for order in pending_orders:
            if self.external_payment_check(order.razorpay_order_id):  # You will implement this utility
                order.payment_received = True
                order.status = "order_placed"
                order.save()
                updated.append(order.order_id)

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"updated_orders": updated}, "error": None}, status=200)

    def external_payment_check(self, payment_id):
        # Placeholder for actual payment status check logic
        # This should call the payment gateway API to check the status of the payment
        return True


class OrderDetailViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role="customer")
    def list(self, request):
        """
        Get order details by order ID
        """
        user_id = request.user.user_id
        order_id = request.query_params.get("order_id")
        
        try:
            # Get order details
            order = Order.objects.filter(order_id=order_id, user_id=user_id).first()
            if not order:
                return Response({
                    "success": False, 
                    "user_not_logged_in": False, 
                    "user_unauthorized": False, 
                    "data": None, 
                    "error": "Order not found."
                }, status=404)
            
            # Get order items
            order_items = OrderItem.objects.filter(order_id=order_id)
            
            # Prepare order items data
            items_data = []
            for item in order_items:
                try:
                    product = Product.objects.get(product_id=item.product_id)
                    variation = ProductVariation.objects.filter(
                        product_variation_id=item.product_variation_id
                    ).first()
                    
                    item_data = {
                        "product_id": item.product_id,
                        "product_name": product.title,
                        # "product_image": product.product_image_url if hasattr(product, 'product_image_url') else "/placeholder.svg?height=80&width=80",
                        "product_image": product.photos[0],
                        "variation_id": item.product_variation_id,
                        "variation_name": variation.weight_variation if variation else None,
                        "quantity": item.quantity,
                        "amount": str(item.amount),
                        "discount": str(item.discount),
                        "final_amount": str(item.final_amount),
                        "item_note": item.item_note
                    }
                    items_data.append(item_data)
                except Product.DoesNotExist:
                    continue
            
            # Get timeslot information
            timeslot_name = "Not specified"
            try:
                timeslot = TimeSlot.objects.get(id=order.timeslot_id)
                timeslot_name = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
            except TimeSlot.DoesNotExist:
                pass
            
            # Calculate summary amounts
            subtotal = sum(float(item.final_amount) for item in order_items)
            # delivery_charges = 0  # You can calculate this based on your logic

            pincode_data = Pincode.objects.filter(pincode=order.pincode_id).first()
            delivery_details = pincode_data.delivery_charge.get(str(order.timeslot_id), None)
            delivery_charges = delivery_details.get("charges", 0)

            tax_amount = subtotal * 0.18  # 18% tax
            discount_amount = 0  # You can calculate this based on your logic
            
            # Prepare order data
            order_data = {
                "order_id": order.order_id,
                "status": order.status,
                "created_at": order.created_at.isoformat(),
                "delivery_date": order.delivery_date,
                "timeslot_name": timeslot_name,
                
                # Customer details
                "first_name": order.first_name,
                "last_name": order.last_name,
                "email": order.email,
                "phone": order.phone,
                
                # Address details
                "delivery_address": order.delivery_address,
                "different_billing_address": order.different_billing_address,
                "billing_first_name": getattr(order, 'billing_first_name', None),
                "billing_last_name": getattr(order, 'billing_last_name', None),
                "billing_address": getattr(order, 'billing_address', None),
                "billing_city": getattr(order, 'billing_city', None),
                "billing_pincode": getattr(order, 'billing_pincode', None),
                "billing_phone": getattr(order, 'billing_phone', None),
                
                # Payment details
                "payment_method": order.payment_method,
                "payment_received": order.payment_received,
                "is_cod": order.is_cod,
                "payment_id": order.razorpay_order_id,
                "razorpay_key_id": settings.RAZORPAY_KEY_ID if hasattr(settings, 'RAZORPAY_KEY_ID') else None,
                
                # Order amounts
                "total_amount": str(order.total_amount),
                "delivery_charges": str(delivery_charges),
                "tax_amount": str(tax_amount),
                "discount_amount": str(discount_amount),
                
                # Other details
                "special_instructions": getattr(order, 'special_instructions', None),
                "order_note": order.order_note,
                
                # Order items
                "items": items_data
            }
            
            return Response({
                "success": True, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": order_data, 
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False, 
                "user_not_logged_in": False, 
                "user_unauthorized": False, 
                "data": None, 
                "error": str(e)
            }, status=500)


class OrderListViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    # @check_authentication(required_role="customer")
    def list(self, request):
        """
        Get user orders with pagination and filtering
        """
        user_id = request.user.user_id
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        status_filter = request.GET.get('status', '')
        
        
        # Build query
        orders_query = Order.objects.filter(user_id=user_id).order_by('-created_at')
        
        # Apply status filter if provided
        if status_filter:
            orders_query = orders_query.filter(status=status_filter)
        
        # Paginate results
        paginator = Paginator(orders_query, limit)
        orders_page = paginator.get_page(page)
        
        # Format orders data
        orders_data = []
        for order in orders_page:
            orders_data.append({
                'order_id': order.order_id,
                'status': order.status,
                'total_amount': str(order.total_amount),
                'payment_method': order.payment_method,
                'is_cod': order.is_cod,
                'payment_received': order.payment_received,
                'delivery_date': order.delivery_date,
                'created_at': order.created_at,
            })
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "orders": orders_data,
                "current_page": page,
                "total_pages": paginator.num_pages,
                "total_orders": paginator.count
            },
            "error": None
        }, status=200)


class AdminOrderListViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        """
        Get all orders with filtering options
        """
        # Get query parameters
        search = request.query_params.get('search', '')
        status = request.query_params.get('status', '')
        payment_status = request.query_params.get('payment_status', '')
        payment_method = request.query_params.get('payment_method', '')
        delivery_date = request.query_params.get('delivery_date', '')
        timeslot_id = request.query_params.get('timeslot_id', '')
        date_from = request.query_params.get('date_from', '')
        date_to = request.query_params.get('date_to', '')
        sort_by = request.query_params.get('sort_by', 'created_desc')
        
        # Pagination parameters
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 10))
        
        # Export flag
        export = request.query_params.get('export', 'false').lower() == 'true'
        export_format = request.query_params.get('format', 'csv')
        
        # Start with all orders
        orders_query = Order.objects.all()
        
        # Apply filters
        if search:
            orders_query = orders_query.filter(
                Q(order_id__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        if status:
            orders_query = orders_query.filter(status=status)
        
        if payment_status:
            if payment_status == 'paid':
                orders_query = orders_query.filter(payment_received=True)
            elif payment_status == 'pending':
                orders_query = orders_query.filter(payment_received=False)
        
        if payment_method:
            orders_query = orders_query.filter(payment_method=payment_method)
        
        if delivery_date:
            orders_query = orders_query.filter(delivery_date=delivery_date)
        
        if timeslot_id:
            orders_query = orders_query.filter(timeslot_id=timeslot_id)
        
        if date_from and date_to:
            orders_query = orders_query.filter(created_at__range=[date_from, date_to])
        
        # Apply sorting
        if sort_by == 'created_desc':
            orders_query = orders_query.order_by('-created_at')
        elif sort_by == 'created_asc':
            orders_query = orders_query.order_by('created_at')
        elif sort_by == 'total_desc':
            orders_query = orders_query.order_by('-total_amount')
        elif sort_by == 'total_asc':
            orders_query = orders_query.order_by('total_amount')
        
        # Get total count before pagination
        total_count = orders_query.count()
        
        # Handle export if requested
        if export:
            return self.export_orders(orders_query, export_format)
        
        # Calculate total pages
        total_pages = (total_count + per_page - 1) // per_page
        
        # Apply pagination
        start = (page - 1) * per_page
        en = start + per_page
        paginated_orders = orders_query[start:en]
        
        # Annotate with order items count
        # paginated_orders = paginated_orders.annotate(order_items_count=Count('orderitem'))
        
        # Serialize orders
        serialized_orders = OrderSerializer(paginated_orders, many=True).data
        
        # Get stats for dashboard
        stats = self.get_order_stats()
        
        return Response({
            "success": True,
            "data": {
                "orders": serialized_orders,
                "total_count": total_count,
                "total_pages": total_pages,
                "current_page": page,
                "per_page": per_page,
                "stats": stats
            }
        })
    
    def get_order_stats(self):
        """
        Get order statistics for the dashboard
        """
        # Get total orders count
        total_orders = Order.objects.count()
        
        # Get today's orders count
        today = timezone.now().date()
        today_orders = Order.objects.filter(created_at__date=today).count()
        
        # Get pending delivery count (orders that are not delivered or cancelled)
        pending_delivery = Order.objects.filter(
            ~Q(status='delivered') & ~Q(status='cancelled')
        ).count()
        
        # Get total revenue
        total_revenue = Order.objects.filter(payment_received=True).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        return {
            "total_orders": total_orders,
            "today_orders": today_orders,
            "pending_delivery": pending_delivery,
            "total_revenue": float(total_revenue)
        }


class AdminOrderBriefeViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        """
        Get order details by order_id
        """
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response({"success": False, "error": "Order ID is required"}, status=400)
        
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "error": "Order not found"}, status=404)
        
        # Get order items
        order_items = OrderItem.objects.filter(order=order)
        
        # Serialize order with items
        serialized_order = OrderDetailSerializer(order).data
        
        return Response({
            "success": True,
            "data": serialized_order
        })


class AdminExportOrdersViewSet(viewsets.ViewSet):
    def list(self, orders_query, format='csv'):
        """
        Export orders to CSV or Excel
        """
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="orders_export.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Order ID', 'Customer Name', 'Email', 'Phone', 'Order Date', 
                'Delivery Date', 'Timeslot', 'Status', 'Payment Method', 
                'Payment Status', 'Total Amount', 'Items'
            ])
            
            for order in orders_query:
                writer.writerow([
                    order.order_id,
                    f"{order.first_name} {order.last_name}",
                    order.email,
                    order.phone,
                    order.created_at.strftime('%Y-%m-%d %H:%M'),
                    order.delivery_date.strftime('%Y-%m-%d'),
                    order.timeslot.name if order.timeslot else 'N/A',
                    order.status,
                    order.payment_method,
                    'Paid' if order.payment_received else 'Pending',
                    order.total_amount,
                    order.orderitem_set.count()
                ])
            
            return response
        
        elif format == 'excel':
            output = BytesIO()
            workbook = xlsxwriter.Workbook(output)
            worksheet = workbook.add_worksheet()
            
            # Add header row
            headers = [
                'Order ID', 'Customer Name', 'Email', 'Phone', 'Order Date', 
                'Delivery Date', 'Timeslot', 'Status', 'Payment Method', 
                'Payment Status', 'Total Amount', 'Items'
            ]
            
            for col, header in enumerate(headers):
                worksheet.write(0, col, header)
            
            # Add data rows
            for row, order in enumerate(orders_query, start=1):
                worksheet.write(row, 0, order.order_id)
                worksheet.write(row, 1, f"{order.first_name} {order.last_name}")
                worksheet.write(row, 2, order.email)
                worksheet.write(row, 3, order.phone)
                worksheet.write(row, 4, order.created_at.strftime('%Y-%m-%d %H:%M'))
                worksheet.write(row, 5, order.delivery_date.strftime('%Y-%m-%d'))
                worksheet.write(row, 6, order.timeslot.name if order.timeslot else 'N/A')
                worksheet.write(row, 7, order.status)
                worksheet.write(row, 8, order.payment_method)
                worksheet.write(row, 9, 'Paid' if order.payment_received else 'Pending')
                worksheet.write(row, 10, float(order.total_amount))
                worksheet.write(row, 11, order.orderitem_set.count())
            
            workbook.close()
            output.seek(0)
            
            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="orders_export.xlsx"'
            return response
        
        elif format == 'pdf':
            # PDF export would require a PDF library like ReportLab
            # This is a placeholder for future implementation
            return Response({"success": False, "error": "PDF export not implemented yet"}, status=501)
        
        else:
            return Response({"success": False, "error": f"Invalid export format: {format}"}, status=400)


class AdminOrderDetailViewSet(viewsets.ViewSet):
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        """
        Get detailed order information for admin
        """
        try:
            order_id = request.query_params.get("order_id")
            order = Order.objects.get(order_id=order_id)
            order_items = OrderItem.objects.filter(order_id=order_id)
            
            # Calculate totals
            subtotal = sum(float(item.final_amount) for item in order_items)
            tax_amount = subtotal * 0.18  # 18% tax
            delivery_charge = 0  # You can calculate this based on timeslot
            
            # Get delivery person name if assigned
            delivery_partner_name = None
            if order.assigned_delivery_partner_id:
                try:
                    delivery_person = User.objects.get(user_id=order.assigned_delivery_partner_id)
                    delivery_partner_name = f"{delivery_person.first_name} {delivery_person.last_name}"
                except User.DoesNotExist:
                    pass
            
            # Get timeslot information
            timeslot_name = "Not specified"
            try:
                timeslot = TimeSlot.objects.get(id=order.timeslot_id)
                timeslot_name = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
            except TimeSlot.DoesNotExist:
                pass

            # Prepare order items data
            items_data = []
            for item in order_items:
                # You'll need to get product details from your Product model
                # This is a placeholder - adjust according to your Product model
                product_data = Product.objects.filter(product_id=item.product_id).first()
                product_variation_data = ProductVariation.objects.filter(product_variation_id=item.product_variation_id).first()
                items_data.append({
                    'product_id': item.product_id,
                    'product_name': f"{product_data.title}",  # Replace with actual product name
                    'product_image': f"{product_data.photos[0]}",  # Replace with actual image
                    'variation_id': item.product_variation_id,
                    'variation_name': f"{product_variation_data.weight_variation}",  # Replace with actual variation name
                    'quantity': item.quantity,
                    'amount': float(item.amount),
                    'discount': float(item.discount),
                    'final_amount': float(item.final_amount),
                    'item_note': item.item_note or ""
                })
            
            order_data = {
                'order_id': order.order_id,
                'status': order.status,
                'created_at': order.created_at.isoformat(),
                
                # Customer information
                'first_name': order.first_name,
                'last_name': order.last_name,
                'email': order.email,
                'phone': order.phone,
                
                # Delivery information
                'delivery_date': order.delivery_date,
                'delivery_address': order.delivery_address,
                'timeslot_id': order.timeslot_id,
                'timeslot_name': timeslot_name,

                # Payment information
                'payment_method': order.payment_method,
                'payment_id': order.razorpay_payment_id,
                'payment_received': order.payment_received,
                'is_cod': order.is_cod,
                
                # Order details
                'total_amount': float(order.total_amount),
                'subtotal': subtotal,
                'tax_amount': tax_amount,
                'delivery_charge': delivery_charge,
                
                # Special instructions
                'special_instructions': order.special_instructions or "",
                'order_note': order.order_note or "",
                
                # Delivery person
                'assigned_delivery_partner_id': order.assigned_delivery_partner_id,
                'assigned_delivery_partner_name': delivery_partner_name,
                
                # Order items
                'order_items': items_data
            }
            
            return Response({
                "success": True,
                "data": order_data,
                "error": None
            }, status=200)
            
        except Order.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Order not found"
            }, status=404)
        except Exception as e:
            return Response({
                "success": False,
                "data": None,
                "error": str(e)
            }, status=500)


class AdminDeliveryPeronsViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        """
        Get all available delivery persons
        """
        try:
            delivery_persons = User.objects.filter(is_active=True, role="admin").order_by('first_name')
            
            persons_data = []
            for person in delivery_persons:
                persons_data.append({
                    'user_id': person.user_id,
                    'name': f"{person.first_name} {person.last_name}",
                    'phone': person.contact_number,
                    'email': person.email,
                    # 'is_available': person.is_available,
                    'is_available': person.is_active,
                    # 'current_orders_count': person.current_orders_count if hasattr(person, 'current_orders_count') else 0
                })

            return Response({
                "success": True,
                "data": {
                    "delivery_persons": persons_data
                },
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False,
                "data": None,
                "error": str(e)
            }, status=500)


class AdminUpdateOrderStatusViewSet(viewsets.ViewSet):
    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """
        Update order status
        """
        try:
            order_id = request.data.get('order_id')
            new_status = request.data.get('status')
            notes = request.data.get('notes', '')
            
            if not order_id or not new_status:
                return Response({
                    "success": False,
                    "data": None,
                    "error": "Order ID and status are required"
                }, status=400)
            
            order = Order.objects.get(order_id=order_id)
            order.status = new_status
            
            # Add status change to order notes
            if notes:
                existing_notes = order.order_note or ""
                timestamp = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
                new_note = f"\n[{timestamp}] Status changed to {new_status}: {notes}"
                order.order_note = existing_notes + new_note
            
            order.save()
            
            # You can add logic here to send notifications, update delivery person status, etc.
            
            return Response({
                "success": True,
                "data": {
                    "order_id": order_id,
                    "new_status": new_status
                },
                "error": None
            }, status=200)
            
        except Order.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Order not found"
            }, status=404)
        except Exception as e:
            return Response({
                "success": False,
                "data": None,
                "error": str(e)
            }, status=500)
    

class AdminAssignDeliveryPartnerViewSet(viewsets.ViewSet):

    # @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """
        Assign delivery person to order
        """
        try:
            order_id = request.data.get('order_id')
            delivery_person_id = request.data.get('delivery_person_id')
            
            if not order_id or not delivery_person_id:
                return Response({
                    "success": False,
                    "data": None,
                    "error": "Order ID and delivery person ID are required"
                }, status=400)
            
            # Verify order exists
            order = Order.objects.get(order_id=order_id)
            
            # Verify delivery person exists
            delivery_person = User.objects.get(user_id=delivery_person_id)
            
            # Assign delivery person
            order.assigned_delivery_partner_id = delivery_person_id
            order.save()
            
            # Update delivery person status (optional)
            # delivery_person.is_available = False
            # delivery_person.save()
            
            return Response({
                "success": True,
                "data": {
                    "order_id": order_id,
                    "delivery_person_id": delivery_person_id,
                    "delivery_person_name": delivery_person.first_name
                },
                "error": None
            }, status=200)
            
        except Order.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Order not found"
            }, status=404)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Delivery person not found"
            }, status=404)
        except Exception as e:
            return Response({
                "success": False,
                "data": None,
                "error": str(e)
            }, status=500)


##### OLD VIEWS BELOW, KEEPING FOR REFERENCE #####
class KitchenNoteViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        orders = Order.objects.filter(status="order_placed")
        result = []
        for order in orders:
            items = OrderItem.objects.filter(order_id=order.order_id)
            result.append({"order_id": order.order_id, "items": OrderItemSerializer(items, many=True).data})

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": result, "error": None}, status=200)


class AssignDeliveryPartnerViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")
        delivery_partner_id = request.data.get("delivery_partner_id")

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        order.assigned_delivery_partner_id = delivery_partner_id
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "Delivery partner assigned."}, "error": None}, status=200)


class DeliveryStatusViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")
        status_type = request.data.get("status")  # "picked_up" or "delivered"

        # to be changed to out_for_delivery
        if status_type not in ["picked_up", "delivered"]:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Invalid status."}, status=400)

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        order.status = status_type
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": f"Order marked as {status_type}."}, "error": None}, status=200)


class CODApprovalViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")

        try:
            order = Order.objects.get(order_id=order_id, is_cod=True)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "COD Order not found."}, status=404)

        order.payment_received = True
        order.status = "delivered"
        order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "COD Order completed."}, "error": None}, status=200)
