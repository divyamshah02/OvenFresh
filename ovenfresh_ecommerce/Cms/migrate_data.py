#!/usr/bin/env python3
"""
Fresh Homepage Data Migration Script
This script creates fresh CMS data with modern content and proper product categories
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')  # Replace with your actual settings module
django.setup()

# Import your models after Django setup
from .models import (
    HeroBanner, DeliveryPolicy, HomepageCategory, VideoContent, 
    Feature, AboutSection, AboutFeature, ProductSection, 
    ProductSectionItem, ClientLogo, FooterContent,
)


def create_hero_banners():
    """Create modern hero banners"""
    print("\nCreating hero banners...")
    
    banners_data = [
        {
            'title': 'Fresh Baked Daily',
            'subtitle': 'Artisan Quality Since 1993',
            'description': 'Experience the finest handcrafted breads, cakes, and pastries made with premium ingredients and traditional techniques.',
            'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Shop Fresh Breads',
            'button_link': '/shop/breads-buns/',
            'order': 1
        },
        {
            'title': 'Custom Celebration Cakes',
            'subtitle': 'Make Every Moment Special',
            'description': 'From birthdays to weddings, our custom cakes are crafted to perfection for your special occasions.',
            'image': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Order Custom Cake',
            'button_link': '/shop/cakes-pastries/',
            'order': 2
        },
        {
            'title': 'Same Day Delivery',
            'subtitle': 'Fresh to Your Doorstep',
            'description': 'Order before 2 PM and enjoy fresh baked goods delivered the same day across the city.',
            'image': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Order Now',
            'button_link': '/shop/',
            'order': 3
        }
    ]
    
    for banner_data in banners_data:
        banner, created = HeroBanner.objects.get_or_create(
            title=banner_data['title'],
            defaults=banner_data
        )
        if created:
            print(f"✓ Created banner: {banner.title}")

def create_delivery_policies():
    """Create delivery policy cards"""
    print("\nCreating delivery policies...")
    
    policies_data = [
        {
            'policy_type': 'same_day',
            'title': 'Same Day Delivery',
            'icon': 'fas fa-truck-fast',
            'countdown_hours': 14,
            'countdown_minutes': 0,
            'countdown_seconds': 0,
            'delivery_time': 'Order before 2 PM',
            'description': 'Get your fresh baked goods delivered the same day',
            'order': 1
        },
        {
            'policy_type': 'midnight',
            'title': 'Midnight Delivery',
            'icon': 'fas fa-moon',
            'countdown_hours': 23,
            'countdown_minutes': 59,
            'countdown_seconds': 59,
            'delivery_time': 'Available until 11:59 PM',
            'description': 'Special midnight delivery for celebrations',
            'order': 2
        },
        {
            'policy_type': 'info',
            'title': 'Fresh Guarantee',
            'icon': 'fas fa-leaf',
            'delivery_time': 'Always Fresh',
            'description': 'We guarantee the freshness of all our products',
            'order': 3
        },
        {
            'policy_type': 'info',
            'title': 'Quality Assured',
            'icon': 'fas fa-award',
            'delivery_time': 'Premium Quality',
            'description': 'Made with finest ingredients and traditional methods',
            'order': 4
        }
    ]
    
    for policy_data in policies_data:
        policy, created = DeliveryPolicy.objects.get_or_create(
            title=policy_data['title'],
            defaults=policy_data
        )
        if created:
            print(f"✓ Created policy: {policy.title}")

def create_homepage_categories():
    """Create homepage category showcase"""
    print("\nCreating homepage categories...")
    
    categories_data = [
        {
            'title': 'Artisan Breads',
            'description': 'Handcrafted daily with traditional techniques',
            'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/breads-buns/',
            'order': 1
        },
        {
            'title': 'Custom Cakes',
            'description': 'Personalized for your special moments',
            'image': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/cakes-pastries/',
            'order': 2
        },
        {
            'title': 'Fresh Cookies',
            'description': 'Baked fresh daily in various flavors',
            'image': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/cookies-biscuits/',
            'order': 3
        },
        {
            'title': 'Sweet Desserts',
            'description': 'Indulgent treats for every sweet tooth',
            'image': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/desserts-sweets/',
            'order': 4
        },
        {
            'title': 'Seasonal Specials',
            'description': 'Limited time festive offerings',
            'image': 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/seasonal-specials/',
            'order': 5
        }
    ]
    
    for category_data in categories_data:
        category, created = HomepageCategory.objects.get_or_create(
            title=category_data['title'],
            defaults=category_data
        )
        if created:
            print(f"✓ Created homepage category: {category.title}")

def create_features():
    """Create features section"""
    print("\nCreating features...")
    
    features_data = [
        {
            'title': 'Fresh Daily',
            'description': 'All products baked fresh every morning using traditional recipes',
            'icon': 'fas fa-leaf',
            'order': 1
        },
        {
            'title': 'Premium Ingredients',
            'description': 'Only the finest quality ingredients sourced from trusted suppliers',
            'icon': 'fas fa-star',
            'order': 2
        },
        {
            'title': 'Expert Bakers',
            'description': 'Skilled artisans with decades of traditional baking experience',
            'icon': 'fas fa-user-tie',
            'order': 3
        },
        {
            'title': 'Custom Orders',
            'description': 'Personalized cakes and treats for your special occasions',
            'icon': 'fas fa-birthday-cake',
            'order': 4
        },
        {
            'title': 'Fast Delivery',
            'description': 'Same day delivery available for orders placed before 2 PM',
            'icon': 'fas fa-shipping-fast',
            'order': 5
        },
        {
            'title': 'Quality Guarantee',
            'description': '100% satisfaction guarantee on all our baked goods',
            'icon': 'fas fa-shield-alt',
            'order': 6
        }
    ]
    
    for feature_data in features_data:
        feature, created = Feature.objects.get_or_create(
            title=feature_data['title'],
            defaults=feature_data
        )
        if created:
            print(f"✓ Created feature: {feature.title}")

def create_about_section():
    """Create about section"""
    print("\nCreating about section...")
    
    about_data = {
        'subtitle': 'Our Story',
        'title': 'Baking with Love Since 1993',
        'description_1': 'For over three decades, OvenFresh has been the heart of our community, bringing families together with the aroma of freshly baked goods. What started as a small neighborhood bakery has grown into a beloved institution.',
        'description_2': 'Every morning before dawn, our master bakers begin the sacred ritual of creating bread, pastries, and cakes using time-honored techniques passed down through generations. We believe that great baking starts with great ingredients and ends with great care.',
        'main_image': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'years_experience': 30,
        'button_text': 'Explore Our Products',
        'button_link': '/shop/',
        'is_active': True
    }
    
    about, created = AboutSection.objects.get_or_create(
        title=about_data['title'],
        defaults=about_data
    )
    
    if created:
        print(f"✓ Created about section: {about.title}")
        
        # Create about features
        about_features_data = [
            {
                'title': 'Traditional Methods',
                'description': 'Time-tested baking techniques',
                'icon': 'fas fa-history',
                'order': 1
            },
            {
                'title': 'Premium Quality',
                'description': 'Only the finest ingredients',
                'icon': 'fas fa-gem',
                'order': 2
            },
            {
                'title': 'Family Recipes',
                'description': 'Passed down through generations',
                'icon': 'fas fa-heart',
                'order': 3
            }
        ]
        
        for feature_data in about_features_data:
            feature_data['about_section'] = about
            AboutFeature.objects.create(**feature_data)
            print(f"  ✓ Created about feature: {feature_data['title']}")

def create_product_sections(categories, products):
    """Create dynamic product sections"""
    print("\nCreating product sections...")
    
    # Get category IDs
    breads_category = categories.get('breads-buns')
    cakes_category = categories.get('cakes-pastries')
    cookies_category = categories.get('cookies-biscuits')
    
    sections_data = [
        {
            'title': 'Featured Products',
            'subtitle': 'Our Most Popular Items',
            'description': 'Discover our customers\' favorite handcrafted baked goods',
            'section_type': 'featured',
            'max_products': 8,
            'order': 1
        },
        {
            'title': 'Fresh Breads Collection',
            'subtitle': 'Artisan Breads & Buns',
            'description': 'Handcrafted daily with traditional techniques',
            'section_type': 'category_based',
            'category_id': str(breads_category.id) if breads_category else None,
            'max_products': 6,
            'order': 2
        },
        {
            'title': 'Celebration Cakes',
            'subtitle': 'Custom & Ready-Made Cakes',
            'description': 'Perfect for birthdays, weddings, and special occasions',
            'section_type': 'category_based',
            'category_id': str(cakes_category.id) if cakes_category else None,
            'max_products': 6,
            'order': 3
        },
        {
            'title': 'Best Sellers',
            'subtitle': 'Customer Favorites',
            'description': 'The products our customers love the most',
            'section_type': 'bestsellers',
            'max_products': 8,
            'order': 4
        },
        {
            'title': 'Cookie Collection',
            'subtitle': 'Fresh Baked Cookies',
            'description': 'Classic and gourmet cookies baked fresh daily',
            'section_type': 'category_based',
            'category_id': str(cookies_category.id) if cookies_category else None,
            'max_products': 4,
            'order': 5
        }
    ]
    
    for section_data in sections_data:
        section, created = ProductSection.objects.get_or_create(
            title=section_data['title'],
            defaults=section_data
        )
        if created:
            print(f"✓ Created product section: {section.title}")
            
            # Add products to custom sections
            if section.section_type == 'featured':
                featured_products = [p for p in products if p.is_featured][:section.max_products]
                for i, product in enumerate(featured_products):
                    ProductSectionItem.objects.create(
                        section=section,
                        product_id=str(product.id),
                        order=i + 1
                    )
                print(f"  ✓ Added {len(featured_products)} featured products")

def create_client_logos():
    """Create client logos"""
    print("\nCreating client logos...")
    
    logos_data = [
        {
            'company_name': 'Marriott Hotels',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Marriott-Logo.png',
            'website_url': 'https://marriott.com',
            'order': 1
        },
        {
            'company_name': 'Hilton',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Hilton-Logo.png',
            'website_url': 'https://hilton.com',
            'order': 2
        },
        {
            'company_name': 'Taj Hotels',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Taj-Hotels-Logo.png',
            'website_url': 'https://tajhotels.com',
            'order': 3
        },
        {
            'company_name': 'ITC Hotels',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/ITC-Logo.png',
            'website_url': 'https://itchotels.com',
            'order': 4
        },
        {
            'company_name': 'Oberoi Hotels',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Oberoi-Logo.png',
            'website_url': 'https://oberoihotels.com',
            'order': 5
        },
        {
            'company_name': 'Leela Palaces',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Leela-Logo.png',
            'website_url': 'https://theleela.com',
            'order': 6
        }
    ]
    
    for logo_data in logos_data:
        logo, created = ClientLogo.objects.get_or_create(
            company_name=logo_data['company_name'],
            defaults=logo_data
        )
        if created:
            print(f"✓ Created client logo: {logo.company_name}")

def create_footer_content():
    """Create footer content"""
    print("\nCreating footer content...")
    
    footer_data = [
        {
            'section_type': 'company_info',
            'title': 'OvenFresh Bakery',
            'content': '''
            <p class="mb-3">Baking with love since 1993. We are committed to providing the finest quality baked goods using traditional methods and premium ingredients.</p>
            <div class="social-links">
                <a href="#" class="me-3 text-decoration-none"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="me-3 text-decoration-none"><i class="fab fa-instagram"></i></a>
                <a href="#" class="me-3 text-decoration-none"><i class="fab fa-twitter"></i></a>
                <a href="#" class="me-3 text-decoration-none"><i class="fab fa-youtube"></i></a>
            </div>
            ''',
            'order': 1
        },
        {
            'section_type': 'useful_links',
            'title': 'Quick Links',
            'content': '''
            <ul class="list-unstyled">
                <li class="mb-2"><a href="/about/" class="text-decoration-none">About Us</a></li>
                <li class="mb-2"><a href="/shop/" class="text-decoration-none">Our Products</a></li>
                <li class="mb-2"><a href="/custom-orders/" class="text-decoration-none">Custom Orders</a></li>
                <li class="mb-2"><a href="/delivery/" class="text-decoration-none">Delivery Info</a></li>
                <li class="mb-2"><a href="/contact/" class="text-decoration-none">Contact Us</a></li>
            </ul>
            ''',
            'order': 2
        },
        {
            'section_type': 'contact',
            'title': 'Contact Info',
            'content': '''
            <div class="contact-info">
                <p class="mb-2"><i class="fas fa-map-marker-alt me-2"></i> 123 Baker Street, Mumbai, MH 400001</p>
                <p class="mb-2"><i class="fas fa-phone me-2"></i> +91 98765 43210</p>
                <p class="mb-2"><i class="fas fa-envelope me-2"></i> info@ovenfresh.com</p>
                <p class="mb-2"><i class="fas fa-clock me-2"></i> Mon-Sun: 6:00 AM - 10:00 PM</p>
            </div>
            ''',
            'order': 3
        },
        {
            'section_type': 'newsletter',
            'title': 'Stay Updated',
            'content': '''
            <p class="mb-3">Subscribe to get updates on new products and special offers.</p>
            <form class="newsletter-form">
                <div class="input-group">
                    <input type="email" class="form-control" placeholder="Your email address">
                    <button class="btn btn-primary" type="submit">Subscribe</button>
                </div>
            </form>
            ''',
            'order': 4
        }
    ]
    
    for footer_item in footer_data:
        content, created = FooterContent.objects.get_or_create(
            section_type=footer_item['section_type'],
            title=footer_item['title'],
            defaults=footer_item
        )
        if created:
            print(f"✓ Created footer content: {content.title}")

def start_migrations_personl():
    """Main migration function"""
    print("🚀 Starting fresh homepage data migration...")
    print("=" * 60)
    
    try:
        
        
        # Create all homepage content sections
        create_hero_banners()
        create_delivery_policies()
        create_homepage_categories()
        create_features()
        create_about_section()
        # create_product_sections(categories, products)
        create_client_logos()
        create_footer_content()
        
        print("\n" + "=" * 60)
        print("✅ Fresh homepage data migration completed successfully!")
        print("\n📊 Summary:")
        # print(f"- Categories: {Category.objects.count()}")
        # print(f"- Subcategories: {SubCategory.objects.count()}")
        # print(f"- Products: {Product.objects.count()}")
        print(f"- Hero Banners: {HeroBanner.objects.count()}")
        print(f"- Delivery Policies: {DeliveryPolicy.objects.count()}")
        print(f"- Homepage Categories: {HomepageCategory.objects.count()}")
        print(f"- Features: {Feature.objects.count()}")
        print(f"- About Sections: {AboutSection.objects.count()}")
        print(f"- Product Sections: {ProductSection.objects.count()}")
        print(f"- Client Logos: {ClientLogo.objects.count()}")
        print(f"- Footer Content: {FooterContent.objects.count()}")
        
        print("\n🎉 Next steps:")
        print("1. Visit your homepage to see the new content")
        print("2. Access the admin panel to manage content")
        print("3. Use the homepage manager to customize sections")
        print("4. Update images and content to match your brand")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        print("Please check your Django setup and model imports.")
        sys.exit(1)

if __name__ == "__main__":
    start_migrations_personl()
