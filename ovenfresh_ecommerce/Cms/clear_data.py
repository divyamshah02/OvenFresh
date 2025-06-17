#!/usr/bin/env python3
"""
CMS Data Cleanup Script
This script removes all existing CMS data to provide a fresh start
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
    ProductSectionItem, ClientLogo, FooterContent
)

def clear_all_cms_data():
    """Clear all CMS data from the database"""
    print("🧹 Starting CMS data cleanup...")
    print("=" * 50)
    
    try:
        # Clear CMS content (in reverse dependency order)
        print("Clearing CMS content...")
        
        # Clear product section items first (has foreign key to ProductSection)
        count = ProductSectionItem.objects.count()
        ProductSectionItem.objects.all().delete()
        print(f"✓ Deleted {count} product section items")
        
        # Clear about features (has foreign key to AboutSection)
        count = AboutFeature.objects.count()
        AboutFeature.objects.all().delete()
        print(f"✓ Deleted {count} about features")
        
        # Clear main CMS models
        models_to_clear = [
            (HeroBanner, "hero banners"),
            (DeliveryPolicy, "delivery policies"),
            (HomepageCategory, "homepage categories"),
            (VideoContent, "video content"),
            (Feature, "features"),
            (AboutSection, "about sections"),
            (ProductSection, "product sections"),
            (ClientLogo, "client logos"),
            (FooterContent, "footer content"),
        ]
        
        for model, name in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            print(f"✓ Deleted {count} {name}")
        
        print("\n" + "=" * 50)
        print("✅ CMS data cleanup completed successfully!")
        print("\nAll CMS content has been removed. You can now run the fresh data migration script.")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        print("Please check your Django setup and model imports.")
        sys.exit(1)


def clear_data():
    """Main cleanup function"""
    print("🚀 CMS Data Cleanup Tool")
    print("=" * 50)
    
    # Ask user what to clear
    print("\nWhat would you like to clear?")
    print("1. CMS content only (recommended)")
    print("2. CMS content + Product data (categories, subcategories, products)")
    print("3. Cancel")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        confirm = input("\n⚠️  This will delete ALL CMS content. Are you sure? (yes/no): ").strip().lower()
        if confirm == "yes":
            clear_all_cms_data()
        else:
            print("Operation cancelled.")
    
    elif choice == "2":
        confirm = input("\n⚠️  This will delete ALL CMS content AND product data. Are you sure? (yes/no): ").strip().lower()
        if confirm == "yes":
            clear_all_cms_data()
            
        else:
            print("Operation cancelled.")
    
    elif choice == "3":
        print("Operation cancelled.")
    
    else:
        print("Invalid choice. Operation cancelled.")

if __name__ == "__main__":
    clear_data()
