export const recipeDb = [
  {
    id: "bf-oatmeal",
    name: "Golden Turmeric Berry Oatmeal",
    mealType: "breakfast",
    prepTime: 5,
    cookTime: 10,
    calories: 320,
    baseCost: 2.20,
    tags: ["vegetarian", "vegan", "budget", "quick"],
    ingredients: [
      { name: "Rolled Oats", amount: 0.5, unit: "cup", category: "Pantry", basePrice: 0.30 },
      { name: "Almond Milk", amount: 1, unit: "cup", category: "Dairy/Alternatives", basePrice: 0.60 },
      { name: "Turmeric Powder", amount: 0.25, unit: "tsp", category: "Pantry", basePrice: 0.10 },
      { name: "Maple Syrup", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.40 },
      { name: "Mixed Berries", amount: 0.25, unit: "cup", category: "Produce", basePrice: 0.80 }
    ],
    instructions: [
      "Combine rolled oats, almond milk, and turmeric powder in a small saucepan.",
      "Bring to a simmer over medium heat, stirring occasionally for about 8-10 minutes until thick and creamy.",
      "Remove from heat and stir in the maple syrup.",
      "Transfer to a bowl and top with fresh mixed berries."
    ]
  },
  {
    id: "bf-scramble",
    name: "Avocado & Spinach Tofu Scramble",
    mealType: "breakfast",
    prepTime: 5,
    cookTime: 10,
    calories: 280,
    baseCost: 3.50,
    tags: ["vegetarian", "vegan", "keto", "gluten-free", "quick"],
    ingredients: [
      { name: "Firm Tofu", amount: 150, unit: "g", category: "Protein", basePrice: 1.20 },
      { name: "Spinach", amount: 1, unit: "cup", category: "Produce", basePrice: 0.50 },
      { name: "Avocado", amount: 0.5, unit: "whole", category: "Produce", basePrice: 1.00 },
      { name: "Olive Oil", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.30 },
      { name: "Nutritional Yeast", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.50 }
    ],
    instructions: [
      "Drain tofu and crumble it with your hands or a fork.",
      "Heat olive oil in a pan over medium heat, add crumbled tofu and spinach.",
      "Sauté for 5 minutes until spinach is wilted and tofu is heated through.",
      "Stir in nutritional yeast, salt, and pepper for cheesy flavor.",
      "Serve warm topped with sliced fresh avocado."
    ]
  },
  {
    id: "bf-eggs",
    name: "Classic Avocado & Herb Egg Toast",
    mealType: "breakfast",
    prepTime: 5,
    cookTime: 5,
    calories: 350,
    baseCost: 2.80,
    tags: ["vegetarian", "budget", "quick"],
    ingredients: [
      { name: "Whole Wheat Bread", amount: 2, unit: "slices", category: "Pantry", basePrice: 0.50, allergen: "gluten" },
      { name: "Eggs", amount: 2, unit: "whole", category: "Protein", basePrice: 0.60, allergen: "eggs" },
      { name: "Avocado", amount: 0.5, unit: "whole", category: "Produce", basePrice: 1.00 },
      { name: "Olive Oil", amount: 1, unit: "tsp", category: "Pantry", basePrice: 0.20 },
      { name: "Chives", amount: 1, unit: "tsp", category: "Produce", basePrice: 0.50 }
    ],
    instructions: [
      "Toast the whole wheat bread slices until golden brown.",
      "Mash the avocado in a small bowl with a pinch of salt and lemon juice, then spread on the toast.",
      "Heat olive oil in a pan, fry the eggs to your preference (sunny-side up recommended).",
      "Place fried eggs on top of the avocado spread.",
      "Garnish with chopped fresh chives."
    ]
  },
  {
    id: "bf-chia",
    name: "Coconut Chia Seed Pudding",
    mealType: "breakfast",
    prepTime: 5,
    cookTime: 0,
    calories: 240,
    baseCost: 3.00,
    tags: ["vegetarian", "vegan", "keto", "gluten-free", "quick"],
    ingredients: [
      { name: "Chia Seeds", amount: 3, unit: "tbsp", category: "Pantry", basePrice: 0.80 },
      { name: "Coconut Milk", amount: 1, unit: "cup", category: "Dairy/Alternatives", basePrice: 1.20 },
      { name: "Vanilla Extract", amount: 0.5, unit: "tsp", category: "Pantry", basePrice: 0.30 },
      { name: "Stevia / Erythritol", amount: 1, unit: "tsp", category: "Pantry", basePrice: 0.20 },
      { name: "Almonds", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.50, allergen: "nuts" }
    ],
    instructions: [
      "In a bowl or jar, whisk together chia seeds, coconut milk, vanilla extract, and sweetener.",
      "Let sit for 5 minutes, stir again to prevent clumping, then chill in the fridge for at least 15 minutes (or overnight).",
      "Before serving, stir once more and garnish with chopped almonds."
    ]
  },
  {
    id: "lh-chickpea",
    name: "Mediterranean Chickpea Salad",
    mealType: "lunch",
    prepTime: 10,
    cookTime: 0,
    calories: 410,
    baseCost: 3.10,
    tags: ["vegetarian", "vegan", "gluten-free", "budget", "quick"],
    ingredients: [
      { name: "Canned Chickpeas", amount: 1, unit: "can", category: "Pantry", basePrice: 0.90 },
      { name: "Cucumber", amount: 0.5, unit: "whole", category: "Produce", basePrice: 0.40 },
      { name: "Cherry Tomatoes", amount: 0.5, unit: "cup", category: "Produce", basePrice: 0.80 },
      { name: "Red Onion", amount: 0.25, unit: "whole", category: "Produce", basePrice: 0.20 },
      { name: "Olive Oil & Lemon", amount: 2, unit: "tbsp", category: "Pantry", basePrice: 0.80 }
    ],
    instructions: [
      "Rinse and drain the canned chickpeas.",
      "Dice cucumber, red onion, and halve the cherry tomatoes.",
      "Toss the chickpeas and vegetables in a salad bowl.",
      "Drizzle with olive oil and lemon juice, and season with salt, pepper, and dried oregano."
    ]
  },
  {
    id: "lh-wrap",
    name: "High-Protein Turkey Lettuce Wraps",
    mealType: "lunch",
    prepTime: 10,
    cookTime: 8,
    calories: 350,
    baseCost: 4.50,
    tags: ["keto", "gluten-free", "quick"],
    ingredients: [
      { name: "Ground Turkey", amount: 150, unit: "g", category: "Protein", basePrice: 2.50 },
      { name: "Romaine Lettuce Hearts", amount: 3, unit: "leaves", category: "Produce", basePrice: 0.60 },
      { name: "Bell Pepper", amount: 0.5, unit: "whole", category: "Produce", basePrice: 0.60 },
      { name: "Soy Sauce (Gluten-Free)", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.30 },
      { name: "Sesame Oil", amount: 1, unit: "tsp", category: "Pantry", basePrice: 0.50 }
    ],
    instructions: [
      "Heat sesame oil in a skillet over medium heat.",
      "Add ground turkey and diced bell pepper, and cook until browned, about 6-8 minutes.",
      "Stir in gluten-free soy sauce and cook for another 2 minutes.",
      "Spoon the turkey mixture into clean, crisp romaine lettuce leaves and serve."
    ]
  },
  {
    id: "lh-soup",
    name: "Creamy Tomato Basil Soup",
    mealType: "lunch",
    prepTime: 5,
    cookTime: 15,
    calories: 220,
    baseCost: 2.50,
    tags: ["vegetarian", "gluten-free", "budget"],
    ingredients: [
      { name: "Canned Crushed Tomatoes", amount: 1, unit: "can", category: "Pantry", basePrice: 1.00 },
      { name: "Heavy Cream", amount: 0.25, unit: "cup", category: "Dairy/Alternatives", basePrice: 0.60, allergen: "dairy" },
      { name: "Vegetable Broth", amount: 1, unit: "cup", category: "Pantry", basePrice: 0.40 },
      { name: "Garlic", amount: 2, unit: "cloves", category: "Produce", basePrice: 0.20 },
      { name: "Fresh Basil", amount: 5, unit: "leaves", category: "Produce", basePrice: 0.30 }
    ],
    instructions: [
      "Sauté minced garlic in a pot with a drizzle of oil for 1 minute.",
      "Add crushed tomatoes and vegetable broth, bring to a boil, then simmer for 10 minutes.",
      "Remove from heat, add fresh basil, and blend using an immersion blender until smooth.",
      "Stir in heavy cream and season with salt and black pepper to taste."
    ]
  },
  {
    id: "lh-quinoa",
    name: "Power Quinoa Harvest Bowl",
    mealType: "lunch",
    prepTime: 10,
    cookTime: 15,
    calories: 450,
    baseCost: 3.80,
    tags: ["vegetarian", "vegan", "gluten-free"],
    ingredients: [
      { name: "Quinoa", amount: 0.5, unit: "cup", category: "Pantry", basePrice: 0.80 },
      { name: "Sweet Potato", amount: 0.5, unit: "whole", category: "Produce", basePrice: 0.50 },
      { name: "Kale", amount: 1, unit: "cup", category: "Produce", basePrice: 0.70 },
      { name: "Tahini", amount: 1.5, unit: "tbsp", category: "Pantry", basePrice: 1.00 },
      { name: "Pumpkin Seeds", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.80 }
    ],
    instructions: [
      "Rinse quinoa and cook in water/broth (1:2 ratio) for 15 minutes.",
      "Cube sweet potato, toss in oil and roast at 400°F (200°C) for 15 minutes (or steam/microwave for quick prep).",
      "Massage kale with a touch of olive oil and salt.",
      "Assemble bowl with quinoa, roasted sweet potatoes, and kale.",
      "Drizzle with tahini diluted with warm water and lemon juice, and scatter pumpkin seeds on top."
    ]
  },
  {
    id: "dn-salmon",
    name: "Pan-Seared Lemon Salmon",
    mealType: "dinner",
    prepTime: 5,
    cookTime: 12,
    calories: 490,
    baseCost: 9.50,
    tags: ["keto", "gluten-free"],
    ingredients: [
      { name: "Salmon Fillet", amount: 180, unit: "g", category: "Protein", basePrice: 7.00, allergen: "fish" },
      { name: "Asparagus", amount: 100, unit: "g", category: "Produce", basePrice: 1.50 },
      { name: "Butter", amount: 1.5, unit: "tbsp", category: "Dairy/Alternatives", basePrice: 0.50, allergen: "dairy" },
      { name: "Lemon", amount: 0.5, unit: "whole", category: "Produce", basePrice: 0.30 },
      { name: "Garlic", amount: 2, unit: "cloves", category: "Produce", basePrice: 0.20 }
    ],
    instructions: [
      "Pat salmon dry and season with salt and pepper on both sides.",
      "Melt butter in a skillet over medium-high heat, add minced garlic.",
      "Place salmon skin-side down and sear for 4-5 minutes until crispy.",
      "Flip salmon, toss in trimmed asparagus, squeeze lemon juice over everything, and cook another 3-4 minutes.",
      "Garnish salmon with lemon slices and serve hot with the tender asparagus."
    ]
  },
  {
    id: "dn-lentil",
    name: "Hearty Coconut Lentil Curry",
    mealType: "dinner",
    prepTime: 10,
    cookTime: 20,
    calories: 480,
    baseCost: 3.00,
    tags: ["vegetarian", "vegan", "gluten-free", "budget"],
    ingredients: [
      { name: "Red Lentils", amount: 0.75, unit: "cup", category: "Pantry", basePrice: 0.60 },
      { name: "Coconut Milk", amount: 0.5, unit: "can", category: "Dairy/Alternatives", basePrice: 0.80 },
      { name: "Spinach", amount: 1, unit: "cup", category: "Produce", basePrice: 0.50 },
      { name: "Curry Powder", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.30 },
      { name: "Canned Diced Tomatoes", amount: 0.5, unit: "can", category: "Pantry", basePrice: 0.50 },
      { name: "Garlic & Ginger", amount: 1, unit: "tbsp", category: "Produce", basePrice: 0.30 }
    ],
    instructions: [
      "Sauté minced garlic, ginger, and curry powder in a deep pot with oil for 1-2 minutes.",
      "Stir in red lentils, diced tomatoes, coconut milk, and 1.5 cups of water.",
      "Bring to a boil, then simmer on low heat for 18-20 minutes, stirring occasionally, until lentils are soft.",
      "Fold in fresh spinach leaves during the last 2 minutes until wilted. Season with salt and lime juice."
    ]
  },
  {
    id: "dn-pasta",
    name: "Garlic & Herb Chicken Pasta",
    mealType: "dinner",
    prepTime: 10,
    cookTime: 15,
    calories: 620,
    baseCost: 4.80,
    tags: ["budget"],
    ingredients: [
      { name: "Chicken Breast", amount: 150, unit: "g", category: "Protein", basePrice: 2.20 },
      { name: "Penne Pasta", amount: 80, unit: "g", category: "Pantry", basePrice: 0.40, allergen: "gluten" },
      { name: "Olive Oil", amount: 1.5, unit: "tbsp", category: "Pantry", basePrice: 0.50 },
      { name: "Parmesan Cheese", amount: 2, unit: "tbsp", category: "Dairy/Alternatives", basePrice: 0.80, allergen: "dairy" },
      { name: "Cherry Tomatoes", amount: 0.5, unit: "cup", category: "Produce", basePrice: 0.70 },
      { name: "Italian Seasoning", amount: 1, unit: "tsp", category: "Pantry", basePrice: 0.20 }
    ],
    instructions: [
      "Cook penne pasta in boiling salted water according to package directions, then drain.",
      "Cut chicken breast into bite-sized pieces and cook in a skillet with olive oil until browned and cooked through (6-8 minutes).",
      "Add halved cherry tomatoes and Italian seasoning to the skillet, cook for 2 minutes until tomatoes start to burst.",
      "Toss the pasta and chicken together, drizzle with remaining olive oil.",
      "Serve hot sprinkled with grated parmesan cheese."
    ]
  },
  {
    id: "dn-stirfry",
    name: "Spicy Sesame Beef Stir-Fry",
    mealType: "dinner",
    prepTime: 10,
    cookTime: 10,
    calories: 510,
    baseCost: 6.80,
    tags: ["keto", "gluten-free"],
    ingredients: [
      { name: "Beef Sirloin Strips", amount: 150, unit: "g", category: "Protein", basePrice: 4.50 },
      { name: "Broccoli Florets", amount: 1, unit: "cup", category: "Produce", basePrice: 0.80 },
      { name: "Sesame Oil", amount: 1, unit: "tbsp", category: "Pantry", basePrice: 0.50 },
      { name: "Tamari Soy Sauce", amount: 1.5, unit: "tbsp", category: "Pantry", basePrice: 0.40 },
      { name: "Garlic & Chili Flakes", amount: 1, unit: "tsp", category: "Produce", basePrice: 0.30 },
      { name: "Sesame Seeds", amount: 0.5, unit: "tsp", category: "Pantry", basePrice: 0.30 }
    ],
    instructions: [
      "Heat sesame oil in a wok or large skillet over high heat.",
      "Add sirloin strips, garlic, and red chili flakes; stir-fry for 3-4 minutes until beef is browned.",
      "Toss in broccoli florets and cook for 3 minutes until tender-crisp.",
      "Pour in tamari soy sauce, coating beef and broccoli. Cook for 1 more minute.",
      "Transfer to a plate and sprinkle with toasted sesame seeds."
    ]
  }
];

