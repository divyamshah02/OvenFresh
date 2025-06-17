#!/usr/bin/env python3
"""
Homepage Data Migration Script
This script extracts data from your existing home.html and populates the CMS models
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ovenfresh_ecommerce.settings')  # Replace with your actual settings module
# django.setup()

# Import your models after Django setup
from .models import (
    HeroBanner, DeliveryPolicy, HomepageCategory, VideoContent, 
    Feature, AboutSection, AboutFeature, ProductSection, 
    ProductSectionItem, ClientLogo, FooterContent
)

def create_hero_banners():
    """Create hero banners based on your existing carousel"""
    print("Creating hero banners...")
    
    banners_data = [
        {
            'title': 'Fresh Baked Daily',
            'subtitle': 'Artisan Breads & Pastries',
            'description': 'Experience the finest quality baked goods made with premium ingredients and traditional techniques.',
            'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Shop Now',
            'button_link': '/shop/',
            'order': 1,
            'is_active': True
        },
        {
            'title': 'Premium Cakes & Desserts',
            'subtitle': 'Made with Love Since 1993',
            'description': 'Celebrate life\'s special moments with our handcrafted cakes and delightful desserts.',
            'image': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Order Custom Cake',
            'button_link': '/custom-cakes/',
            'order': 2,
            'is_active': True
        },
        {
            'title': 'Same Day Delivery',
            'subtitle': 'Fresh to Your Doorstep',
            'description': 'Order before 2 PM and get fresh baked goods delivered the same day across the city.',
            'image': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
            'button_text': 'Order Now',
            'button_link': '/shop/',
            'order': 3,
            'is_active': True
        }
    ]
    
    for banner_data in banners_data:
        banner, created = HeroBanner.objects.get_or_create(
            title=banner_data['title'],
            defaults=banner_data
        )
        if created:
            print(f"✓ Created banner: {banner.title}")
        else:
            print(f"- Banner already exists: {banner.title}")

def create_delivery_policies():
    """Create delivery policy cards"""
    print("\nCreating delivery policies...")
    
    policies_data = [
        {
            'policy_type': 'same_day',
            'title': 'Same Day Delivery',
            'icon': 'fas fa-truck-fast',
            'countdown_hours': 14,  # 2 PM cutoff
            'countdown_minutes': 0,
            'countdown_seconds': 0,
            'delivery_time': 'Order before 2 PM',
            'description': 'Get your fresh baked goods delivered the same day',
            'order': 1,
            'is_active': True
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
            'order': 2,
            'is_active': True
        },
        {
            'policy_type': 'info',
            'title': 'Fresh Guarantee',
            'icon': 'fas fa-leaf',
            'delivery_time': 'Always Fresh',
            'description': 'We guarantee the freshness of all our products',
            'order': 3,
            'is_active': True
        },
        {
            'policy_type': 'info',
            'title': 'Quality Assured',
            'icon': 'fas fa-award',
            'delivery_time': 'Premium Quality',
            'description': 'Made with finest ingredients and traditional methods',
            'order': 4,
            'is_active': True
        }
    ]
    
    for policy_data in policies_data:
        policy, created = DeliveryPolicy.objects.get_or_create(
            title=policy_data['title'],
            defaults=policy_data
        )
        if created:
            print(f"✓ Created policy: {policy.title}")
        else:
            print(f"- Policy already exists: {policy.title}")

def create_homepage_categories():
    """Create homepage categories"""
    print("\nCreating homepage categories...")
    
    categories_data = [
        {
            'title': 'Fresh Breads',
            'description': 'Artisan breads baked daily with premium ingredients',
            'image': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/breads/',
            'order': 1,
            'is_active': True
        },
        {
            'title': 'Custom Cakes',
            'description': 'Personalized cakes for your special occasions',
            'image': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/cakes/',
            'order': 2,
            'is_active': True
        },
        {
            'title': 'Pastries',
            'description': 'Delicate pastries and sweet treats',
            'image': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/pastries/',
            'order': 3,
            'is_active': True
        },
        {
            'title': 'Cookies',
            'description': 'Freshly baked cookies in various flavors',
            'image': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/cookies/',
            'order': 4,
            'is_active': True
        },
        {
            'title': 'Desserts',
            'description': 'Indulgent desserts for every sweet tooth',
            'image': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/desserts/',
            'order': 5,
            'is_active': True
        },
        {
            'title': 'Seasonal Specials',
            'description': 'Limited time seasonal offerings',
            'image': 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            'category_link': '/shop/seasonal/',
            'order': 6,
            'is_active': True
        }
    ]
    
    for category_data in categories_data:
        category, created = HomepageCategory.objects.get_or_create(
            title=category_data['title'],
            defaults=category_data
        )
        if created:
            print(f"✓ Created category: {category.title}")
        else:
            print(f"- Category already exists: {category.title}")

def create_video_content():
    """Create video content section"""
    print("\nCreating video content...")
    
    videos_data = [
        {
            'position': 'left',
            'video_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ',  # Replace with actual video
            'is_active': True
        },
        {
            'position': 'center_text',
            'text_content': '''
            <div class="text-center p-4">
                <h3 class="text-primary mb-3">Our Baking Process</h3>
                <p class="lead">Watch how we create our delicious baked goods using traditional techniques and premium ingredients.</p>
                <p>From mixing the dough to the final decoration, every step is done with care and precision to ensure the highest quality.</p>
            </div>
            ''',
            'is_active': True
        },
        {
            'position': 'right',
            'video_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ',  # Replace with actual video
            'is_active': True
        }
    ]
    
    for video_data in videos_data:
        video, created = VideoContent.objects.get_or_create(
            position=video_data['position'],
            defaults=video_data
        )
        if created:
            print(f"✓ Created video content: {video.get_position_display()}")
        else:
            print(f"- Video content already exists: {video.get_position_display()}")

def create_features():
    """Create features section"""
    print("\nCreating features...")
    
    features_data = [
        {
            'title': 'Fresh Daily',
            'description': 'All our products are baked fresh every morning using traditional recipes',
            'icon': 'fas fa-leaf',
            'order': 1,
            'is_active': True
        },
        {
            'title': 'Premium Ingredients',
            'description': 'We use only the finest quality ingredients sourced from trusted suppliers',
            'icon': 'fas fa-star',
            'order': 2,
            'is_active': True
        },
        {
            'title': 'Expert Bakers',
            'description': 'Our skilled bakers have decades of experience in traditional baking methods',
            'icon': 'fas fa-user-tie',
            'order': 3,
            'is_active': True
        },
        {
            'title': 'Custom Orders',
            'description': 'We create personalized cakes and treats for your special occasions',
            'icon': 'fas fa-birthday-cake',
            'order': 4,
            'is_active': True
        },
        {
            'title': 'Fast Delivery',
            'description': 'Same day delivery available for orders placed before 2 PM',
            'icon': 'fas fa-shipping-fast',
            'order': 5,
            'is_active': True
        },
        {
            'title': 'Quality Guarantee',
            'description': 'We stand behind our products with a 100% satisfaction guarantee',
            'icon': 'fas fa-shield-alt',
            'order': 6,
            'is_active': True
        }
    ]
    
    for feature_data in features_data:
        feature, created = Feature.objects.get_or_create(
            title=feature_data['title'],
            defaults=feature_data
        )
        if created:
            print(f"✓ Created feature: {feature.title}")
        else:
            print(f"- Feature already exists: {feature.title}")

def create_about_section():
    """Create about section with features"""
    print("\nCreating about section...")
    
    about_data = {
        'subtitle': 'Our Story',
        'title': 'Baking with Love Since 1993',
        'description_1': 'For over three decades, OvenFresh has been delighting customers with our artisan baked goods. What started as a small family bakery has grown into a beloved institution, but we\'ve never forgotten our roots.',
        'description_2': 'Every morning, our skilled bakers arrive before dawn to begin the time-honored process of creating fresh breads, pastries, and cakes. We use only the finest ingredients and traditional techniques passed down through generations.',
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
                'title': 'Family Recipe',
                'description': 'Passed down through generations',
                'icon': 'fas fa-heart',
                'order': 3
            }
        ]
        
        for feature_data in about_features_data:
            feature_data['about_section'] = about
            AboutFeature.objects.create(**feature_data)
            print(f"  ✓ Created about feature: {feature_data['title']}")
    else:
        print(f"- About section already exists: {about.title}")

def create_product_sections():
    """Create product sections"""
    print("\nCreating product sections...")
    
    sections_data = [
        {
            'title': 'Featured Products',
            'subtitle': 'Our Most Popular Items',
            'description': 'Discover our customers\' favorite baked goods',
            'section_type': 'featured',
            'order': 1,
            'is_active': True
        },
        {
            'title': 'Best Sellers',
            'subtitle': 'Top Rated Products',
            'description': 'The products our customers love the most',
            'section_type': 'bestsellers',
            'order': 2,
            'is_active': True
        },
        {
            'title': 'New Arrivals',
            'subtitle': 'Fresh Additions',
            'description': 'Check out our latest creations',
            'section_type': 'new',
            'order': 3,
            'is_active': True
        }
    ]
    
    for section_data in sections_data:
        section, created = ProductSection.objects.get_or_create(
            title=section_data['title'],
            defaults=section_data
        )
        if created:
            print(f"✓ Created product section: {section.title}")
            
            # Add sample products to each section
            sample_products = ['PROD001', 'PROD002', 'PROD003', 'PROD004']
            for i, product_id in enumerate(sample_products):
                ProductSectionItem.objects.create(
                    section=section,
                    product_id=product_id,
                    order=i + 1,
                    is_active=True
                )
            print(f"  ✓ Added {len(sample_products)} sample products")
        else:
            print(f"- Product section already exists: {section.title}")

def create_client_logos():
    """Create client logos"""
    print("\nCreating client logos...")
    
    logos_data = [
        {
            'company_name': 'Marriott Hotels',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Marriott-Logo.png',
            'website_url': 'https://marriott.com',
            'order': 1,
            'is_active': True
        },
        {
            'company_name': 'Hilton',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Hilton-Logo.png',
            'website_url': 'https://hilton.com',
            'order': 2,
            'is_active': True
        },
        {
            'company_name': 'Starbucks',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/09/Starbucks-Logo.png',
            'website_url': 'https://starbucks.com',
            'order': 3,
            'is_active': True
        },
        {
            'company_name': 'Hyatt',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Hyatt-Logo.png',
            'website_url': 'https://hyatt.com',
            'order': 4,
            'is_active': True
        },
        {
            'company_name': 'Four Seasons',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Four-Seasons-Logo.png',
            'website_url': 'https://fourseasons.com',
            'order': 5,
            'is_active': True
        },
        {
            'company_name': 'Ritz Carlton',
            'logo_url': 'https://logos-world.net/wp-content/uploads/2020/06/Ritz-Carlton-Logo.png',
            'website_url': 'https://ritzcarlton.com',
            'order': 6,
            'is_active': True
        }
    ]
    
    for logo_data in logos_data:
        logo, created = ClientLogo.objects.get_or_create(
            company_name=logo_data['company_name'],
            defaults=logo_data
        )
        if created:
            print(f"✓ Created client logo: {logo.company_name}")
        else:
            print(f"- Client logo already exists: {logo.company_name}")

def create_footer_content():
    """Create footer content"""
    print("\nCreating footer content...")
    
    footer_data = [
        {
            'section_type': 'company_info',
            'title': 'OvenFresh Bakery',
            'content': '''
            <p>Baking with love since 1993. We are committed to providing the finest quality baked goods using traditional methods and premium ingredients.</p>
            <div class="social-links">
                <a href="#" class="me-3"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="me-3"><i class="fab fa-instagram"></i></a>
                <a href="#" class="me-3"><i class="fab fa-twitter"></i></a>
                <a href="#" class="me-3"><i class="fab fa-youtube"></i></a>
            </div>
            ''',
            'order': 1,
            'is_active': True
        },
        {
            'section_type': 'useful_links',
            'title': 'Useful Links',
            'content': '''
            <ul class="list-unstyled">
                <li><a href="/about/">About Us</a></li>
                <li><a href="/shop/">Our Products</a></li>
                <li><a href="/custom-orders/">Custom Orders</a></li>
                <li><a href="/delivery/">Delivery Info</a></li>
                <li><a href="/contact/">Contact Us</a></li>
            </ul>
            ''',
            'order': 2,
            'is_active': True
        },
        {
            'section_type': 'quick_links',
            'title': 'Quick Links',
            'content': '''
            <ul class="list-unstyled">
                <li><a href="/privacy/">Privacy Policy</a></li>
                <li><a href="/terms/">Terms of Service</a></li>
                <li><a href="/faq/">FAQ</a></li>
                <li><a href="/careers/">Careers</a></li>
                <li><a href="/wholesale/">Wholesale</a></li>
            </ul>
            ''',
            'order': 3,
            'is_active': True
        },
        {
            'section_type': 'contact',
            'title': 'Contact Info',
            'content': '''
            <div class="contact-info">
                <p><i class="fas fa-map-marker-alt me-2"></i> 123 Baker Street, City, State 12345</p>
                <p><i class="fas fa-phone me-2"></i> +1 (555) 123-4567</p>
                <p><i class="fas fa-envelope me-2"></i> info@ovenfresh.com</p>
                <p><i class="fas fa-clock me-2"></i> Mon-Sun: 6:00 AM - 10:00 PM</p>
            </div>
            ''',
            'order': 4,
            'is_active': True
        },
        {
            'section_type': 'newsletter',
            'title': 'Newsletter',
            'content': '''
            <p>Subscribe to get updates on new products and special offers.</p>
            <form class="newsletter-form">
                <div class="input-group">
                    <input type="email" class="form-control" placeholder="Your email">
                    <button class="btn btn-primary" type="submit">Subscribe</button>
                </div>
            </form>
            ''',
            'order': 5,
            'is_active': True
        },
        {
            'section_type': 'location_links',
            'title': 'Our Locations',
            'content': '''
            <ul class="list-unstyled">
                <li><a href="/locations/downtown/">Downtown Store</a></li>
                <li><a href="/locations/mall/">Shopping Mall</a></li>
                <li><a href="/locations/airport/">Airport Terminal</a></li>
                <li><a href="/locations/suburb/">Suburban Branch</a></li>
            </ul>
            ''',
            'order': 6,
            'is_active': True
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
        else:
            print(f"- Footer content already exists: {content.title}")

def start_migrations_personl():
    """Main migration function"""
    print("🚀 Starting homepage data migration...")
    print("=" * 50)
    
    try:
        # Create all content sections
        create_hero_banners()
        create_delivery_policies()
        create_homepage_categories()
        create_video_content()
        create_features()
        create_about_section()
        create_product_sections()
        create_client_logos()
        create_footer_content()
        
        print("\n" + "=" * 50)
        print("✅ Homepage data migration completed successfully!")
        print("\nSummary:")
        print(f"- Hero Banners: {HeroBanner.objects.count()}")
        print(f"- Delivery Policies: {DeliveryPolicy.objects.count()}")
        print(f"- Categories: {HomepageCategory.objects.count()}")
        print(f"- Video Content: {VideoContent.objects.count()}")
        print(f"- Features: {Feature.objects.count()}")
        print(f"- About Sections: {AboutSection.objects.count()}")
        print(f"- Product Sections: {ProductSection.objects.count()}")
        print(f"- Client Logos: {ClientLogo.objects.count()}")
        print(f"- Footer Content: {FooterContent.objects.count()}")
        
        print("\n📝 Next steps:")
        print("1. Update the image URLs with your actual images")
        print("2. Replace sample product IDs with real product IDs")
        print("3. Update video URLs with your actual videos")
        print("4. Customize the content to match your brand")
        print("5. Run the Django admin to fine-tune the content")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {str(e)}")
        print("Please check your Django setup and model imports.")
        sys.exit(1)

if __name__ == "__main__":
    start_migrations_personl()
