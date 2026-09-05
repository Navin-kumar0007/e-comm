export type Recipe = {
  slug: string;
  title: string;
  description: string;
  image: string;
  category: "Breakfast" | "Main Course" | "Snacks" | "Desserts" | "Beverages";
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: { name: string; amount: string; isProduct?: boolean; productSlug?: string }[];
  steps: string[];
  tags: string[];
};

export const recipes: Recipe[] = [
  {
    slug: "tandoori-kulhad-chai",
    title: "Authentic Tandoori Kulhad Chai",
    description: "Brew a rich, aromatic royal cup with our 9-spice slow-roasted Tandoori Chai Masala and fresh milk.",
    image: "/jar3.jpg",
    category: "Beverages",
    prepTime: "2 min",
    cookTime: "8 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      { name: "Tandoori Chai Masala", amount: "1/2 tsp", isProduct: true, productSlug: "tandoori-chai-masala" },
      { name: "Assam CTC Tea Leaves", amount: "2 tsp" },
      { name: "Full Fat Milk", amount: "1 cup" },
      { name: "Water", amount: "1 cup" },
      { name: "Crushed Jaggery or Sugar", amount: "2 tsp" },
    ],
    steps: [
      "Bring water to a rolling boil in a tea saucepan.",
      "Add black tea leaves and 1/2 teaspoon of Tandoori Chai Masala. Simmer for 2 minutes to extract the aromatic essential oils.",
      "Pour in fresh milk and bring to a frothy boil over medium-low heat.",
      "Add jaggery or sugar, strain into clay kulhad cups, and serve piping hot."
    ],
    tags: ["chai", "heritage", "quick", "bestseller"],
  },
  {
    slug: "golden-turmeric-latte",
    title: "Golden Lakadong Turmeric Latte",
    description: "A soothing, high-curcumin anti-inflammatory drink made with our pristine Meghalaya Lakadong Turmeric.",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop",
    category: "Beverages",
    prepTime: "2 min",
    cookTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      { name: "Lakadong Turmeric Powder (8-12% Curcumin)", amount: "1 tsp", isProduct: true, productSlug: "lakadong-turmeric-powder" },
      { name: "Milk (or almond milk)", amount: "1 cup" },
      { name: "Black Pepper", amount: "a pinch" },
      { name: "Raw Honey or Jaggery", amount: "1 tsp" },
    ],
    steps: [
      "Warm the milk in a saucepan over medium heat.",
      "Add 1 teaspoon of Lakadong Turmeric Powder and stir well.",
      "Add a pinch of fresh black pepper to maximize curcumin absorption.",
      "Sweeten with honey to taste and serve warm."
    ],
    tags: ["immunity", "wellness", "quick"],
  },
  {
    slug: "rich-almond-saffron-kheer",
    title: "Royal Mamra Almond & Saffron Kheer",
    description: "A luxurious dessert using our high-oil Afghan Mamra Almonds and whole roasted spices for warmth and depth.",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800&auto=format&fit=crop",
    category: "Desserts",
    prepTime: "15 min",
    cookTime: "40 min",
    servings: 4,
    difficulty: "Medium",
    ingredients: [
      { name: "Afghan Mamra Almonds", amount: "1/4 cup (sliced)", isProduct: true, productSlug: "premium-afghan-almonds" },
      { name: "Goan Jumbo Cashews", amount: "2 tbsp (chopped)", isProduct: true, productSlug: "organic-whole-cashews" },
      { name: "Basmati Rice", amount: "1/4 cup" },
      { name: "Full Cream Milk", amount: "1 litre" },
      { name: "Cardamom & Saffron", amount: "a few strands" },
      { name: "Sugar", amount: "1/2 cup" }
    ],
    steps: [
      "Wash and soak basmati rice for 30 minutes, then drain.",
      "Boil milk in a heavy-bottomed pan, add rice, and slow cook until thick and creamy (about 30 minutes).",
      "Add sugar, sliced Mamra almonds, cashews, and saffron.",
      "Simmer for another 5 minutes until rich and aromatic.",
      "Serve warm or chilled."
    ],
    tags: ["sweet", "festive", "royal", "dessert"],
  }
];
