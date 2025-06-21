from rest_framework import viewsets, status
from rest_framework.response import Response
from utils.decorators import handle_exceptions, check_authentication
from UserDetail.models import User
from Order.models import Order, OrderItem
from Order.serializers import OrderItemSerializer
from django.contrib.auth import authenticate, login
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Q, Count, Sum

class DeliveryLoginViewSet(viewsets.ViewSet):
    """
    Delivery person login with plain text password (temporary solution)
    """
    @handle_exceptions
    def create(self, request):
        user_id = request.data.get("user_id")
        password = request.data.get("password")
        
        if not user_id or not password:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "User ID and password are required."
            }, status=400)
        
        try:
            user = User.objects.get(user_id=user_id, role="delivery", is_active=True)
            
            # Check plain text password (temporary solution)
            if user.plain_text_password == password:
                login(request, user)
                
                return Response({
                    "success": True,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": {
                        "user_id": user.user_id,
                        "name": f"{user.first_name} {user.last_name}",
                        "phone": user.contact_number,
                        "is_available": user.is_available
                    },
                    "error": None
                }, status=200)
            else:
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": "Invalid credentials."
                }, status=401)
                
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Invalid credentials."
            }, status=401)


class DeliveryDashboardViewSet(viewsets.ViewSet):
    """
    Get delivery person dashboard data
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def list(self, request):
        user_id = request.user.user_id
        today = timezone.now().date()
        
        # Get today's assigned orders
        today_orders = Order.objects.filter(
            assigned_delivery_partner_id=user_id,
            delivery_date=today,
            status__in=["placed", "preparing", "ready", "out_for_delivery"]
        ).order_by('created_at')
        
        # Get pending orders (not delivered/cancelled)
        pending_orders = Order.objects.filter(
            assigned_delivery_partner_id=user_id,
            status__in=["placed", "preparing", "ready", "out_for_delivery"]
        ).order_by('delivery_date', 'created_at')
        
        # Get completed orders count for today
        completed_today = Order.objects.filter(
            assigned_delivery_partner_id=user_id,
            delivery_date=today,
            status="delivered"
        ).count()
        
        # Get total earnings for today (COD orders)
        today_earnings = Order.objects.filter(
            assigned_delivery_partner_id=user_id,
            delivery_date=today,
            status="delivered",
            is_cod=True,
            payment_received=True
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Format orders data
        def format_order_data(orders):
            orders_data = []
            for order in orders:
                items = OrderItem.objects.filter(order_id=order.order_id)
                orders_data.append({
                    "order_id": order.order_id,
                    "customer_name": f"{order.first_name} {order.last_name}",
                    "customer_phone": order.phone,
                    "delivery_address": order.delivery_address,
                    "delivery_date": order.delivery_date,
                    "status": order.status,
                    "total_amount": float(order.total_amount),
                    "is_cod": order.is_cod,
                    "payment_received": order.payment_received,
                    "payment_method": order.payment_method,
                    "special_instructions": order.special_instructions or "",
                    "items_count": items.count(),
                    "items": OrderItemSerializer(items, many=True).data,
                    "created_at": order.created_at
                })
            return orders_data
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "today_orders": format_order_data(today_orders),
                "pending_orders": format_order_data(pending_orders),
                "stats": {
                    "completed_today": completed_today,
                    "pending_count": pending_orders.count(),
                    "today_earnings": float(today_earnings)
                },
                "user_info": {
                    "name": f"{request.user.first_name} {request.user.last_name}",
                    "user_id": request.user.user_id,
                    "is_available": request.user.is_available
                }
            },
            "error": None
        }, status=200)


class DeliveryAvailabilityToggleViewSet(viewsets.ViewSet):
    """
    Toggle delivery person availability
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        is_available = request.data.get("is_available")
        
        if is_available is None:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "is_available field is required."
            }, status=400)
        
        user = request.user
        user.is_available = is_available
        user.save()
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "message": f"Availability set to {'Available' if is_available else 'Unavailable'}",
                "is_available": is_available
            },
            "error": None
        }, status=200)


class DeliveryPartnerViewSet(viewsets.ViewSet):
    """
    Get all active delivery partners (Admin use) - Updated to filter by availability
    """
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        # Get only available delivery partners
        partners = User.objects.filter(role="delivery", is_active=True, is_available=True)
        data = [{"id": p.user_id, "name": f"{p.first_name} {p.last_name}", "contact": p.contact_number} for p in partners]
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": data,
            "error": None
        }, status=200)


