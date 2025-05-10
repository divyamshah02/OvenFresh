import requests
import json

# Base URL for your API
BASE_URL = "http://127.0.0.1:8000/product-api/"  # Update with your actual API base URL

# Headers (if needed)
HEADERS = {
    "Content-Type": "application/json",
}

# Step 1: Add Pincodes and Timeslots (One-time Activity)
def add_pincodes_and_timeslots():
    # Adding Pincodes (Example)
    pincodes = [
        {"pincode": 380015, "area": "Area 1"},
        {"pincode": 380016, "area": "Area 2"},
        {"pincode": 380017, "area": "Area 3"}
    ]
    
    for pincode in pincodes:
        response = requests.post(
            f"{BASE_URL}pincode/", 
            headers=HEADERS, 
            data=json.dumps(pincode)
        )
        if response.status_code == 201:
            print(f"Pincode {pincode['pincode']} added successfully!")
        else:
            print(f"Failed to add pincode {pincode['pincode']}: {response.text}")

    # Adding Timeslots (Example)
    timeslots = [
        {"start_time": "08:00:00", "end_time": "10:00:00", "time_slot_title": "Morning Slot", "is_active": True},
        {"start_time": "10:00:00", "end_time": "12:00:00", "time_slot_title": "Late Morning Slot", "is_active": True},
        {"start_time": "12:00:00", "end_time": "14:00:00", "time_slot_title": "Afternoon Slot", "is_active": True}
    ]
    
    for timeslot in timeslots:
        response = requests.post(
            f"{BASE_URL}timeslot/", 
            headers=HEADERS, 
            data=json.dumps(timeslot)
        )
        if response.status_code == 201:
            print(f"Timeslot {timeslot['time_slot_title']} added successfully!")
        else:
            print(f"Failed to add timeslot {timeslot['time_slot_title']}: {response.text}")

# Step 2: Fetch all Pincodes and Timeslots
def get_pincodes_and_timeslots():
    pincodes_response = requests.get(f"{BASE_URL}pincode/", headers=HEADERS)
    timeslots_response = requests.get(f"{BASE_URL}timeslot/", headers=HEADERS)
    
    if pincodes_response.status_code == 200 and timeslots_response.status_code == 200:
        pincodes = pincodes_response.json()['data']
        timeslots = timeslots_response.json()['data']
        return pincodes, timeslots
    else:
        print("Error fetching pincodes or timeslots.")
        return [], []

# Step 3: Create Product and Add Availability (With Example Data)
def add_test_product_and_variation():
    # Fetch Pincodes and Timeslots for availability data
    pincodes, timeslots = get_pincodes_and_timeslots()

    # Step 1: Add Product
    product_data = {
        "title": "Test Product",
        "description": "Test Product Description",
        "photos": ["https://www.dynamiclabz.net/static/assets/images/resource/livechat%20(1).png"],
        "category_id": 	5569583165,  # Example category_id
        "sub_category_id": 832019240,  # Example sub_category_id
    }
    
    product_response = requests.post(
        f"{BASE_URL}product/", 
        headers=HEADERS, 
        data=json.dumps(product_data)
    )

    if product_response.status_code == 201:
        product_id = product_response.json()['data']['product_id']
        print(f"Product {product_id} created successfully!")

        # Step 2: Add Product Variation
        product_variation_data = {
            "product_id": product_id,
            "actual_price": "1000",
            "discounted_price": "800",
            "is_vartied": True,
            "weight_variation": "500g"
        }
        
        variation_response = requests.post(
            f"{BASE_URL}product-variation/", 
            headers=HEADERS, 
            data=json.dumps(product_variation_data)
        )

        if variation_response.status_code == 201:
            print("Product variation added successfully!")

            # Step 3: Generate Availability Data
            availability_data = []
            for pincode in pincodes:
                pincode_timeslots = {}
                for timeslot in timeslots:
                    pincode_timeslots[str(timeslot['id'])] = {"available": True, "charge": 50}

                availability_data.append({
                    "product_id": product_id,
                    "product_variation_id": variation_response.json()['data']["product_variation_id"],
                    "pincode_id": pincode["id"],
                    "timeslot_data": pincode_timeslots,
                    "delivery_charges": "50",
                    "is_available": True
                })

            # Step 4: Save Availability
            # for availability in availability_data:
            #     availability_response = requests.post(
            #         f"{BASE_URL}availability-charges/", 
            #         headers=HEADERS, 
            #         data=json.dumps(availability)
            #     )

            #     if availability_response.status_code == 201:
            #         print(f"Availability for Pincode {availability['pincode_id']} and Timeslot {availability['timeslot_data']} added successfully!")
            #     else:
            #         print(f"Failed to add availability for Pincode {availability['pincode_id']} and Timeslot {availability['timeslot_data']}: {availability_response.text}")


            data = {
                'availability_data': availability_data,
                "product_id": product_id,
                "product_variation_id": variation_response.json()['data']["product_variation_id"],
            }

            availability_response = requests.post(
                f"{BASE_URL}availability-charges/", 
                headers=HEADERS, 
                data=json.dumps(data)
            )

            if availability_response.status_code == 201:
                print(f"Availability added successfully!")
            else:
                print(f"Failed to add availability")

    else:
        print(f"Failed to create product: {product_response.text}")

def add_category_sub_category():
    response = requests.post(
        f"{BASE_URL}category/", 
        headers=HEADERS, 
        data=json.dumps({'title': 'Cakes'})
    )
    if response.status_code == 201:
        print(f"Category added successfully!")
        category_id = response.json()['data']['category_id']
    else:
        print(f"Failed to add category : {response.text}")

    
    sub_category_response = requests.post(
        f"{BASE_URL}sub-category/", 
        headers=HEADERS, 
        data=json.dumps({'title': 'Birthday Cakes', 'category_id': category_id})
    )
    if sub_category_response.status_code == 201:
        print(f"Sub Category added successfully!")
        sub_category_id = sub_category_response.json()['sub_category_id']
        print(sub_category_id)
    else:
        print(f"Failed to add sub category : {sub_category_response.text}")

# Run the functions
if __name__ == "__main__":
    # Step 1: Add Pincodes and Timeslots (One-time)
    # add_pincodes_and_timeslots()

    # pincodes, timeslots = get_pincodes_and_timeslots()
    # print(pincodes, timeslots)

    # Step 2: Add Product with Variations and Availability
    add_test_product_and_variation()

    # add_category_sub_category()