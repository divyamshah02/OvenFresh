import json

# Load your products JSON
with open("output.json", "r", encoding="utf-8") as f:
    products = json.load(f)

index_seen = set()
duplicate_indexes = set()

def check_index(index_row):
    if index_row in index_seen:
        duplicate_indexes.add(index_row)
    index_seen.add(index_row)

valid_products = []

for product in products:
    parent_index = product.get("Index_row")
    check_index(parent_index)

    variations = product.get("Products_varaitons", [])

    # Skip product if variations are missing/empty
    if not variations:
        continue

    # Skip if no category
    if not product.get("Categories"):
        continue

    # Check variations
    invalid = False
    for var in variations:
        check_index(var.get("Index_row"))

        # Price check
        price = var.get("Regular price")
        if price is None or price == 0:
            invalid = True
            break

        # Weight check
        weight = None
        if var.get("Attribute 1 name") and "weight" in str(var.get("Attribute 1 name")).lower():
            weight = var.get("Attribute 1 value(s)")
        elif var.get("Attribute 2 name") and "weight" in str(var.get("Attribute 2 name")).lower():
            weight = var.get("Attribute 2 value(s)")

        if not weight:
            invalid = True
            break

    if not invalid:
        valid_products.append(product)

# Save only valid products
with open("filtered_products.json", "w", encoding="utf-8") as f:
    json.dump(valid_products, f, ensure_ascii=False, indent=4)

# Report duplicates
if duplicate_indexes:
    print(f"⚠️ Duplicate Index_row values found (these products were NOT removed for it): {sorted(duplicate_indexes)}")

print(f"✅ Filtered products saved to filtered_products.json — kept {len(valid_products)} / {len(products)}")
