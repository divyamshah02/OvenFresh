import requests
import time

# Base URL for your API
BASE_URL = "http://localhost:8000/api/"  # Replace with your actual API URL

# 1. Create Order (Checkout)
def create_order(user_id, pincode_id, timeslot_id, delivery_address, payment_method, is_cod=False, order_note=""):
    url = f"{BASE_URL}order/"
    data = {
        "user_id": user_id,
        "pincode_id": pincode_id,
        "timeslot_id": timeslot_id,
        "delivery_address": delivery_address,
        "payment_method": payment_method,
        "is_cod": is_cod,
        "order_note": order_note
    }
    response = requests.post(url, json=data)
    return response.json()

# 2. Confirm Order (After Payment)
def confirm_order(order_id, payment_status, payment_id):
    url = f"{BASE_URL}confirm_order/"
    data = {
        "order_id": order_id,
        "payment_status": payment_status,
        "payment_id": payment_id
    }
    response = requests.post(url, json=data)
    return response.json()

# 3. Check Payment Status (Cronjob - Every 10 minutes)
def check_payment_status():
    url = f"{BASE_URL}payment_status_check/"
    response = requests.get(url)
    return response.json()

# 4. Generate Kitchen Note
def generate_kitchen_note():
    url = f"{BASE_URL}kitchen_note/"
    response = requests.get(url)
    return response.json()

# 5. Assign Delivery Partner
def assign_delivery_partner(order_id, delivery_partner_id):
    url = f"{BASE_URL}assign_delivery_partner/"
    data = {
        "order_id": order_id,
        "delivery_partner_id": delivery_partner_id
    }
    response = requests.post(url, json=data)
    return response.json()

# 6. Change Delivery Status to Picked Up (by Delivery Partner)
def change_status_to_picked_up(order_id):
    url = f"{BASE_URL}delivery_status/"
    data = {
        "order_id": order_id,
        "status": "picked_up"
    }
    response = requests.post(url, json=data)
    return response.json()

# 7. Change Delivery Status to Delivered (by Delivery Partner)
def change_status_to_delivered(order_id):
    url = f"{BASE_URL}delivery_status/"
    data = {
        "order_id": order_id,
        "status": "delivered"
    }
    response = requests.post(url, json=data)
    return response.json()

# 8. COD Approval
def approve_cod_order(order_id):
    url = f"{BASE_URL}cod_approval/"
    data = {
        "order_id": order_id
    }
    response = requests.post(url, json=data)
    return response.json()

# Simulation of the whole process

def simulate_order_process():
    # 1. Create Order (Checkout)
    create_response = create_order(
        user_id=1,  # Replace with actual user_id
        pincode_id=123456,  # Replace with actual pincode_id
        timeslot_id=2,  # Replace with actual timeslot_id
        delivery_address="123 Main Street",  # Replace with actual address
        payment_method="credit_card",  # Replace with actual payment method
        is_cod=False,  # Change to True if it's a COD order
        order_note="Please deliver by 5 PM"
    )

    if create_response["success"]:
        order_id = create_response["data"]["order_id"]
        print(f"Order created successfully: {order_id}")

        # 2. Confirm Order (After Payment)
        payment_status = "success"  # or "failed"
        payment_id = "payment_12345"  # Replace with actual payment ID
        confirm_response = confirm_order(order_id, payment_status, payment_id)
        print(f"Confirm Order Response: {confirm_response}")

        # 3. Check Payment Status (Cronjob simulation)
        payment_check_response = check_payment_status()
        print(f"Payment Status Check: {payment_check_response}")

        # 4. Generate Kitchen Note
        kitchen_note_response = generate_kitchen_note()
        print(f"Kitchen Note: {kitchen_note_response}")

        # 5. Assign Delivery Partner
        delivery_partner_id = 101  # Replace with actual delivery partner ID
        assign_delivery_response = assign_delivery_partner(order_id, delivery_partner_id)
        print(f"Assign Delivery Partner: {assign_delivery_response}")

        # 6. Change Delivery Status to Picked Up
        picked_up_response = change_status_to_picked_up(order_id)
        print(f"Status changed to 'Picked Up': {picked_up_response}")

        # 7. Change Delivery Status to Delivered
        delivered_response = change_status_to_delivered(order_id)
        print(f"Status changed to 'Delivered': {delivered_response}")

        # 8. COD Approval (if applicable)
        if create_response["data"]["is_cod"]:
            cod_approval_response = approve_cod_order(order_id)
            print(f"COD Approval: {cod_approval_response}")

    else:
        print("Order creation failed.")

# Run the simulation
simulate_order_process()
