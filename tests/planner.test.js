import { describe, it, expect } from 'vitest';
import { parseUserPreferences, findBestRecipe, generateHeuristicPlan } from '../plannerEngine.js';

describe('User Preferences Parser', () => {
  it('should detect vegan and vegetarian options from text', () => {
    const prefs = parseUserPreferences("I want a vegan diet today");
    expect(prefs.dietaryRestrictions).toContain("vegan");
    expect(prefs.dietaryRestrictions).toContain("vegetarian");
  });

  it('should detect busy schedule keywords', () => {
    const prefs = parseUserPreferences("I have a busy day and many meetings");
    expect(prefs.isBusy).toBe(true);
  });

  it('should combine UI restrictions with text parsed ones', () => {
    const prefs = parseUserPreferences("I want gluten-free food", ["keto"]);
    expect(prefs.dietaryRestrictions).toContain("gluten-free");
    expect(prefs.dietaryRestrictions).toContain("keto");
  });
});

describe('Recipe Selection & Plan Generation', () => {
  it('should respect strict dietary restrictions when selecting recipes', () => {
    const preferences = { dietaryRestrictions: ['vegan'], isBusy: false };
    const recipe = findBestRecipe('dinner', preferences, 10.0);
    expect(recipe).not.toBeNull();
    expect(recipe.tags).toContain('vegan');
  });

  it('should check budget feasibility correctly', () => {
    // Generate a plan with a low budget
    const plan = generateHeuristicPlan("Standard day", 5.0, [], ["breakfast", "lunch", "dinner"]);
    expect(plan.feasibility.status).toBe('over_budget');
    
    // Generate a plan with a high budget
    const planHigh = generateHeuristicPlan("Standard day", 100.0, [], ["breakfast", "lunch", "dinner"]);
    expect(planHigh.feasibility.status).toBe('within');
  });
});
