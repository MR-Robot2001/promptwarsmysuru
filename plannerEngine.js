import { recipeDb, substitutionDb } from './recipeDb.js';

/**
 * Normalizes and parses the day description to detect dietary restrictions and preferences.
 */
export function parseUserPreferences(dayDescription, uiRestrictions = []) {
  const text = (dayDescription || "").toLowerCase();
  const restrictions = new Set(uiRestrictions);

  // Check keywords in text
  if (text.includes("vegan")) {
    restrictions.add("vegan");
    restrictions.add("vegetarian");
  }
  if (text.includes("vegetarian") || text.includes("veggie") || text.includes("no meat")) {
    restrictions.add("vegetarian");
  }
  if (text.includes("gluten-free") || text.includes("no gluten") || text.includes("celiac")) {
    restrictions.add("gluten-free");
  }
  if (text.includes("keto") || text.includes("low carb") || text.includes("no carb")) {
    restrictions.add("keto");
  }

  // Detect time sensitivity
  const isBusy = text.includes("busy") || 
                 text.includes("hectic") || 
                 text.includes("hurry") || 
                 text.includes("tired") || 
                 text.includes("exhausted") || 
                 text.includes("quick") || 
                 text.includes("fast") || 
                 text.includes("short on time") || 
                 text.includes("no time") ||
                 text.includes("work");

  return {
    dietaryRestrictions: Array.from(restrictions),
    isBusy
  };
}

/**
 * Heuristically finds the best recipe matching criteria.
 */
export function findBestRecipe(mealType, preferences, budgetPerMeal, excludedIds = []) {
  // Filter by meal type
  let candidates = recipeDb.filter(r => r.mealType === mealType && !excludedIds.includes(r.id));
  
  if (candidates.length === 0) return null;

  // Filter by strict dietary restrictions
  if (preferences.dietaryRestrictions.length > 0) {
    candidates = candidates.filter(recipe => {
      // Must satisfy all selected restrictions
      return preferences.dietaryRestrictions.every(restriction => {
        // A recipe is compliant if it has the tag directly.
        // For 'vegetarian', a 'vegan' recipe is also compliant.
        if (restriction === 'vegetarian' && recipe.tags.includes('vegan')) {
          return true;
        }
        return recipe.tags.includes(restriction);
      });
    });
  }

  // If no recipes match strict dietary tags, fall back to any recipes of that meal type but try to flag later.
  if (candidates.length === 0) {
    candidates = recipeDb.filter(r => r.mealType === mealType && !excludedIds.includes(r.id));
  }

  // Scoring candidates
  const scored = candidates.map(recipe => {
    let score = 0;
    
    // Busy preference: favor recipes with quick tag or low cook+prep time
    const totalTime = recipe.prepTime + recipe.cookTime;
    if (preferences.isBusy) {
      if (recipe.tags.includes("quick")) score += 10;
      score += (30 - totalTime) * 0.2; // higher score for shorter time
    }

    // Budget preference: favor cheaper recipes if cost is below budgetPerMeal
    if (recipe.baseCost <= budgetPerMeal) {
      score += 5;
      score += (budgetPerMeal - recipe.baseCost) * 2;
    } else {
      score -= (recipe.baseCost - budgetPerMeal) * 5; // heavy penalty for exceeding budget
    }

    return { recipe, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored[0].recipe : null;
}

/**
 * Generates the local heuristic meal plan.
 */
export function generateHeuristicPlan(dayDescription, budgetLimit, uiRestrictions = [], mealsNeeded = ["breakfast", "lunch", "dinner"]) {
  const preferences = parseUserPreferences(dayDescription, uiRestrictions);
  const budgetPerMeal = budgetLimit / (mealsNeeded.length || 1);

  const selectedRecipes = [];
  const excludedIds = [];

  for (const mealType of mealsNeeded) {
    const recipe = findBestRecipe(mealType, preferences, budgetPerMeal, excludedIds);
    if (recipe) {
      selectedRecipes.push(recipe);
      excludedIds.push(recipe.id);
    }
  }

  // Calculate default groceries and total base cost
  const { groceryList, totalCost } = compileGroceryList(selectedRecipes);

  // Generate budget feasibility feedback
  const feasibility = calculateBudgetFeasibility(totalCost, budgetLimit);

  // Create explanation summary based on preferences
  let explanation = `I've created a custom cooking plan for you. `;
  if (preferences.isBusy) {
    explanation += `Since you have a busy or tiring day, I prioritized fast recipes with minimal prep and cook times. `;
  } else {
    explanation += `I selected balanced meals that you can take your time to cook and enjoy. `;
  }
  if (preferences.dietaryRestrictions.length > 0) {
    explanation += `All selected meals respect your dietary guidelines (${preferences.dietaryRestrictions.join(', ')}). `;
  }
  if (feasibility.status === 'over_budget') {
    explanation += `Note: The ingredients slightly exceed your target budget. Check out the suggestions below to save money!`;
  } else {
    explanation += `The total cost is well within your budget of $${budgetLimit.toFixed(2)}.`;
  }

  return {
    meals: selectedRecipes,
    groceryList,
    totalCost,
    budgetLimit,
    feasibility,
    explanation,
    dietaryRestrictionsApplied: preferences.dietaryRestrictions
  };
}

/**
 * Aggregates duplicate ingredients across meals to create a neat shopping list.
 */
export function compileGroceryList(recipes, activeSubstitutions = {}) {
  const items = {};

  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      let ingName = ing.name;
      let ingPrice = ing.basePrice;
      let note = "";

      // Apply substitution if active
      if (activeSubstitutions[recipe.id] && activeSubstitutions[recipe.id][ingName]) {
        const sub = activeSubstitutions[recipe.id][ingName];
        ingName = sub.name;
        ingPrice = ing.basePrice + sub.priceOffset;
        note = `Substituted for ${ing.name} (${sub.reason})`;
      }

      if (items[ingName]) {
        items[ingName].amount += ing.amount;
        items[ingName].price += ingPrice;
        if (note && !items[ingName].notes.includes(note)) {
          items[ingName].notes.push(note);
        }
      } else {
        items[ingName] = {
          name: ingName,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          price: ingPrice,
          checked: false,
          notes: note ? [note] : []
        };
      }
    });
  });

  const list = Object.values(items);
  const totalCost = list.reduce((sum, item) => sum + item.price, 0);

  return { groceryList: list, totalCost };
}

