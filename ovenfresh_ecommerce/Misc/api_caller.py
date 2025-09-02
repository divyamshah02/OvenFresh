import requests
import random
from faker import Faker

fake = Faker()
base_url = 'http://127.0.0.1:8000/'
# base_url = 'https://ovenfresh.in/'

used_numbers = set()  # to keep unique numbers


def generate_unique_contact():
    """Generate unique 10-digit contact number."""
    while True:
        number = str(random.randint(6000000000, 9999999999))
        if number not in used_numbers:
            used_numbers.add(number)
            return number


def create_admin_user(name, email, password="Admin@123"):
    """Create an admin user with given details."""
    url = base_url + 'user-api/user-api/'

    data = {
        'name': name,
        'password': password,
        'contact_number': generate_unique_contact(),
        'email': email,
        'role': 'admin',
    }

    response = requests.post(url, data=data)
    return response


if __name__ == '__main__':
    print("Creating Admin Users...")

    users_to_create = [
        {"name": "Ronak Mehta", "email": "ronakmehta@ovenfresh.in", "password": "Ronak@123"},
        {"name": "Manish Poojari", "email": "manishpoojari@ovenfresh.in", "password": "Manish@123"},
        {"name": "Deepa Sugandh", "email": "deepasugandh@ovenfresh.in", "password": "Deepa@123"},
        {"name": "Aditya Gawde", "email": "adityagawde@ovenfresh.in", "password": "Aditya@123"},
        {"name": "Adhiraj", "email": "adhiraj@ovenfresh.in", "password": "Adhiraj@123"},
    ]

    for user in users_to_create:
        resp = create_admin_user(user["name"], user["email"], password=user["password"])
        print(f"Created {user['email']} -> {resp.status_code} | {resp.text}")

    print("✅ All users created (if not already existing).")
