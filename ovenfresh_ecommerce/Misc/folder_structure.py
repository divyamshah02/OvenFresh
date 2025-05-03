import os

def print_folder_structure(folder_path, indent=0):
    try:
        # List all items in the directory
        items = sorted(os.listdir(folder_path))
    except FileNotFoundError:
        print("❌ Folder not found:", folder_path)
        return
    except PermissionError:
        print("🚫 Permission denied:", folder_path)
        return

    for item in items:
        item_path = os.path.join(folder_path, item)
        if os.path.isdir(item_path):
            print('│   ' * indent + '📁 ' + item)
            print_folder_structure(item_path, indent + 1)
        else:
            print('│   ' * indent + '📄 ' + item)

# Example usage:
# Replace with the folder path you want to check
folder_to_check = r'C:\Users\Divyam Shah\Downloads\ovenfresh-bakery (4)'
print_folder_structure(folder_to_check)
