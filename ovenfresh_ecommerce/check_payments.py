import requests


# domain = 'http://127.0.0.1:8000/'
domain = 'https://ovenfresh.in/'
base_url = 'order-api/confirm-payment-order-api/'

get_res = requests.get(url=f'{domain}{base_url}')

try:
    if get_res.status_code == 200:
        data = get_res.json()
        print(data['success'])
        try:
            print(data["data"]["message"])
            for orders in data["data"]["updated_orders"]:
                print(f"Update - {orders}")

        except:
            print(data)
    
    else:
        print(get_res.text)
except:
    print(get_res.text)

