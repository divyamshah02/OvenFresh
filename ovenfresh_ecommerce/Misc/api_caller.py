import requests
import random
from faker import Faker
from datetime import datetime, timedelta

fake = Faker()
base_url = 'http://127.0.0.1:8000/'

def create_admin_user():
    url = base_url + 'user/user-api/'

    data = {
        'name': 'Admin',
        'password':'Admin@123',
        'contact_number': '0987654321',
        'email': 'admin@dynamiclabz.net',
        'role': 'admin',  
    }

    response = requests.post(url, data=data)

    return response

def login_admin_user():
    url = base_url + 'user/login-api/'

    data = {
        'email': 'admin@dynamiclabz.net',        
        'password':'Admin@123',
    }

    response = requests.post(url, data=data)

    return response


#############################################
def create_user(name, contact_number, email):
    url = base_url + 'user/user-api/'

    data = {
        'name': name,
        'password': '12345',
        'contact_number': contact_number,
        'email': email,
        'role': 'reseller',
    }

    response = requests.post(url, data=data)

    return response

def get_all_users():
    url = base_url + 'user/get-all-user-api/'

    response = requests.get(url)

    return response

def get_fake_users(count):
    users = []
    for _ in range(count):
        user = {
            "name": fake.name(),
            "contact_number": str(random.randint(6000000000, 9999999999)),
            "email": fake.email()
        }
        users.append(user)
    return users


if __name__ == '__main__':
    print('Hello')

    # create_admin_user_respone = create_admin_user()
    # print(create_admin_user_respone.text)
    
    login_admin_user_respone = login_admin_user()
    print(login_admin_user_respone.text)
    

    # Create fake users
    # user_created = []
    # users = get_fake_users(count=10)
    # for user in users:
    #     created_user = create_user(name=user['name'], contact_number=user['contact_number'], email=user['email'])
    #     user_created.append(create_user)
    
    # Get all users
    # all_users = get_all_users()
    # print(all_users.text)

    import pdb; pdb.set_trace()
    print('end')
    
    # create_event_respone = create_event()
    # print(create_event_respone.text)
