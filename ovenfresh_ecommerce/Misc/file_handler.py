import os
import shutil

def copy_and_rename_files(source_folder, destination_folder):
    # Ensure destination folder exists
    main_files = ['views.py', 'urls.py', 'models.py', 'serializers.py', 'admin.py']
    os.makedirs(destination_folder, exist_ok=True)

    # Walk through all subdirectories and files
    for root, _, files in os.walk(source_folder):
        if 'Misc' not in root:
            for file in files:
                if file in main_files:
                    source_file_path = os.path.join(root, file)

                    # If file is in the root source folder, keep name
                    if root == source_folder:
                        new_filename = file
                    else:
                        # Get immediate parent folder name
                        parent_folder = os.path.basename(root)
                        new_filename = f"{parent_folder}${file}"

                    destination_file_path = os.path.join(destination_folder, new_filename)

                    # Copy the file
                    shutil.copy2(source_file_path, destination_file_path)
                    print(f"Copied: {source_file_path} -> {destination_file_path}")

# Example usage
source = r"C:\Users\Divyam Shah\OneDrive\Desktop\Dynamic Labz\Clients\Clients\Oven fresh\OvenFresh\ovenfresh_ecommerce"
destination = r"C:\Users\Divyam Shah\OneDrive\Desktop\OvenFresh"
copy_and_rename_files(source, destination)
