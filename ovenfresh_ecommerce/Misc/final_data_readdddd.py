import pandas as pd
import pdb
import re
import json
# df = pd.read_excel(r"C:\Users\Divyam Shah\Downloads\product_list.xlsx")

# unique_products = []
# unique_products_name = []
# empty_data = []
# non_child_with_price = []
# pattern = r"-\s*\d+(?:\.\d+)?\s*(?:kg|kgs|g|gm|gms|gram|grams|mg|ml|l|ltr|litre|litres)\s*$"


# for i,row in df.iterrows():   
#     if pd.isna(row['Name']):
#         empty_data.append(row)
#         continue

#     is_parent_product = False
#     if pd.isna(row['Regular price']) or row['Regular price'] == '':
#         if row['Name'] not in unique_products_name:
#             temp_dictt = {
#                 'Index_row': i,
#                 'Name': row['Name'],
#                 'Short description': row['Short description'],
#                 'Stock': row['Stock'],
#                 'Categories': row['Categories'],
#                 'Images': row['Images'],
#                 'Attribute 1 name': row['Attribute 1 name'],
#                 'Attribute 1 value(s)': row['Attribute 1 value(s)'],
#                 'Attribute 1 visible': row['Attribute 1 visible'],
#                 'Attribute 1 global': row['Attribute 1 global'],
#                 'Attribute 2 name': row['Attribute 2 name'],
#                 'Attribute 2 value(s)': row['Attribute 2 value(s)'],
#                 'Attribute 2 visible': row['Attribute 2 visible'],
#                 'Attribute 2 global': row['Attribute 2 global'],
#             }
#             unique_products.append(temp_dictt)
#             unique_products_name.append(row['Name'])
#         continue
    
#     if (pd.notna(row['Regular price']) and str(row['Regular price']).strip() != '') \
#        and not re.search(pattern, str(row['Name']), flags=re.IGNORECASE):
#         # print(f"Direct product with price found: {row['Name']}")
#         # pdb.set_trace()
#         temp_dict_direct_prod = {
#                 'Index_row': i,                
#                 'Name': row['Name'],
#                 'Short description': row['Short description'],
#                 'Stock': row['Stock'],
#                 'Categories': row['Categories'],
#                 'Images': row['Images'],
#                 'Attribute 1 name': row['Attribute 1 name'],
#                 'Attribute 1 value(s)': row['Attribute 1 value(s)'],
#                 'Attribute 1 visible': row['Attribute 1 visible'],
#                 'Attribute 1 global': row['Attribute 1 global'],
#                 'Attribute 2 name': row['Attribute 2 name'],
#                 'Attribute 2 value(s)': row['Attribute 2 value(s)'],
#                 'Attribute 2 visible': row['Attribute 2 visible'],
#                 'Attribute 2 global': row['Attribute 2 global'],
#                 'Products_varaitons' : [
#                     {
#                         'Index_row': i,
#                         'In stock?': row['In stock?'],
#                         'Regular price': row['Regular price'],
#                         'Attribute 1 name': row['Attribute 1 name'],
#                         'Attribute 1 value(s)': row['Attribute 1 value(s)'],
#                         'Attribute 1 visible': row['Attribute 1 visible'],
#                         'Attribute 1 global': row['Attribute 1 global'],
#                         'Attribute 2 name': row['Attribute 2 name'],
#                         'Attribute 2 value(s)': row['Attribute 2 value(s)'],
#                         'Attribute 2 visible': row['Attribute 2 visible'],
#                         'Attribute 2 global': row['Attribute 2 global'],
#                     }
#                 ]
#             }
#         non_child_with_price.append(temp_dict_direct_prod)
#         continue

# final_data = []
# child_count = 0
# remaining_rows = 0

# for ind_dede,i in enumerate(unique_products):
#     try:
#         temp_dict = i.copy()
#         temp_dict['Products_varaitons'] = []
        
#         # keep rows for this product family
#         filtered_df = df[df['Name'].str.strip().str.startswith(i['Name'], na=False)]
#         # keep only child/variation rows
#         child_rows = filtered_df[filtered_df['Name'].str.contains(pattern, case=False, na=False)]

#         remaining_rows += len(filtered_df) - len(child_rows)
#         for indd,child_data in child_rows.iterrows():
#             child_count += 1
#             child_dict = {}
#             child_dict['Index_row'] = indd
#             child_dict['In stock?'] = child_data['In stock?']            
#             child_dict['Regular price'] = child_data['Regular price']
#             child_dict['Attribute 1 name'] = child_data['Attribute 1 name']
#             child_dict['Attribute 1 value(s)'] = child_data['Attribute 1 value(s)']
#             child_dict['Attribute 1 visible'] = child_data['Attribute 1 visible']
#             child_dict['Attribute 1 global'] = child_data['Attribute 1 global']
#             child_dict['Attribute 2 name'] = child_data['Attribute 2 name']
#             child_dict['Attribute 2 value(s)'] = child_data['Attribute 2 value(s)']
#             child_dict['Attribute 2 visible'] = child_data['Attribute 2 visible']
#             child_dict['Attribute 2 global'] = child_data['Attribute 2 global']
#             temp_dict['Products_varaitons'].append(child_dict)
        
#         final_data.append(temp_dict)
    
#     except Exception as e:
#         print(f"Error processing product {i['Name']}: {e}")
#         print("Row data:", i)
#         continue

# print("unique_products", len(unique_products))
# print("empty_data", len(empty_data))
# print("non_child_with_price", len(non_child_with_price))
# print("child_count", child_count)
# print("remaining_rows", remaining_rows)


# # for frfr in final_data:
# #     variated_text = []
# #     for producr_var in frfr['Products_varaitons']:
# #         weight = ''
# #         price = producr_var['Regular price']
# #         in_stock = producr_var['In stock?']
# #         if producr_var['Attribute 1 name'] == 'Weight':
# #             weight = producr_var['Attribute 1 value(s)']
# #         elif producr_var['Attribute 2 name'] == 'Weight':
# #             weight = producr_var['Attribute 2 value(s)']
# #         final_text = f"{weight} - {price} - {in_stock}"
# #         variated_text.append(final_text)

# #     print(f"{frfr['Name']} - {" | ".join(variated_text)} & {len(frfr['Products_varaitons'])}")

# # print('_______________________________________________________________________')

# # for gege in non_child_with_price:
# #     variated_text = []
# #     for producr_var in gege['Products_varaitons']:
# #         weight = ''
# #         price = producr_var['Regular price']
# #         in_stock = producr_var['In stock?']
# #         if producr_var['Attribute 1 name'] == 'Weight':
# #             weight = producr_var['Attribute 1 value(s)']
# #         elif producr_var['Attribute 2 name'] == 'Weight':
# #             weight = producr_var['Attribute 2 value(s)']
# #         final_text = f"{weight} - {price} - {in_stock}"
# #         variated_text.append(final_text)

# #     print(f"{gege['Name']} - {" | ".join(variated_text)} & {len(gege['Products_varaitons'])}")


# full_finall = final_data + non_child_with_price

# with open("output.json", "w", encoding="utf-8") as f:
#     json.dump(full_finall, f, ensure_ascii=False, indent=4) 

# print("final_data", len(final_data))


with open("output.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for i in data:
    print(i['Index_row'])
pdb.set_trace()