export const substitutionDb = {
  "Almond Milk": [
    { name: "Oat Milk", reason: "Nut allergy / creamier taste", priceOffset: 0.20 },
    { name: "Dairy Milk", reason: "Standard option (contains dairy)", priceOffset: -0.10 }
  ],
  "Firm Tofu": [
    { name: "Eggs", reason: "Non-vegan option (high protein)", priceOffset: -0.60 },
    { name: "Tempeh", reason: "Firmer texture, fermented", priceOffset: 0.50 }
  ],
  "Eggs": [
    { name: "Tofu Scramble", reason: "Vegan / Egg allergy", priceOffset: 0.60 },
    { name: "Flax Meal (Baking)", reason: "Vegan binding agent", priceOffset: -0.20 }
  ],
  "Whole Wheat Bread": [
    { name: "Gluten-Free Bread", reason: "Gluten intolerance", priceOffset: 0.80 },
    { name: "Sweet Potato Slices (Toasted)", reason: "Grain-free / Paleo", priceOffset: 0.00 }
  ],
  "Canned Chickpeas": [
    { name: "Canned Black Beans", reason: "Variety", priceOffset: 0.00 },
    { name: "Cooked Chicken Breast", reason: "Non-vegan / higher protein", priceOffset: 1.50 }
  ],
  "Ground Turkey": [
    { name: "Ground Beef", reason: "Rich flavor", priceOffset: 0.40 },
    { name: "Lentils & Mushrooms", reason: "Vegetarian / Vegan alternative", priceOffset: -1.20 }
  ],
  "Heavy Cream": [
    { name: "Coconut Cream", reason: "Dairy-free / Vegan", priceOffset: 0.40 },
    { name: "Greek Yogurt", reason: "Lower calorie / high protein (contains dairy)", priceOffset: 0.10 }
  ],
  "Quinoa": [
    { name: "Brown Rice", reason: "Budget option", priceOffset: -0.40 },
    { name: "Cauliflower Rice", reason: "Low carb / Keto", priceOffset: 0.50 }
  ],
  "Salmon Fillet": [
    { name: "Canned Salmon", reason: "Budget alternative", priceOffset: -4.00 },
    { name: "Firm Tofu", reason: "Vegan / budget option", priceOffset: -5.80 },
    { name: "Chicken Breast", reason: "Less expensive protein", priceOffset: -4.80 }
  ],
  "Butter": [
    { name: "Olive Oil", reason: "Vegan / Dairy-free", priceOffset: 0.10 },
    { name: "Coconut Oil", reason: "Dairy-free (mild coconut flavor)", priceOffset: 0.20 }
  ],
  "Penne Pasta": [
    { name: "Gluten-Free Pasta", reason: "Gluten-free diet", priceOffset: 0.60 },
    { name: "Zucchini Noodles (Zoodles)", reason: "Low-carb / Keto", priceOffset: 0.80 }
  ],
  "Beef Sirloin Strips": [
    { name: "Chicken Strips", reason: "Budget / Leaner option", priceOffset: -2.30 },
    { name: "Portobello Mushrooms", reason: "Vegetarian / Vegan meaty option", priceOffset: -2.00 }
  ]
};
