from django.http import HttpResponse
from django.shortcuts import render



def home(request):
    return render(request, "index.html")


def cart(request):
    return render(request, "cart.html")


def shop(request):
    return render(request, "shop.html")


def product_detail(request):
    return render(request, "product-detail.html")