class AssignPartnerViewSet(viewsets.ViewSet):
    """
    Assign a delivery partner to an order (Admin use)
    """
    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        order_id = request.data.get("order_id")
        delivery_partner_id = request.data.get("delivery_partner_id")

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Order not found.",
                             "user_not_logged_in": False, "user_unauthorized": False}, status=404)

        # Verify delivery partner exists and is available
        try:
            delivery_partner = User.objects.get(user_id=delivery_partner_id, role="delivery", is_active=True)
        except User.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Delivery partner not found or inactive.",
                             "user_not_logged_in": False, "user_unauthorized": False}, status=404)

        order.assigned_delivery_partner_id = delivery_partner_id
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "Delivery partner assigned."},
            "error": None
        }, status=200)


class DeliveryStatusViewSet(viewsets.ViewSet):
    """
    Delivery partner updates status (picked_up / delivered)
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")
        status_type = request.data.get("status")  # expected: "out_for_delivery" or "delivered"

        if status_type not in ["out_for_delivery", "delivered"]:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "Invalid status. Use 'out_for_delivery' or 'delivered'."
            }, status=400)

        try:
            order = Order.objects.get(order_id=order_id, assigned_delivery_partner_id=request.user.user_id)
        except Order.DoesNotExist:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "Order not found or unauthorized."
            }, status=404)

        order.status = status_type
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": f"Order marked as {status_type.replace('_', ' ')}."},
            "error": None
        }, status=200)


class MyOrdersViewSet(viewsets.ViewSet):
    """
    Get delivery partner's assigned orders with filtering
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def list(self, request):
        user_id = request.user.user_id
        
        # Get filter parameters
        status_filter = request.query_params.get('status', '')
        date_filter = request.query_params.get('date', '')
        
        # Base query
        orders_query = Order.objects.filter(assigned_delivery_partner_id=user_id)
        
        # Apply filters
        if status_filter:
            orders_query = orders_query.filter(status=status_filter)
        
        if date_filter:
            if date_filter == 'today':
                orders_query = orders_query.filter(delivery_date=timezone.now().date())
            elif date_filter == 'pending':
                orders_query = orders_query.filter(status__in=["placed", "preparing", "ready", "out_for_delivery"])
            elif date_filter == 'completed':
                orders_query = orders_query.filter(status="delivered")
        
        orders = orders_query.order_by('-created_at')
        
        result = []
        for order in orders:
            items = OrderItem.objects.filter(order_id=order.order_id)
            result.append({
                "order_id": order.order_id,
                "customer_name": f"{order.first_name} {order.last_name}",
                "customer_phone": order.phone,
                "status": order.status,
                "delivery_address": order.delivery_address,
                "delivery_date": order.delivery_date,
                "payment_method": order.payment_method,
                "is_cod": order.is_cod,
                "payment_received": order.payment_received,
                "total_amount": float(order.total_amount),
                "special_instructions": order.special_instructions or "",
                "items": OrderItemSerializer(items, many=True).data,
                "created_at": order.created_at
            })

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": result,
            "error": None
        }, status=200)


