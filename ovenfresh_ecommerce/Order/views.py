from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from django.conf import settings
from utils.decorators import *
from django.utils.crypto import get_random_string
from Cart.models import *
from Cart.serializers import *
from Product.models import *
from UserDetail.models import User
import datetime
from utils.razorpay_utils import create_razorpay_order, verify_payment_signature, fetch_payment_status
import razorpay


class OLDOrderViewSet(viewsets.ViewSet):

    @handle_exceptions
    @check_authentication(required_role="customer")
    def list(self, request):
        """
        Just fetch order data for confirmation display before placing.
        """
        user_id = request.user.user_id
        cart = Cart.objects.filter(user_id=user_id).first()
        if not cart:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart not found."}, status=404)

        cart_items = CartItem.objects.filter(cart_id=cart.cart_id)
        if not cart_items.exists():
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart is empty."}, status=400)

        total = sum(float(item.total_price) for item in cart_items)

        item_data = [
            {
                "product_id": item.product_id,
                "variation_id": item.product_variation_id,
                "quantity": item.quantity,
                "price": item.total_price
            }
            for item in cart_items
        ]

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"items": item_data, "total": total}, "error": None}, status=200)

    @handle_exceptions
    @check_authentication(required_role="customer")
    def create(self, request):
        """
        Place order from cart (status = not_placed)
        """
        user_id = request.user.user_id
        data = request.data
        required = ["pincode_id", "timeslot_id", "delivery_address", "payment_method"]
        if any(key not in data for key in required):
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Missing required fields."}, status=400)

        cart = Cart.objects.filter(user_id=user_id).first()
        cart_items = CartItem.objects.filter(cart_id=cart.cart_id)
        if not cart_items.exists():
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Cart is empty."}, status=400)

        order_id = self.generate_unique_order_id()
        total_amount = sum(float(item.total_price) for item in cart_items)
        order = Order.objects.create(
            order_id=order_id,
            user_id=user_id,
            pincode_id=data["pincode_id"],
            timeslot_id=data["timeslot_id"],
            delivery_address=data["delivery_address"],
            status="not_placed",
            total_amount=str(total_amount),
            payment_method=data["payment_method"],
            is_cod=data.get("is_cod", False),
            order_note=data.get("order_note", ""),
            razorpay_order_id=""
        )

        for item in cart_items:
            OrderItem.objects.create(
                order_id=order.order_id,
                product_id=item.product_id,
                product_variation_id=item.product_variation_id,
                quantity=item.quantity,
                amount=item.price,
                discount=item.discount,
                final_amount=item.total_price,
                item_note=item.notes or ""
            )

        if not order.is_cod:
            razorpay_order = create_razorpay_order(
                order_id=order.order_id,
                amount=float(total_amount)
            )

            if razorpay_order:
                # Update order with Razorpay ID
                order.razorpay_order_id = razorpay_order['id']
                order.save()

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"order_id": order.order_id}, "error": None}, status=201)

    def generate_unique_order_id(self):
        while True:
            order_id = get_random_string(10, allowed_chars='0123456789')
            if not Order.objects.filter(order_id=order_id).exists():
                return order_id


class OrderViewSet(viewsets.ViewSet):
    
    @handle_exceptions
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
        total_amount = delivery_charge + amount + tax_amount
        
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


class OLDConfirmOrderViewSet(viewsets.ViewSet):

    @handle_exceptions
    def create(self, request):
        """
        Called by payment redirect URL to confirm order.
        """
        order_id = request.data.get("order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        razorpay_order_id = request.data.get("razorpay_order_id")

        if not order_id:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Missing order_id."}, status=400)

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "user_not_logged_in": False, "user_unauthorized": False, "data": None, "error": "Order not found."}, status=404)

        if razorpay_payment_id and razorpay_signature and razorpay_order_id:
            # Verify payment signature for immediate payments
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }

            if verify_payment_signature(params_dict):
                # Signature valid - mark payment received
                order.payment_received = True
                order.razorpay_payment_id = razorpay_payment_id
                order.payment_id = razorpay_payment_id
            else:
                # Signature invalid - mark for later verification
                order.payment_received = False
                order.razorpay_payment_id = razorpay_payment_id
                order.payment_id = razorpay_payment_id

        else:
            # No payment info yet - mark as pending
            order.payment_received = False

        # Always mark order as placed regardless of payment status
        order.status = "order_placed"
        order.save()

        OrderItem.objects.filter(order_id=order_id).update(payment_id=order.payment_id or "")

        return Response({"success": True, "user_not_logged_in": False, "user_unauthorized": False, "data": {"message": "Order placed."}, "error": None}, status=200)


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
    
    # @handle_exceptions
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
