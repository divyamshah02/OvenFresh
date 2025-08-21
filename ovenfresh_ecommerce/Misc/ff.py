import json
import unicodedata

def normalize_text(text):
    # Normalize unicode (remove accents) and strip spaces
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return text.strip()

# Load products
with open("output (1).json", "r", encoding="utf-8") as f:
    products = json.load(f)

for p in products:
    category_string = p.get("Categories", "")
    if not category_string:
        p["Categories"] = None
        continue

    parts = [normalize_text(x) for x in category_string.split(",") if x.strip()]
    main_category = None
    subcategories = []

    for part in parts:
        if ">" in part:
            left, right = [normalize_text(x) for x in part.split(">", 1)]
            if main_category is None:
                main_category = left
            if left == main_category and right not in subcategories:
                subcategories.append(right)
        else:
            if main_category is None:
                main_category = part

    # Replace Categories with dict like your print
    p["Categories"] = {main_category: subcategories}

# Save to new JSON
with open("output_updated.json", "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("✅ Categories replaced and saved to output_updated.json")
