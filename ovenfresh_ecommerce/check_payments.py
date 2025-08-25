import time
import requests



def main():
    # domain = 'http://127.0.0.1:8000/'
    print("Starting check payments")
    domain = 'https://ovenfresh.in/'
    base_url = 'order-api/confirm-payment-order-api/'
    
    # while True:
    try:
        get_res = requests.get(url=f'{domain}{base_url}', timeout=15)

        if get_res.status_code == 200:
            data = get_res.json()
            print(data['success'])
            try:
                print(data["data"]["message"])
                for orders in data["data"]["updated_orders"]:
                    print(f"Update - {orders}")
            except Exception:
                print(data)
        else:
            print(get_res.text)

    except Exception as e:
        print("Error:", e)

    # sleep for 10 minutes
    # print("Sleeping for 10 minutes...\n")
    # time.sleep(600)


# print("hello divyam")
# time.sleep(5)
main()