import pandas as pd
import re

# === Step 1: Load Excel ===
file_path = r"C:\Users\Divyam Shah\Downloads\product_list.xlsx"  # change as needed
df = pd.read_excel(file_path)

# Column names
product_name_col = df.columns[0]  # First col is product name
price_col = "Regular price"
stock_col = "Stock"
attr1_name_col = "Attribute 1 name"
attr1_value_col = "Attribute 1 value(s)"

# === Step 2: Identify parent rows ===
def is_parent_row(row):
    # Check if price & stock empty
    price_empty = pd.isna(row[price_col])
    stock_empty = pd.isna(row[stock_col])
    # Attribute name exists (like 'Weight') but value is empty
    has_attr = pd.notna(row[attr1_name_col])
    # attr_value_empty = pd.isna(row[attr1_value_col])
    return price_empty and stock_empty and has_attr

df['is_parent'] = df.apply(is_parent_row, axis=1)

# === Step 3: Assign parent name to children ===
df['Parent Product'] = None
current_parent = None
for i, row in df.iterrows():
    if row['is_parent']:
        current_parent = row[product_name_col]
        df.at[i, 'Parent Product'] = current_parent
    else:
        df.at[i, 'Parent Product'] = current_parent

# === Step 4: Count children per parent ===
child_counts = (
    df[~df['is_parent']]
    .groupby('Parent Product')
    .size()
    .reset_index(name='Child Count')
)

# === Step 5: Extract only parent rows with all meta fields ===
parent_df = df[df['is_parent']].merge(child_counts, on='Parent Product', how='left')
parent_df['Child Count'] = parent_df['Child Count'].fillna(0).astype(int)

# === Step 6: Save parent list ===
output_file = "parent_products_only.xlsx"
parent_df.to_excel(output_file, index=False)

print(f"✅ Extracted {len(parent_df)} parent products with child counts → {output_file}")
