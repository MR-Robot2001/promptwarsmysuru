import { describe, it, expect } from 'vitest';
import { compileGroceryList, calculateBudgetFeasibility } from '../plannerEngine.js';

describe('Ingredient Substitution Compilation', () => {
  it('should compile grocery list with active substitutions correctly', () => {
    // Mock recipe with Salmon Fillet
    const recipes = [
      {
        id: "dn-salmon",
        name: "Pan-Seared Lemon Salmon",
        mealType: "dinner",
        baseCost: 9.50,
        ingredients: [
          { name: "Salmon Fillet", amount: 180, unit: "g", category: "Protein", basePrice: 7.00 }
        ]
      }
    ];

    // Sub Salmon Fillet with Chicken Breast (savings of 4.80)
    const activeSubstitutions = {
      "dn-salmon": {
        "Salmon Fillet": {
          name: "Chicken Breast",
          reason: "Less expensive protein",
          priceOffset: -4.80
        }
      }
    };

    const { groceryList, totalCost } = compileGroceryList(recipes, activeSubstitutions);
    
    // Total cost should be base price of other ingredients + sub price (7.00 - 4.80 = 2.20)
    expect(totalCost).toBeCloseTo(2.20, 2);
    
    // Grocery list item name should be the replacement name
    const subbedItem = groceryList.find(i => i.name === "Chicken Breast");
    expect(subbedItem).toBeDefined();
    expect(subbedItem.price).toBeCloseTo(2.20, 2);
    expect(subbedItem.notes[0]).toContain("Substituted for Salmon Fillet");
  });
});

describe('Budget Feasibility Calculations', () => {
  it('should flag status as over_budget if total cost exceeds limit', () => {
    const check = calculateBudgetFeasibility(20.00, 15.00);
    expect(check.status).toBe('over_budget');
    expect(check.cssClass).toBe('budget-danger');
    expect(check.remainingBudget).toBe(-5.00);
  });

  it('should flag status as near_limit if total cost is within 15% of limit', () => {
    const check = calculateBudgetFeasibility(14.00, 15.00);
    expect(check.status).toBe('near_limit');
    expect(check.cssClass).toBe('budget-warning');
  });

  it('should flag status as within if total cost is safely below limit', () => {
    const check = calculateBudgetFeasibility(10.00, 15.00);
    expect(check.status).toBe('within');
    expect(check.cssClass).toBe('budget-ok');
  });
});
