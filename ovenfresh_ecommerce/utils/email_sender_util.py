from django.conf import settings
from django.utils import timezone
from Order.models import Order, OrderItem
from Product.models import Product, ProductVariation, TimeSlot
from UserDetail.models import User

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Template

def send_order_conf_email(smtp_host, smtp_port, smtp_user, smtp_password, to_email, subject, order_data):
    # Load HTML template from file
    
    html_template = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin:0; padding:0; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #ddd; border-radius:4px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#b2a878; padding:20px; text-align:center; color:#fff; font-size:20px; font-weight:bold;">
              Thank you for your order.
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:20px; font-size:14px; color:#333;">
              Hi {{customer_name}},<br><br>
              Just to let you know — We have successfully received your order 
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                <strong>#{{order_number}}</strong>
              </a>! ({{order_date}})
            </td>
          </tr>
          
          <!--Order Details-->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px; color:#000;">
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                Click here to view order details!
              </a>
            </td>
          </tr>

          <!-- Order Table -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">
                <tr style="background-color:#f5f5f5;">
                  <th align="left" style="border:1px solid #ddd;">Product</th>
                  <th align="left" style="border:1px solid #ddd;">Quantity</th>
                  <th align="left" style="border:1px solid #ddd;">Price</th>
                </tr>
                {% for item in items %}
                <tr>
                  <td style="border:1px solid #ddd;">{{item.name}}</td>
                  <td style="border:1px solid #ddd;">{{item.quantity}}</td>
                  <td style="border:1px solid #ddd;">₹{{item.price}}</td>
                </tr>
                {% endfor %}
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Subtotal:</td>
                  <td style="border:1px solid #ddd;">₹{{subtotal}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Shipping:</td>
                  <td style="border:1px solid #ddd;">{{shipping}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Evening Delivery:</td>
                  <td style="border:1px solid #ddd;">₹{{evening_delivery}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Payment method:</td>
                  <td style="border:1px solid #ddd;">{{payment_method}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd; font-weight:bold;">Total:</td>
                  <td style="border:1px solid #ddd; font-weight:bold;">₹{{total}} <span style="font-size:12px;">(includes ₹{{tax}} Tax)</span></td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Note:</td>
                  <td style="border:1px solid #ddd;">{{note}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px;">
              <strong>Delivery Date:</strong> {{delivery_date}}<br>
              <strong>Time Slot:</strong> {{time_slot}}
            </td>
          </tr>

          <!-- Addresses -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td valign="top" width="50%">
                    <strong>Billing address</strong><br>
                    {{billing_name}}<br>
                    {{billing_address}}<br>
                    {{billing_state}}<br>
                    {{billing_phone}}<br>
                    <a href="mailto:{{billing_email}}" style="color:#0d6efd;">{{billing_email}}</a>
                  </td>
                  <td valign="top" width="50%">
                    <strong>Shipping address</strong><br>
                    {{shipping_name}}<br>
                    {{shipping_address}}<br>
                    {{shipping_state}}<br>
                    {{shipping_phone}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; background-color:#b2a878; color:#ecf0f1; font-size:13px; text-align:center;">
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                If you have any questions, contact us at 
                <a href="mailto:support@ovenfresh.in" style="color:#3b2f2f; text-decoration:none;">
                  support@ovenfresh.in
                </a>
              </p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">&copy; 2025 OvenFresh. All rights reserved.</p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                <a href="{{website_url}}" style="color:#3b2f2f; text-decoration:none;">ovenfresh.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
'''

    # Render HTML with dynamic data using Jinja2
    template = Template(html_template)
    html_content = template.render(**order_data)
    # print(html_content)
    # Create email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    # Send email
    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())

def send_order_delivered_email(smtp_host, smtp_port, smtp_user, smtp_password, to_email, subject, order_data):
    # Load HTML template from file
    
    html_template = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Successful</title>
</head>
<body style="font-family: Arial, sans-serif; margin:0; padding:0; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #ddd; border-radius:4px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#b2a878; padding:20px; text-align:center; color:#fff; font-size:20px; font-weight:bold;">
              Order successfully delivered!
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:20px; font-size:14px; color:#333;">
              Hi {{customer_name}},<br><br>
              Just to let you know — your order
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                <strong>#{{order_number}}</strong>
              </a>({{order_date}}) has been delivered successfully.
            </td>
          </tr>

          <!-- Driver Details -->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px; color:#333;">
              <strong style="color:#7d6d00;">Driver details</strong><br>
              {{driver_name}}<br>
              <a href="tel:{{driver_phone}}" style="color:#0d6efd; text-decoration:none;">
                {{driver_phone}}
              </a><br>
            </td>
          </tr>
          
          <!--Order Details-->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px; color:#000;">
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                Click here to view order details!
              </a>
            </td>
          </tr>

          <!-- Order Table -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">
                <tr style="background-color:#f5f5f5;">
                  <th align="left" style="border:1px solid #ddd;">Product</th>
                  <th align="left" style="border:1px solid #ddd;">Quantity</th>
                  <th align="left" style="border:1px solid #ddd;">Price</th>
                </tr>
                {% for item in items %}
                <tr>
                  <td style="border:1px solid #ddd;">{{item.name}}</td>
                  <td style="border:1px solid #ddd;">{{item.quantity}}</td>
                  <td style="border:1px solid #ddd;">₹{{item.price}}</td>
                </tr>
                {% endfor %}
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Subtotal:</td>
                  <td style="border:1px solid #ddd;">₹{{subtotal}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Shipping:</td>
                  <td style="border:1px solid #ddd;">{{shipping}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Evening Delivery:</td>
                  <td style="border:1px solid #ddd;">₹{{evening_delivery}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Payment method:</td>
                  <td style="border:1px solid #ddd;">{{payment_method}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd; font-weight:bold;">Total:</td>
                  <td style="border:1px solid #ddd; font-weight:bold;">₹{{total}} <span style="font-size:12px;">(includes ₹{{tax}} Tax)</span></td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Note:</td>
                  <td style="border:1px solid #ddd;">{{note}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px;">
              <strong>Delivery Date:</strong> {{delivery_date}}<br>
              <strong>Time Slot:</strong> {{time_slot}}
            </td>
          </tr>

          <!-- Addresses -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td valign="top" width="50%">
                    <strong>Billing address</strong><br>
                    {{billing_name}}<br>
                    {{billing_address}}<br>
                    {{billing_state}}<br>
                    {{billing_phone}}<br>
                    <a href="mailto:{{billing_email}}" style="color:#0d6efd;">{{billing_email}}</a>
                  </td>
                  <td valign="top" width="50%">
                    <strong>Shipping address</strong><br>
                    {{shipping_name}}<br>
                    {{shipping_address}}<br>
                    {{shipping_state}}<br>
                    {{shipping_phone}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; background-color:#b2a878; color:#ecf0f1; font-size:13px; text-align:center;">
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                If you have any questions, contact us at 
                <a href="mailto:support@ovenfresh.in" style="color:#3b2f2f; text-decoration:none;">
                  support@ovenfresh.in
                </a>
              </p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">&copy; 2025 OvenFresh. All rights reserved.</p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                <a href="{{website_url}}" style="color:#3b2f2f; text-decoration:none;">ovenfresh.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
'''

    # Render HTML with dynamic data using Jinja2
    template = Template(html_template)
    html_content = template.render(**order_data)
    # print(html_content)
    # Create email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    # Send email
    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())

def send_out_for_delivery_email(smtp_host, smtp_port, smtp_user, smtp_password, to_email, subject, order_data):
    # Load HTML template from file
    
    html_template = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Out for Delivery</title>
</head>
<body style="font-family: Arial, sans-serif; margin:0; padding:0; background-color:#f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #ddd; border-radius:4px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#b2a878; padding:20px; text-align:center; color:#fff; font-size:20px; font-weight:bold;">
              Almost there! Your order is out for delivery.
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:20px; font-size:14px; color:#333;">
              Hi {{customer_name}},<br><br>
              Just to let you know — your order
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                <strong>#{{order_number}}</strong>
              </a>({{order_date}}) is out for delivery.
            </td>
          </tr>

          <!-- Driver Details -->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px; color:#333;">
              <strong style="color:#7d6d00;">Driver details</strong><br>
              {{driver_name}}<br>
              <a href="tel:{{driver_phone}}" style="color:#0d6efd; text-decoration:none;">
                {{driver_phone}}
              </a><br>
            </td>
          </tr>
          
          <!--Order Details-->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px; color:#000;">
              <a href="{{order_link}}" style="color:#0d6efd; text-decoration:none;">
                Click here to view order details!
              </a>
            </td>
          </tr>

          <!-- Order Table -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px; border:1px solid #ddd;">
                <tr style="background-color:#f5f5f5;">
                  <th align="left" style="border:1px solid #ddd;">Product</th>
                  <th align="left" style="border:1px solid #ddd;">Quantity</th>
                  <th align="left" style="border:1px solid #ddd;">Price</th>
                </tr>
                {% for item in items %}
                <tr>
                  <td style="border:1px solid #ddd;">{{item.name}}</td>
                  <td style="border:1px solid #ddd;">{{item.quantity}}</td>
                  <td style="border:1px solid #ddd;">₹{{item.price}}</td>
                </tr>
                {% endfor %}
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Subtotal:</td>
                  <td style="border:1px solid #ddd;">₹{{subtotal}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Shipping:</td>
                  <td style="border:1px solid #ddd;">{{shipping}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Evening Delivery:</td>
                  <td style="border:1px solid #ddd;">₹{{evening_delivery}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Payment method:</td>
                  <td style="border:1px solid #ddd;">{{payment_method}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd; font-weight:bold;">Total:</td>
                  <td style="border:1px solid #ddd; font-weight:bold;">₹{{total}} <span style="font-size:12px;">(includes ₹{{tax}} Tax)</span></td>
                </tr>
                <tr>
                  <td colspan="2" style="border:1px solid #ddd;">Note:</td>
                  <td style="border:1px solid #ddd;">{{note}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding:0 20px 20px 20px; font-size:14px;">
              <strong>Delivery Date:</strong> {{delivery_date}}<br>
              <strong>Time Slot:</strong> {{time_slot}}
            </td>
          </tr>

          <!-- Addresses -->
          <tr>
            <td style="padding:0 20px 20px 20px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td valign="top" width="50%">
                    <strong>Billing address</strong><br>
                    {{billing_name}}<br>
                    {{billing_address}}<br>
                    {{billing_state}}<br>
                    {{billing_phone}}<br>
                    <a href="mailto:{{billing_email}}" style="color:#0d6efd;">{{billing_email}}</a>
                  </td>
                  <td valign="top" width="50%">
                    <strong>Shipping address</strong><br>
                    {{shipping_name}}<br>
                    {{shipping_address}}<br>
                    {{shipping_state}}<br>
                    {{shipping_phone}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px; background-color:#b2a878; color:#ecf0f1; font-size:13px; text-align:center;">
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                If you have any questions, contact us at 
                <a href="mailto:support@ovenfresh.in" style="color:#3b2f2f; text-decoration:none;">
                  support@ovenfresh.in
                </a>
              </p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">&copy; 2025 OvenFresh. All rights reserved.</p>
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">
                <a href="{{website_url}}" style="color:#3b2f2f; text-decoration:none;">ovenfresh.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
'''

    # Render HTML with dynamic data using Jinja2
    template = Template(html_template)
    html_content = template.render(**order_data)
    # print(html_content)
    # Create email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    # Send email
    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


# TODO: (order_link) Change to actual order link
def prepare_and_send_order_email(order_id, type):
    try:
        # Fetch the order and related items
        order = Order.objects.get(order_id=order_id)
        order_items = OrderItem.objects.filter(order_id=order_id)

        # Fetch product details
        product_ids = [item.product_id for item in order_items]
        variation_ids = [item.product_variation_id for item in order_items]

        products = {str(p.product_id): p.title for p in Product.objects.filter(product_id__in=product_ids)}
        variations = {str(v.product_variation_id): v.weight_variation for v in ProductVariation.objects.filter(product_variation_id__in=variation_ids)}

        # Fetch delivery partner details if assigned
        driver_name = ""
        driver_phone = ""

        if order.assigned_delivery_partner_id:
            try:
                delivery_partner = User.objects.get(
                    user_id=order.assigned_delivery_partner_id,
                    role='delivery'
                )
                driver_name = f"{delivery_partner.first_name} {delivery_partner.last_name}"
                driver_phone = delivery_partner.contact_number
            except User.DoesNotExist:
                # Handle case where delivery partner doesn't exist
                pass

        # Prepare items for email
        email_items = []
        for item in order_items:
            product_name = products.get(item.product_id, "")
            variation = variations.get(item.product_variation_id, "")
            name = f"{product_name} - {variation}" if variation else product_name

            email_items.append({
                "name": name,
                "quantity": item.quantity,
                "price": item.final_amount
            })

        # Calculate total amounts
        subtotal = sum(item.final_amount for item in order_items)
        tax_amount = float(order.tax_amount) if order.tax_amount else 0
        delivery_charge = float(order.delivery_charge)
        total = float(order.total_amount)

        # Get timeslot information
        try:
            timeslot = TimeSlot.objects.get(id=order.timeslot_id)
            time_slot_str = f"{timeslot.time_slot_title} ({timeslot.start_time} - {timeslot.end_time})"
        except TimeSlot.DoesNotExist:
            time_slot_str = "Not specified"

        # Prepare billing and shipping info
        if order.different_billing_address:
            billing_name = f"{order.billing_first_name} {order.billing_last_name}"
            billing_address = order.billing_address
            billing_city = order.billing_city or ""
            billing_zip = order.billing_pincode or ""
            billing_state = ""  # Add state if available in model
            billing_phone = order.billing_phone or ""
        else:
            billing_name = f"{order.first_name} {order.last_name}"
            billing_address = order.delivery_address
            billing_city = order.billing_city or ""
            billing_zip = order.pincode_id
            billing_state = ""
            billing_phone = order.phone

        # Prepare order data for email template
        order_data = {
            "customer_name": f"{order.first_name} {order.last_name}",
            "order_number": order.order_id,
            "order_link": f"http://127.0.0.1:8000/order-detail/?order_id={order.order_id}",
            "order_date": order.created_at.strftime("%B %d, %Y"),
            "items": email_items,
            "subtotal": subtotal,
            "shipping": "Free shipping" if delivery_charge == 0 else f"₹{delivery_charge}",
            "evening_delivery": 0,  # Add evening delivery charge if applicable
            "payment_method": "Cash on Delivery" if order.is_cod else "Online Payment",
            "total": total,
            "tax": tax_amount,
            "note": order.order_note or order.special_instructions or "",
            "delivery_date": order.delivery_date.strftime("%d %B, %Y"),
            "time_slot": time_slot_str,
            "billing_name": billing_name,
            "billing_address": billing_address,
            "billing_city": billing_city,
            "billing_zip": billing_zip,
            "billing_state": billing_state,
            "billing_phone": billing_phone,
            "billing_email": order.email,
            "shipping_name": f"{order.first_name} {order.last_name}",
            "shipping_address": order.delivery_address,
            "shipping_city": "",  # Extract from address if needed
            "shipping_zip": order.pincode_id,
            "shipping_state": "",
            "shipping_phone": order.phone,
            "website_url": "http://127.0.0.1:8000/shop",  # Add your website URL
            "driver_name": driver_name,
            "driver_phone": driver_phone
        }

        # Send email
        if type == "order_confirmed":
            send_order_conf_email(
                smtp_host="smtp.titan.email",
                smtp_port=465,
                smtp_user="feedback@ovenfresh.in",
                smtp_password="Deepa@2025",
                to_email=order.email,
                subject=f"Your Ovenfresh Order #{order.order_id} Confirmation!",
                order_data=order_data
            )
        elif type == "out_for_delivery":
            send_out_for_delivery_email(
                smtp_host="smtp.titan.email",
                smtp_port=465,
                smtp_user="feedback@ovenfresh.in",
                smtp_password="Deepa@2025",
                to_email=order.email,
                subject=f"Your Ovenfresh Order #{order.order_id} is Out for Delivery!",
                order_data=order_data
            )
        elif type == "delivered":
            send_order_delivered_email(
                smtp_host="smtp.titan.email",
                smtp_port=465,
                smtp_user="feedback@ovenfresh.in",
                smtp_password="Deepa@2025",
                to_email=order.email,
                subject=f"Your Ovenfresh Order #{order.order_id} Delivered Successfully!",
                order_data=order_data
            )

        return True

    except Order.DoesNotExist:
        print(f"Order with ID {order_id} does not exist")
        return False
    except Exception as e:
        print(f"Error sending email for order {order_id}: {str(e)}")
        return False
