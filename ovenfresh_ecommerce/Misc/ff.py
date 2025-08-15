import json
import pdb

with open("filtered_products.json", "r", encoding="utf-8") as f:
    products = json.load(f)


for p in products:
    
    category_string = p.get("Categories", "")
    if not category_string:
        continue
    print(category_string)
    # parts = [c.strip() for c in category_string.split(">")]
    # main_cat = parts[0]
    # sub_cat = parts[1] if len(parts) > 1 else None


    # pdb.set_trace()

