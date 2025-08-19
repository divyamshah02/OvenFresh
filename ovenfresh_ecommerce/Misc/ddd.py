import requests
import os

# list of image URLs
urls = [
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/MOTILAL-1.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/kotak_mahindra_new.png.webp?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Ajanta-Pharma-Limited-Logo-removebg-preview.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/icici-bank.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/motilal.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/LODHA.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/PIVOROOTS.jpg?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Rynox-Logo_2-removebg-preview.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/MOTILAL-1.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/kotak_mahindra_new.png.webp?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Ajanta-Pharma-Limited-Logo-removebg-preview.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/icici-bank.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/motilal.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/LODHA.png?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/PIVOROOTS.jpg?w=1200&amp;ssl=1", 
    "https://i0.wp.com/ovenfresh.in/wp-content/uploads/2025/01/Rynox-Logo_2-removebg-preview.png?w=1200&amp;ssl=1", 
]

# folder to save images
save_dir = "downloaded_images"
os.makedirs(save_dir, exist_ok=True)

for i, url in enumerate(urls, start=1):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # extract filename from URL (ignore query params like ?w=1200&ssl=1)
        filename = url.split("/")[-1].split("?")[0]

        filepath = os.path.join(save_dir, filename)

        with open(filepath, "wb") as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)

        print(f"✅ Downloaded {filename}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error downloading {url}: {e}")
