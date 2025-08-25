from django.contrib.sitemaps import Sitemap
from Product.models import Product, Category  # adjust to your models
from django.urls import reverse

class ProductSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.9

    def items(self):
        return Product.objects.all()

    def location(self, obj):
        # adjust according to your actual product URL pattern
        return f"/product/{obj.slug}/"


class CategorySitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return Category.objects.all()

    def location(self, obj):
        # adjust according to your actual category URL pattern
        return f"/shop/?category={obj.title}"


class LocationSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6

    def items(self):
        # list of slugs used in your template
        return [
            "Online-Cake-Delivery-in-Churchgate-West",
            "Online-Cake-Delivery-in-Churchgate-East",
            "Online-Cake-Delivery-in-Marine-Lines-West",
            "Online-Cake-Delivery-in-Marine-Lines-East",
            "Online-Cake-Delivery-in-Charni-Road-West",
            "Online-Cake-Delivery-in-Charni-Road-East",
            "Online-Cake-Delivery-in-Grant-Road-West",
            "Online-Cake-Delivery-in-Grant-Road-East",
            "Online-Cake-Delivery-in-Mumbai-Central-West",
            "Online-Cake-Delivery-in-Mumbai-Central-East",
            "Online-Cake-Delivery-in-Mahalaxmi-West",
            "Online-Cake-Delivery-in-Mahalaxmi-East",
            "Online-Cake-Delivery-in-Lower-Parel-West",
            "Online-Cake-Delivery-in-Lower-Parel-East",
            "Online-Cake-Delivery-in-Prabhadevi-West",
            "Online-Cake-Delivery-in-Prabhadevi-East",
            "Online-Cake-Delivery-in-Dadar-East",
            "Online-Cake-Delivery-in-Dadar-West",
            "Online-Cake-Delivery-in-Matunga",
            "Online-Cake-Delivery-in-Matunga-Road",
            "Online-Cake-Delivery-in-Mahim-West",
            "Online-Cake-Delivery-in-Mahim-East",
            "Online-Cake-Delivery-in-Bandra-West",
            "Online-Cake-Delivery-in-Bandra-East",
            "Online-Cake-Delivery-in-Khar-Road-West",
            "Online-Cake-Delivery-in-Khar-Road-East",
            "Online-Cake-Delivery-in-Santacruz-East",
            "Online-Cake-Delivery-in-Santacruz-West",
            "Online-Cake-Delivery-in-Ville-Parle-West",
            "Online-Cake-Delivery-in-Ville-Parle-East",
            "Online-Cake-Delivery-in-Andheri-West",
            "Online-Cake-Delivery-in-Andheri-East",
            "Online-Cake-Delivery-in-Jogeshwari-West",
            "Online-Cake-Delivery-in-Jogeshwari-East",
            "Online-Cake-Delivery-in-Goregaon-West",
            "Online-Cake-Delivery-in-Goregaon-East",
            "Online-Cake-Delivery-in-Malad-East",
            "Online-Cake-Delivery-in-Malad-West",
            "Online-Cake-Delivery-in-Kandivali-East",
            "Online-Cake-Delivery-in-Kandivali-West",
            "Online-Cake-Delivery-in-Borivali-East",
            "Online-Cake-Delivery-in-Borivali-West",
            "Online-Cake-Delivery-in-CSMT",
            "Online-Cake-Delivery-in-Masjid",
            "Online-Cake-Delivery-in-Sandhurst-Road",
            "Online-Cake-Delivery-in-Byculla",
            "Online-Cake-Delivery-in-Chinchpokli",
            "Online-Cake-Delivery-in-Currey-Road",
            "Online-Cake-Delivery-in-Parel",
            "Online-Cake-Delivery-in-Dadar",
            "Online-Cake-Delivery-in-Sion",
            "Online-Cake-Delivery-in-Kurla",
            "Online-Cake-Delivery-in-Vidhyavihar",
            "Online-Cake-Delivery-in-Ghatkopar",
            "Online-Cake-Delivery-in-Vikhroli",
            "Online-Cake-Delivery-in-Kanjur-Marg",
            "Online-Cake-Delivery-in-Bhandup",
            "Online-Cake-Delivery-in-Nahur",
            "Online-Cake-Delivery-in-Mulund",
            "Online-Cake-Delivery-in-Thane",
            "Online-Cake-Delivery-in-Versova",
            "Online-Cake-Delivery-in-D-N-Nagar",
            "Online-Cake-Delivery-in-Azad-Nagar",
            "Online-Cake-Delivery-in-J-B-Nagar",
            "Online-Cake-Delivery-in-Chakala",
            "Online-Cake-Delivery-in-Marol-Naka",
            "Online-Cake-Delivery-in-Saki-Naka",
            "Online-Cake-Delivery-in-Asalpha",
            "Online-Cake-Delivery-in-Jagruti-Naga",
            "Online-Cake-Delivery-in-Churchgate",
            "Online-Cake-Delivery-in-Marine-Lines",
            "Online-Cake-Delivery-in-Charni-Road",
            "Online-Cake-Delivery-in-Grant-Road",
            "Online-Cake-Delivery-in-Mumbai-Central",
            "Online-Cake-Delivery-in-Mahalaxmi",
            "Online-Cake-Delivery-in-Lower-Parel",
            "Online-Cake-Delivery-in-Prabhadevi",
            "Online-Cake-Delivery-in-Matunga-Road",
            "Online-Cake-Delivery-in-Mahim",
            "Online-Cake-Delivery-in-Bandra",
            "Online-Cake-Delivery-in-Khar-Road",
            "Online-Cake-Delivery-in-Santacruz",
            "Online-Cake-Delivery-in-Vile-Parle",
            "Online-Cake-Delivery-in-Andheri",
            "Online-Cake-Delivery-in-Jogeshwari",
            "Online-Cake-Delivery-in-Ram-Mandir",
            "Online-Cake-Delivery-in-Goregaon",
            "Online-Cake-Delivery-in-Malad",
            "Online-Cake-Delivery-in-Kandivali",
            "Online-Cake-Delivery-in-Borival",
        ]

    def location(self, item):
        # shop-list is the name of your view, so reverse it
        return reverse("shop-list") + item

