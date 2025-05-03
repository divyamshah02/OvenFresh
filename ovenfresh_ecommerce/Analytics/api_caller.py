import requests

BASE_URL = "http://localhost:8000/api/analytics/"


def get_sales_insights():
    for period in ['weekly', 'monthly', 'quarterly']:
        response = requests.get(f"{BASE_URL}sales/?period={period}")
        print(f"\nSales Insights ({period}):")
        print(response.json())


def get_top_products():
    response = requests.get(f"{BASE_URL}top-products/")
    print("\nTop Products:")
    print(response.json())


def get_top_customers():
    response = requests.get(f"{BASE_URL}top-customers/")
    print("\nTop Customers:")
    print(response.json())


def get_delivery_insights():
    response = requests.get(f"{BASE_URL}delivery-insights/")
    print("\nDelivery Insights:")
    print(response.json())


def get_timeslot_analysis():
    response = requests.get(f"{BASE_URL}timeslot-analysis/")
    print("\nTime Slot Analysis:")
    print(response.json())


if __name__ == "__main__":
    get_sales_insights()
    get_top_products()
    get_top_customers()
    get_delivery_insights()
    get_timeslot_analysis()