class ConfirmCashViewSet(viewsets.ViewSet):
    """
    Delivery partner confirms COD payment
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def create(self, request):
        order_id = request.data.get("order_id")
        collected_amount = request.data.get("collected_amount")

        if not order_id:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "Order ID is required."
            }, status=400)

        try:
            order = Order.objects.get(
                order_id=order_id,
                assigned_delivery_partner_id=request.user.user_id,
                is_cod=True,
                status="delivered"
            )
        except Order.DoesNotExist:
            return Response({
                "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                "data": None, "error": "COD Order not found, not delivered yet, or unauthorized."
            }, status=404)

        # Validate collected amount if provided
        if collected_amount is not None:
            try:
                collected_amount = float(collected_amount)
                if collected_amount != float(order.total_amount):
                    return Response({
                        "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                        "data": None, "error": f"Collected amount (₹{collected_amount}) doesn't match order amount (₹{order.total_amount})."
                    }, status=400)
            except (ValueError, TypeError):
                return Response({
                    "success": False, "user_not_logged_in": False, "user_unauthorized": False,
                    "data": None, "error": "Invalid collected amount."
                }, status=400)

        order.payment_received = True
        order.save()

        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {"message": "COD payment confirmed."},
            "error": None
        }, status=200)


class DeliveryHistoryViewSet(viewsets.ViewSet):
    """
    Get delivery history with stats
    """
    @handle_exceptions
    @check_authentication(required_role="delivery")
    def list(self, request):
        user_id = request.user.user_id
        
        # Get date range parameters
        days = int(request.query_params.get('days', 30))  # Default last 30 days
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get delivered orders in date range
        delivered_orders = Order.objects.filter(
            assigned_delivery_partner_id=user_id,
            status="delivered",
            delivery_date__range=[start_date, end_date]
        ).order_by('-delivery_date')
        
        # Calculate stats
        total_deliveries = delivered_orders.count()
        total_cod_amount = delivered_orders.filter(is_cod=True, payment_received=True).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Format orders data
        orders_data = []
        for order in delivered_orders:
            orders_data.append({
                "order_id": order.order_id,
                "customer_name": f"{order.first_name} {order.last_name}",
                "delivery_date": order.delivery_date,
                "total_amount": float(order.total_amount),
                "is_cod": order.is_cod,
                "payment_received": order.payment_received,
                "delivery_address": order.delivery_address
            })
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "orders": orders_data,
                "stats": {
                    "total_deliveries": total_deliveries,
                    "total_cod_collected": float(total_cod_amount),
                    "date_range": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": days
                    }
                }
            },
            "error": None
        }, status=200)


class AdminDeliveryPartnerManagementViewSet(viewsets.ViewSet):
    """
    Admin ViewSet for complete delivery partner management (CRUD operations)
    """
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def list(self, request):
        """
        Get all delivery partners with stats for admin dashboard
        """
        # Get all delivery partners
        partners = User.objects.filter(role="delivery").order_by('-created_at')
        
        # Calculate statistics
        total_partners = partners.count()
        active_partners = partners.filter(is_active=True).count()
        available_partners = partners.filter(is_active=True, is_available=True).count()
        
        # Get partners with active orders (busy)
        busy_partners = partners.filter(
            is_active=True,
            user_id__in=Order.objects.filter(
                status__in=["placed", "preparing", "ready", "out_for_delivery"]
            ).values_list('assigned_delivery_partner_id', flat=True)
        ).count()
        
        # Format partner data with delivery stats
        partners_data = []
        for partner in partners:
            # Get delivery stats for each partner
            total_deliveries = Order.objects.filter(
                assigned_delivery_partner_id=partner.user_id,
                status="delivered"
            ).count()
            
            completed_today = Order.objects.filter(
                assigned_delivery_partner_id=partner.user_id,
                delivery_date=timezone.now().date(),
                status="delivered"
            ).count()
            
            partners_data.append({
                "user_id": partner.user_id,
                "first_name": partner.first_name,
                "last_name": partner.last_name,
                "email": partner.email,
                "contact_number": partner.contact_number,
                "alternate_phone": partner.alternate_phone or "",
                "is_active": partner.is_active,
                "is_available": partner.is_available,
                "plain_text_password": partner.plain_text_password or "",
                "vehicle_type": getattr(partner, 'vehicle_type', '') or "",
                "vehicle_number": getattr(partner, 'vehicle_number', '') or "",
                "address": getattr(partner, 'address', '') or "",
                "created_at": partner.created_at,
                "total_deliveries": total_deliveries,
                "completed_today": completed_today
            })
        
        return Response({
            "success": True,
            "user_not_logged_in": False,
            "user_unauthorized": False,
            "data": {
                "partners": partners_data,
                "stats": {
                    "total": total_partners,
                    "active": active_partners,
                    "available": available_partners,
                    "busy": busy_partners
                }
            },
            "error": None
        }, status=200)
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def create(self, request):
        """
        Create a new delivery partner
        """
        data = request.data
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'contact_number', 'plain_text_password']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    "success": False,
                    "user_not_logged_in": False,
                    "user_unauthorized": False,
                    "data": None,
                    "error": f"{field.replace('_', ' ').title()} is required."
                }, status=400)
        
        # Check if email already exists
        if User.objects.filter(email=data.get('email')).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Email already exists."
            }, status=400)
        
        # Check if contact number already exists
        if User.objects.filter(contact_number=data.get('contact_number')).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Contact number already exists."
            }, status=400)
        
        try:
            # Create new delivery partner
            partner = User.objects.create(
                role="delivery",
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                email=data.get('email'),
                contact_number=data.get('contact_number'),
                alternate_phone=data.get('alternate_phone', ''),
                plain_text_password=data.get('plain_text_password'),
                is_active=data.get('is_active', True),
                is_available=data.get('is_available', True)
            )
            
            # Set additional fields if they exist in the model
            if hasattr(partner, 'vehicle_type'):
                partner.vehicle_type = data.get('vehicle_type', '')
            if hasattr(partner, 'vehicle_number'):
                partner.vehicle_number = data.get('vehicle_number', '')
            if hasattr(partner, 'address'):
                partner.address = data.get('address', '')
            
            partner.save()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "message": "Delivery partner created successfully.",
                    "partner_id": partner.user_id
                },
                "error": None
            }, status=201)
            
        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Failed to create delivery partner: {str(e)}"
            }, status=500)
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def retrieve(self, request, pk=None):
        """
        Get a specific delivery partner by user_id
        """
        try:
            partner = User.objects.get(user_id=pk, role="delivery")
            
            # Get delivery stats
            total_deliveries = Order.objects.filter(
                assigned_delivery_partner_id=partner.user_id,
                status="delivered"
            ).count()
            
            completed_today = Order.objects.filter(
                assigned_delivery_partner_id=partner.user_id,
                delivery_date=timezone.now().date(),
                status="delivered"
            ).count()
            
            partner_data = {
                "user_id": partner.user_id,
                "first_name": partner.first_name,
                "last_name": partner.last_name,
                "email": partner.email,
                "contact_number": partner.contact_number,
                "alternate_phone": partner.alternate_phone or "",
                "is_active": partner.is_active,
                "is_available": partner.is_available,
                "plain_text_password": partner.plain_text_password or "",
                "vehicle_type": getattr(partner, 'vehicle_type', '') or "",
                "vehicle_number": getattr(partner, 'vehicle_number', '') or "",
                "address": getattr(partner, 'address', '') or "",
                "created_at": partner.created_at,
                "total_deliveries": total_deliveries,
                "completed_today": completed_today
            }
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": partner_data,
                "error": None
            }, status=200)
            
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Delivery partner not found."
            }, status=404)
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def update(self, request, pk=None):
        """
        Update a delivery partner
        """
        try:
            partner = User.objects.get(user_id=pk, role="delivery")
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Delivery partner not found."
            }, status=404)
        
        data = request.data
        
        # Check if email already exists (excluding current partner)
        if data.get('email') and User.objects.filter(email=data.get('email')).exclude(user_id=pk).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Email already exists."
            }, status=400)
        
        # Check if contact number already exists (excluding current partner)
        if data.get('contact_number') and User.objects.filter(contact_number=data.get('contact_number')).exclude(user_id=pk).exists():
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Contact number already exists."
            }, status=400)
        
        try:
            # Update partner fields
            if data.get('first_name'):
                partner.first_name = data.get('first_name')
            if data.get('last_name'):
                partner.last_name = data.get('last_name')
            if data.get('email'):
                partner.email = data.get('email')
            if data.get('contact_number'):
                partner.contact_number = data.get('contact_number')
            if 'alternate_phone' in data:
                partner.alternate_phone = data.get('alternate_phone')
            if data.get('plain_text_password'):
                partner.plain_text_password = data.get('plain_text_password')
            if 'is_active' in data:
                partner.is_active = data.get('is_active')
            if 'is_available' in data:
                partner.is_available = data.get('is_available')
            
            # Update additional fields if they exist in the model
            if hasattr(partner, 'vehicle_type') and 'vehicle_type' in data:
                partner.vehicle_type = data.get('vehicle_type', '')
            if hasattr(partner, 'vehicle_number') and 'vehicle_number' in data:
                partner.vehicle_number = data.get('vehicle_number', '')
            if hasattr(partner, 'address') and 'address' in data:
                partner.address = data.get('address', '')
            
            partner.save()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "message": "Delivery partner updated successfully."
                },
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Failed to update delivery partner: {str(e)}"
            }, status=500)
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def destroy(self, request, pk=None):
        """
        Delete a delivery partner (soft delete by deactivating)
        """
        try:
            partner = User.objects.get(user_id=pk, role="delivery")
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Delivery partner not found."
            }, status=404)
        
        # Check if partner has active orders
        active_orders = Order.objects.filter(
            assigned_delivery_partner_id=pk,
            status__in=["placed", "preparing", "ready", "out_for_delivery"]
        ).count()
        
        if active_orders > 0:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Cannot delete partner with {active_orders} active orders. Please reassign orders first."
            }, status=400)
        
        try:
            # Soft delete by deactivating
            partner.is_active = False
            partner.is_available = False
            partner.save()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "message": "Delivery partner deleted successfully."
                },
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Failed to delete delivery partner: {str(e)}"
            }, status=500)
    
    @handle_exceptions
    @check_authentication(required_role="admin")
    def toggle_status(self, request, pk=None):
        """
        Toggle partner active status
        """
        try:
            partner = User.objects.get(user_id=pk, role="delivery")
        except User.DoesNotExist:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "Delivery partner not found."
            }, status=404)
        
        is_active = request.data.get('is_active')
        if is_active is None:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": "is_active field is required."
            }, status=400)
        
        try:
            partner.is_active = is_active
            if not is_active:
                partner.is_available = False  # If deactivating, also set unavailable
            partner.save()
            
            return Response({
                "success": True,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": {
                    "message": f"Partner {'activated' if is_active else 'deactivated'} successfully.",
                    "is_active": is_active
                },
                "error": None
            }, status=200)
            
        except Exception as e:
            return Response({
                "success": False,
                "user_not_logged_in": False,
                "user_unauthorized": False,
                "data": None,
                "error": f"Failed to update partner status: {str(e)}"
            }, status=500)
