import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Template

def send_order_email(smtp_host, smtp_port, smtp_user, smtp_password, to_email, subject, order_data):
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
                    {{billing_city}} {{billing_zip}}<br>
                    {{billing_state}}<br>
                    {{billing_phone}}<br>
                    <a href="mailto:{{billing_email}}" style="color:#0d6efd;">{{billing_email}}</a>
                  </td>
                  <td valign="top" width="50%">
                    <strong>Shipping address</strong><br>
                    {{shipping_name}}<br>
                    {{shipping_address}}<br>
                    {{shipping_city}} {{shipping_zip}}<br>
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
              <p style="margin:5px 0; color:#ecf0f1; font-size:13px;">&copy; 2023 OvenFresh. All rights reserved.</p>
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

# Example Usage
order_data = {
    "customer_name": "Mitesh",
    "order_number": "7692546552",
    "driver_name": "Tinku Yadav",
    "driver_phone": "+91 09871 56937",
    "order_link": "https://example.com/orders/76922",
    "order_date": "July 3, 2025",
    "items": [
        {"name": "Butterscotch Cake (Eggless) - 500 gms", "quantity": 1, "price": 600}
    ],
    "subtotal": 600,
    "shipping": "Free shipping",
    "evening_delivery": 80,
    "payment_method": "Pay with Razorpay",
    "total": 680,
    "tax": 82,
    "note": "Happy Birthday Namrata...",
    "delivery_date": "3 July, 2025",
    "time_slot": "07:00 PM - 10:00 PM",
    "billing_name": "Mitesh Doshi",
    "billing_address": "House, Plot, Stanza Living Monterrey x 46, Gulmohar Rd, near CritiCare Hospital, JVPD Scheme",
    "billing_city": "Juhu",
    "billing_zip": "400058",
    "billing_state": "Maharashtra",
    "billing_phone": "9867274698",
    "billing_email": "miteshddoshi@gmail.com",
    "shipping_name": "Mitesh Doshi",
    "shipping_address": "House, Plot, Stanza Living Monterrey x 46, Gulmohar Rd, near CritiCare Hospital, JVPD Scheme",
    "shipping_city": "Juhu",
    "shipping_zip": "400058",
    "shipping_state": "Maharashtra",
    "shipping_phone": "9867274698",
    "website_url": "https://ovenfresh.in"
}

send_order_email(
    smtp_host="smtp.gmail.com",
    smtp_port=465,
    smtp_user="spandan.shah2003@gmail.com",
    smtp_password="ureg wefc jyop bqun",
    to_email="spandan.shah2003@gmail.com",
    subject="Delivered (Order #7692546552)",
    order_data=order_data
)
