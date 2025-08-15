import json
import pdb
import unicodedata

with open("filtered_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

category_lines = []
for p in products:
    
    category_string = p.get("Categories", "")
    if not category_string:
        continue
    category_lines.append(category_string)
    # parts = [c.strip() for c in category_string.split(">")]
    # main_cat = parts[0]
    # sub_cat = parts[1] if len(parts) > 1 else None


    # pdb.set_trace()


def normalize_text(text):
    # Normalize unicode (remove accents) and strip spaces
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    return text.strip()

for line in category_lines:
    parts = [normalize_text(p) for p in line.split(",") if p.strip()]
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

    print(json.dumps({main_category: subcategories}, ensure_ascii=False))