/**
 * Calculates budget health check and generates optimization ideas.
 */
export function calculateBudgetFeasibility(totalCost, budgetLimit) {
  const diff = budgetLimit - totalCost;
  let status = 'within';
  let message = 'All good! You are within your budget.';
  let cssClass = 'budget-ok';

  if (diff < 0) {
    status = 'over_budget';
    message = `You are over budget by $${Math.abs(diff).toFixed(2)}.`;
    cssClass = 'budget-danger';
  } else if (diff < budgetLimit * 0.15) {
    status = 'near_limit';
    message = `Close to the limit! You have only $${diff.toFixed(2)} left.`;
    cssClass = 'budget-warning';
  }

  // Get generic savings tips from database substitutions that lower prices
  const tips = [];
  recipeDb.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const subs = substitutionDb[ing.name];
      if (subs) {
        subs.forEach(sub => {
          if (sub.priceOffset < 0) {
            tips.push({
              recipeId: recipe.id,
              recipeName: recipe.name,
              original: ing.name,
              replacement: sub.name,
              savings: Math.abs(sub.priceOffset),
              reason: sub.reason
            });
          }
        });
      }
    });
  });

  // Sort tips by potential savings descending
  tips.sort((a, b) => b.savings - a.savings);

  // Keep unique tips
  const uniqueTips = [];
  const seen = new Set();
  for (const tip of tips) {
    const key = `${tip.original}->${tip.replacement}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTips.push(tip);
    }
    if (uniqueTips.length >= 3) break; // return top 3 tips
  }

  return {
    status,
    message,
    cssClass,
    totalCost,
    budgetLimit,
    remainingBudget: diff,
    savingsTips: uniqueTips
  };
}

/**
 * Sends a structured prompt to a local Ollama instance or Hugging Face Inference API.
 */
export async function generateAiPlan(config, dayDescription, budgetLimit, uiRestrictions = [], mealsNeeded = ["breakfast", "lunch", "dinner"]) {
  const preferences = parseUserPreferences(dayDescription, uiRestrictions);
  
  const systemPrompt = `You are a culinary planner AI. Generate a customized meal plan based on the user's day.
Available Recipes JSON:
${JSON.stringify(recipeDb, null, 2)}

User request details:
- Day Description: "${dayDescription}"
- Target Budget: $${budgetLimit}
- Dietary restrictions to respect: ${preferences.dietaryRestrictions.join(', ') || 'None'}
- Meals needed: ${mealsNeeded.join(', ')}

Respond ONLY with a valid JSON object matching this structure:
{
  "selectedRecipeIds": ["bf-oatmeal", "lh-chickpea", "dn-lentil"], // array of recipe IDs chosen
  "explanation": "Why this fits their day...", // Friendly explanation
  "substitutions": { // optional ingredient replacements applied to respect budget or diet
    "recipeId": {
      "Original Ingredient Name": {
        "name": "Substitute Ingredient Name",
        "reason": "Why substitute",
        "priceOffset": 0.50 // offset to base ingredient cost
      }
    }
  }
}
Do not write markdown formatting around the JSON response, only return the JSON raw code.`;

  if (config.provider === 'ollama') {
    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3',
        prompt: systemPrompt,
        stream: false,
        options: { temperature: 0.2 }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = await response.json();
    const cleanText = cleanJsonString(data.response);
    return parseAiJson(cleanText, budgetLimit);
  } 
  
  if (config.provider === 'huggingface') {
    const response = await fetch(`https://api-inference.huggingface.co/models/${config.model || 'meta-llama/Meta-Llama-3-8B-Instruct'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      body: JSON.stringify({
        inputs: systemPrompt,
        parameters: { max_new_tokens: 800, return_full_text: false, temperature: 0.1 }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = Array.isArray(data) ? data[0].generated_text : data.generated_text;
    const cleanText = cleanJsonString(rawText);
    return parseAiJson(cleanText, budgetLimit);
  }

  if (config.provider === 'openrouter') {
    const token = config.token || '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';
    const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: config.model || 'nvidia/nemotron-3-ultra-550b-a55b:free',
        messages: [{ role: 'user', content: systemPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;
    const cleanText = cleanJsonString(rawText);
    return parseAiJson(cleanText, budgetLimit);
  }

  throw new Error("Invalid AI provider configured.");
}

function cleanJsonString(text) {
  // Helper to remove any ```json ... ``` markdown if present
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }
  return clean.trim();
}

function parseAiJson(jsonText, budgetLimit) {
  try {
    const parsed = JSON.parse(jsonText);
    
    // Map recipe IDs back to actual recipe objects
    const meals = [];
    const activeSubstitutions = parsed.substitutions || {};

    parsed.selectedRecipeIds.forEach(id => {
      const match = recipeDb.find(r => r.id === id);
      if (match) meals.push(match);
    });

    // If no recipes found, throw error to trigger fallback
    if (meals.length === 0) throw new Error("No recipes found matching IDs in AI response");

    const { groceryList, totalCost } = compileGroceryList(meals, activeSubstitutions);
    const feasibility = calculateBudgetFeasibility(totalCost, budgetLimit);

    return {
      meals,
      groceryList,
      totalCost,
      budgetLimit,
      feasibility,
      explanation: parsed.explanation || "Custom AI Generated Meal Plan.",
      activeSubstitutions
    };
  } catch (e) {
    console.error("AI JSON parsing failed: ", e, jsonText);
    throw new Error("Could not parse AI response JSON structure.");
  }
}
