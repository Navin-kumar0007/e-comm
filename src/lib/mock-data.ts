export const mockCategories = [
  {
    "id": "dry-fruits-id",
    "name": "Dry Fruits & Superfoods",
    "slug": "dry-fruits",
    "description": "Premium, nutrient-rich nuts, seeds, and sun-dried fruits",
    "icon": "Wheat"
  },
  {
    "id": "masalas-id",
    "name": "Artisanal Masalas & Spices",
    "slug": "masalas",
    "description": "Authentic hand-roasted and pounded spices for rich flavors",
    "icon": "Flame"
  },
  {
    "id": "snacks-id",
    "name": "Heritage Healthy Snacks",
    "slug": "snacks",
    "description": "Healthy, traditional roasted snacks, khakhras, and chikkis",
    "icon": "Wheat"
  }
];

export const mockProducts = [
  {
    "id": "prod-mamra-almonds",
    "name": "Afghan Mamra Almonds (Super Premium)",
    "slug": "premium-afghan-almonds",
    "description": "Known for their concave shape and incredibly rich natural oil content (up to 50%), these Mamra almonds are an ancient Ayurvedic brain and heart tonic. 100% raw, unpasteurized, zero chemicals.",
    "aiDescription": "Crunchy, buttery, and packed with nutrients. The ultimate high-oil brain superfood.",
    "price": "1200.00",
    "salePrice": "1050.00",
    "images": [
      "/mamra-almonds.jpg"
    ],
    "categoryId": "dry-fruits-id",
    "stock": 80,
    "weight": "500g",
    "weightOptions": [
      {
        "weight": "250g",
        "price": 600
      },
      {
        "weight": "500g",
        "price": 1050
      },
      {
        "weight": "1kg",
        "price": 2000
      }
    ],
    "nutritionInfo": {
      "calories": 579,
      "protein": "21g",
      "fat": "49g",
      "carbs": "21g"
    },
    "tags": [
      "dry-fruits",
      "superfood",
      "mamra",
      "bestseller",
      "brain-health",
      "premium"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-jumbo-cashews",
    "name": "Goan Jumbo Whole Cashews (King Size W180)",
    "slug": "organic-whole-cashews",
    "description": "Large, creamy, and unroasted cashews sourced directly from organic coastal farms in Goa. Naturally sweet with a rich, buttery crunch. Perfect for snacking, desserts, or curries.",
    "aiDescription": "Rich and buttery whole King Size cashews, ethically sourced and packed with care.",
    "price": "850.00",
    "salePrice": "799.00",
    "images": [
      "/jumbo-cashews.jpg"
    ],
    "categoryId": "dry-fruits-id",
    "stock": 100,
    "weight": "500g",
    "weightOptions": [
      {
        "weight": "250g",
        "price": 420
      },
      {
        "weight": "500g",
        "price": 799
      },
      {
        "weight": "1kg",
        "price": 1550
      }
    ],
    "nutritionInfo": {
      "calories": 553,
      "protein": "18g",
      "fat": "44g",
      "carbs": "30g"
    },
    "tags": [
      "dry-fruits",
      "cashews",
      "jumbo",
      "organic",
      "bestseller"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-kashmiri-walnuts",
    "name": "Kashmiri Snow-White Walnut Kernels (Akhrot Giri)",
    "slug": "kashmiri-walnut-kernels",
    "description": "Freshly harvested from paper-shell walnuts grown in the high valleys of Kashmir. Crisp, light-colored kernels loaded with plant-based Omega-3 ALA, Vitamin E, and antioxidants.",
    "aiDescription": "Valley-fresh Kashmiri walnut halves. Brain food rich in natural Omega-3.",
    "price": "799.00",
    "salePrice": "720.00",
    "images": [
      "/kashmiri-walnuts.jpg"
    ],
    "categoryId": "dry-fruits-id",
    "stock": 65,
    "weight": "400g",
    "weightOptions": [
      {
        "weight": "200g",
        "price": 380
      },
      {
        "weight": "400g",
        "price": 720
      },
      {
        "weight": "800g",
        "price": 1390
      }
    ],
    "nutritionInfo": {
      "calories": 654,
      "protein": "15g",
      "fat": "65g",
      "carbs": "14g"
    },
    "tags": [
      "dry-fruits",
      "walnuts",
      "omega3",
      "kashmir",
      "brain-food"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-medjool-dates",
    "name": "Royal Jumbo Medjool Dates",
    "slug": "royal-medjool-dates",
    "description": "Hand-harvested jumbo Medjool dates known as the King of Dates. Soft, succulent, and bursting with natural caramel sweetness. Natural energy booster with zero added sugar.",
    "aiDescription": "Soft, luscious, caramel-sweet natural energy dates. 100% unprocessed.",
    "price": "650.00",
    "salePrice": "590.00",
    "images": [
      "https://images.unsplash.com/photo-1595855759920-86582396756a?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "dry-fruits-id",
    "stock": 90,
    "weight": "500g",
    "weightOptions": [
      {
        "weight": "500g",
        "price": 590
      },
      {
        "weight": "1kg",
        "price": 1100
      }
    ],
    "nutritionInfo": {
      "calories": 277,
      "protein": "2g",
      "fat": "0.2g",
      "carbs": "75g"
    },
    "tags": [
      "dry-fruits",
      "dates",
      "natural-sweetener",
      "energy",
      "premium"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-superfood-trail-mix",
    "name": "Artisanal 7-Seed & Dry Fruit Power Trail Mix",
    "slug": "superfood-dryfruit-trail-mix",
    "description": "A nutrient-packed master blend of Mamra almonds, whole cashews, dried cranberries, pumpkin seeds, chia seeds, watermelon seeds, and sunflower seeds dusted with Himalayan pink salt.",
    "aiDescription": "Daily powerhouse snack. 7 whole superfoods in one energizing jar.",
    "price": "499.00",
    "salePrice": "449.00",
    "images": [
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "dry-fruits-id",
    "stock": 120,
    "weight": "350g",
    "weightOptions": [
      {
        "weight": "350g",
        "price": 449
      },
      {
        "weight": "700g",
        "price": 850
      }
    ],
    "nutritionInfo": {
      "calories": 520,
      "protein": "19g",
      "fat": "38g",
      "carbs": "26g"
    },
    "tags": [
      "dry-fruits",
      "trail-mix",
      "seeds",
      "energy",
      "snack",
      "bestseller"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-tandoori-chai",
    "name": "Tandoori Chai Masala",
    "slug": "tandoori-chai-masala",
    "description": "Bina masale ki chai fiki hai! A slow-roasted royal recipe of 9 whole spices including green cardamom, cinnamon, cloves, black pepper, and star anise for authentic smoky kulhad aroma.",
    "aiDescription": "Elevate your daily tea into a rich, aromatic royal treat with our slow-roasted Tandoori Chai Masala.",
    "price": "250.00",
    "salePrice": "220.00",
    "images": [
      "/jar3.jpg"
    ],
    "categoryId": "masalas-id",
    "stock": 120,
    "weight": "50g",
    "weightOptions": [
      {
        "weight": "50g",
        "price": 220
      },
      {
        "weight": "100g",
        "price": 400
      }
    ],
    "nutritionInfo": {
      "calories": 280,
      "protein": "8g",
      "fat": "5g",
      "carbs": "50g"
    },
    "tags": [
      "masala",
      "chai",
      "aromatic",
      "handcrafted",
      "bestseller"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-lakadong-turmeric",
    "name": "Lakadong Turmeric Powder (8-12% Curcumin)",
    "slug": "lakadong-turmeric-powder",
    "description": "Sourced from the pristine hills of Meghalaya, this turmeric boasts a high curcumin content (8-12%), offering potent anti-inflammatory properties and a vibrant golden hue.",
    "aiDescription": "Elevate your curries and daily immunity with our premium high-curcumin Lakadong Turmeric.",
    "price": "299.00",
    "salePrice": "249.00",
    "images": [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "masalas-id",
    "stock": 150,
    "weight": "200g",
    "weightOptions": [
      {
        "weight": "200g",
        "price": 249
      },
      {
        "weight": "500g",
        "price": 599
      }
    ],
    "nutritionInfo": {
      "calories": 350,
      "protein": "10g",
      "fat": "10g",
      "carbs": "65g"
    },
    "tags": [
      "masala",
      "turmeric",
      "curcumin",
      "immunity",
      "organic",
      "bestseller"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-garam-masala",
    "name": "Traditional Garam Masala",
    "slug": "traditional-garam-masala",
    "description": "A deeply aromatic blend of 12 roasted spices, ground in small batches in iron pans. It adds a magical depth to any Indian dish.",
    "aiDescription": "The secret ingredient to restaurant-quality curries at home. Rich, warming, and perfectly balanced.",
    "price": "350.00",
    "salePrice": null,
    "images": [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "masalas-id",
    "stock": 200,
    "weight": "100g",
    "weightOptions": [
      {
        "weight": "100g",
        "price": 350
      },
      {
        "weight": "250g",
        "price": 800
      }
    ],
    "nutritionInfo": null,
    "tags": [
      "masala",
      "curry",
      "handcrafted",
      "staple"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-roasted-makhana",
    "name": "Roasted Foxnuts (Makhana) - Peri Peri",
    "slug": "roasted-makhana-peri-peri",
    "description": "Slow-roasted lotus seeds tossed in artisanal spicy peri-peri seasoning and extra virgin olive oil. Zero cholesterol, guilt-free snacking.",
    "aiDescription": "Crunchy, spicy, and roasted to perfection. High-protein healthy snack.",
    "price": "199.00",
    "salePrice": "179.00",
    "images": [
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "snacks-id",
    "stock": 90,
    "weight": "100g",
    "weightOptions": [
      {
        "weight": "100g",
        "price": 179
      },
      {
        "weight": "250g",
        "price": 399
      }
    ],
    "nutritionInfo": {
      "calories": 380,
      "protein": "10g",
      "fat": "5g",
      "carbs": "74g"
    },
    "tags": [
      "snacks",
      "makhana",
      "healthy",
      "gluten-free",
      "bestseller"
    ],
    "sustainabilityScore": 5,
    "isFeatured": true,
    "isOrganic": true,
    "status": "ACTIVE"
  },
  {
    "id": "prod-jaggery-chikki",
    "name": "Organic Jaggery & Peanut Chikki",
    "slug": "organic-jaggery-peanut-chikki",
    "description": "Traditional brittle made with cold-pressed jaggery and freshly roasted peanuts. A wholesome sweet treat packed with iron and protein.",
    "aiDescription": "Traditional handmade peanut brittle with organic jaggery.",
    "price": "160.00",
    "salePrice": "140.00",
    "images": [
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?q=80&w=800&auto=format&fit=crop"
    ],
    "categoryId": "snacks-id",
    "stock": 120,
    "weight": "250g",
    "weightOptions": null,
    "nutritionInfo": null,
    "tags": [
      "snacks",
      "chikki",
      "jaggery",
      "traditional"
    ],
    "sustainabilityScore": 5,
    "isFeatured": false,
    "isOrganic": true,
    "status": "ACTIVE"
  }
];
