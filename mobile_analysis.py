import os

base_dir = "/Users/navin/.gemini/antigravity-ide/brain/30c24cbc-5d08-4f48-af49-9f95845eba9c/madhuris-kitchen"

def check_file(rel_path):
    path = os.path.join(base_dir, rel_path)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
            print(f"--- {rel_path} ---")
            # print first 1500 chars to get a sense of structure
            print(content[:1500])
            print("...\n")

check_file("src/app/page.tsx")
check_file("src/components/storefront/mobile-bottom-nav.tsx")
check_file("src/components/storefront/product-card.tsx")
