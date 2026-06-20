import { 
  generateHeuristicPlan, 
  generateAiPlan, 
  compileGroceryList, 
  calculateBudgetFeasibility 
} from './plannerEngine.js';
import { recipeDb, substitutionDb } from './recipeDb.js';

// Convert all base database values from USD to INR
const INR_CONVERSION_RATE = 83;
recipeDb.forEach(recipe => {
  recipe.baseCost = recipe.baseCost * INR_CONVERSION_RATE;
  recipe.ingredients.forEach(ing => {
    ing.basePrice = ing.basePrice * INR_CONVERSION_RATE;
  });
});

Object.keys(substitutionDb).forEach(key => {
  substitutionDb[key].forEach(sub => {
    sub.priceOffset = sub.priceOffset * INR_CONVERSION_RATE;
  });
});

// Application State
const STATE_KEY = 'chefflow_ai_state';
let state = {
  currentPlan: null,           // The full plan object
  activeSubstitutions: {},      // recipeId -> { originalIngredientName: subObject }
  purchasedIngredients: [],     // Array of item names purchased
  completedCookingSteps: [],    // Array of string keys: "recipeId-stepIndex"
  dayDescription: '',
  budgetLimit: 1200,
  dietaryRestrictions: [],
  mealsNeeded: ['breakfast', 'lunch', 'dinner'],
  useAiEngine: true,
  aiConfig: {
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    token: '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',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
  }
};

// Running timer intervals cache (stepKey -> intervalId & remainingSeconds)
const activeTimers = {};

// DOM Elements Cache
const DOM = {
  // Config Form
  form: document.getElementById('form-planner'),
  inputDayDesc: document.getElementById('input-day-desc'),
  inputBudget: document.getElementById('input-budget'),
  budgetValue: document.getElementById('budget-value'),
  btnGenerate: document.getElementById('btn-generate'),
  btnReset: document.getElementById('btn-reset'),
  toggleAiEngine: document.getElementById('toggle-ai-engine'),
  engineStatus: document.getElementById('engine-status'),
  aiSettingsDrawer: document.getElementById('ai-settings-drawer'),
  
  // AI Config Inputs
  aiProvider: document.getElementById('ai-provider'),
  aiEndpoint: document.getElementById('ai-endpoint'),
  aiToken: document.getElementById('ai-token'),
  aiModel: document.getElementById('ai-model'),
  groupAiToken: document.getElementById('group-ai-token'),
  groupAiEndpoint: document.getElementById('group-ai-endpoint'),
  
  // Navigation Tabs
  tabMenu: document.getElementById('tab-menu'),
  tabBudget: document.getElementById('tab-budget'),
  tabShopping: document.getElementById('tab-shopping'),
  tabCooking: document.getElementById('tab-cooking'),
  budgetStatusDot: document.getElementById('budget-status-dot'),
  shoppingBadge: document.getElementById('shopping-badge'),
  cookingBadge: document.getElementById('cooking-badge'),
  
  // Content Panes
  emptyState: document.getElementById('empty-state'),
  panelMenu: document.getElementById('panel-menu'),
  panelBudget: document.getElementById('panel-budget'),
  panelShopping: document.getElementById('panel-shopping'),
  panelCooking: document.getElementById('panel-cooking'),
  
  // Menu Pane
  recipeGrid: document.getElementById('recipe-grid'),
  aiExplanation: document.getElementById('ai-explanation'),
  
  // Budget Pane
  gaugeFill: document.getElementById('gauge-fill'),
  budgetSpentText: document.getElementById('budget-spent-text'),
  budgetLimitText: document.getElementById('budget-limit-text'),
  budgetStatusAlert: document.getElementById('budget-status-alert'),
  savingsTipsList: document.getElementById('savings-tips-list'),
  
  // Shopping Pane
  shoppingCategories: document.getElementById('shopping-categories'),
  shoppingProgressText: document.getElementById('shopping-progress-text'),
  shoppingProgressBar: document.getElementById('shopping-progress-bar'),
  
  // Cooking Pane
  cookingRecipeBlocks: document.getElementById('cooking-recipe-blocks'),
  cookingProgressText: document.getElementById('cooking-progress-text'),
  cookingProgressBar: document.getElementById('cooking-progress-bar'),
  
  // Audio Alert
  audioTimerAlert: document.getElementById('audio-timer-alert')
};

// Start the Application
function init() {
  loadState();
  setupEventListeners();
  
  // Synchronize inputs with state
  syncUiFromState();
  
  if (state.currentPlan) {
    DOM.emptyState.classList.add('hidden');
    renderAll();
  } else {
    showPane('empty');
  }
}

// Save & Load state
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state = { ...state, ...parsed };
      }
    }
    // Ensure the OpenRouter API key is defaulted if empty (so it works out-of-the-box)
    if (!state.aiConfig || !state.aiConfig.token || state.aiConfig.token === '') {
      state.useAiEngine = true;
      state.aiConfig = {
        provider: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        token: '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',
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free'
      };
      saveState();
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
}

// Sync UI inputs to match loaded State
function syncUiFromState() {
  DOM.inputDayDesc.value = state.dayDescription || '';
  DOM.inputBudget.value = state.budgetLimit || 1200;
  DOM.budgetValue.textContent = `₹${parseFloat(state.budgetLimit).toFixed(2)}`;
  
  // Sync checkboxes for restrictions
  const restrictionCheckboxes = DOM.form.querySelectorAll('input[name="restrictions"]');
  restrictionCheckboxes.forEach(cb => {
    cb.checked = state.dietaryRestrictions.includes(cb.value);
  });
  
  // Sync checkboxes for meals
  const mealCheckboxes = DOM.form.querySelectorAll('input[name="meals"]');
  mealCheckboxes.forEach(cb => {
    cb.checked = state.mealsNeeded.includes(cb.value);
  });
  
  // AI toggle
  DOM.toggleAiEngine.checked = state.useAiEngine;
  if (state.useAiEngine) {
    DOM.engineStatus.textContent = 'Cloud AI Planning';
    DOM.aiSettingsDrawer.classList.add('open');
    DOM.aiSettingsDrawer.classList.remove('hidden');
  } else {
    DOM.engineStatus.textContent = 'Smart Heuristics (Local)';
    DOM.aiSettingsDrawer.classList.remove('open');
    DOM.aiSettingsDrawer.classList.add('hidden');
  }
  
  // AI Config
  if (state.aiConfig) {
    DOM.aiProvider.value = state.aiConfig.provider || 'huggingface';
    DOM.aiEndpoint.value = state.aiConfig.endpoint || '';
    DOM.aiToken.value = state.aiConfig.token || '';
    DOM.aiModel.value = state.aiConfig.model || '';
    toggleProviderFields();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Budget slider
  DOM.inputBudget.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    DOM.budgetValue.textContent = `₹${val.toFixed(2)}`;
    state.budgetLimit = val;
    saveState();
  });
  
  // Quick presets tags
  const quickTags = document.querySelectorAll('.quick-tag');
  quickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.getAttribute('data-text');
      DOM.inputDayDesc.value = text;
      state.dayDescription = text;
      saveState();
      
      // Flash highlight text area
      DOM.inputDayDesc.focus();
      DOM.inputDayDesc.style.borderColor = 'var(--color-success)';
      setTimeout(() => {
        DOM.inputDayDesc.style.borderColor = '';
      }, 500);
    });
  });
  
  // Form dietary/meal state updates on-change
  DOM.form.addEventListener('change', (e) => {
    if (e.target.name === 'restrictions') {
      const checked = Array.from(DOM.form.querySelectorAll('input[name="restrictions"]:checked')).map(cb => cb.value);
      state.dietaryRestrictions = checked;
    }
    if (e.target.name === 'meals') {
      const checked = Array.from(DOM.form.querySelectorAll('input[name="meals"]:checked')).map(cb => cb.value);
      state.mealsNeeded = checked;
    }
    saveState();
  });
  
  // AI Engine Toggle
  DOM.toggleAiEngine.addEventListener('change', (e) => {
    state.useAiEngine = e.target.checked;
    if (state.useAiEngine) {
      DOM.engineStatus.textContent = 'Cloud AI Planning';
      DOM.aiSettingsDrawer.classList.remove('hidden');
      // trigger reflow then open
      setTimeout(() => DOM.aiSettingsDrawer.classList.add('open'), 10);
    } else {
      DOM.engineStatus.textContent = 'Smart Heuristics (Local)';
      DOM.aiSettingsDrawer.classList.remove('open');
      setTimeout(() => DOM.aiSettingsDrawer.classList.add('hidden'), 300);
    }
    saveState();
  });
  
  // AI Config fields
  const aiInputs = [DOM.aiProvider, DOM.aiEndpoint, DOM.aiToken, DOM.aiModel];
  aiInputs.forEach(input => {
    input.addEventListener('input', () => {
      state.aiConfig = {
        provider: DOM.aiProvider.value,
        endpoint: DOM.aiEndpoint.value,
        token: DOM.aiToken.value,
        model: DOM.aiModel.value
      };
      saveState();
    });
  });
  DOM.aiProvider.addEventListener('change', () => {
    toggleProviderFields();
    state.aiConfig = {
      provider: DOM.aiProvider.value,
      endpoint: DOM.aiEndpoint.value,
      token: DOM.aiToken.value,
      model: DOM.aiModel.value
    };
    saveState();
  });
  
  // Tab Navigation clicks
  const tabs = [
    { button: DOM.tabMenu, pane: DOM.panelMenu, name: 'menu' },
    { button: DOM.tabBudget, pane: DOM.panelBudget, name: 'budget' },
    { button: DOM.tabShopping, pane: DOM.panelShopping, name: 'shopping' },
    { button: DOM.tabCooking, pane: DOM.panelCooking, name: 'cooking' }
  ];
  
  tabs.forEach(t => {
    t.button.addEventListener('click', () => {
      // Toggle button classes
      tabs.forEach(o => {
        o.button.classList.remove('active');
        o.button.setAttribute('aria-selected', 'false');
      });
      t.button.classList.add('active');
      t.button.setAttribute('aria-selected', 'true');
      
      // Show/Hide panes
      showPane(t.name);
    });
  });
  
  // Submit Planner Form
  DOM.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generatePlanFromUi();
  });
  
  // Reset App
  DOM.btnReset.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your plan? This will clear all selections and progress.')) {
      clearAllTimers();
      state.currentPlan = null;
      state.activeSubstitutions = {};
      state.purchasedIngredients = [];
      state.completedCookingSteps = [];
      saveState();
      
      DOM.emptyState.classList.remove('hidden');
      showPane('empty');
      
      // Reset badges
      DOM.shoppingBadge.textContent = '0';
      DOM.cookingBadge.textContent = '0%';
      DOM.budgetStatusDot.className = 'status-dot dot-success';
    }
  });

  // Global click handler to close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.swap-dropdown-container') && !e.target.closest('.btn-swap')) {
      document.querySelectorAll('.swap-dropdown').forEach(el => el.classList.add('hidden'));
    }
  });
}

// Adjust AI configuration fields depending on provider
function toggleProviderFields() {
  const provider = DOM.aiProvider.value;
  if (provider === 'ollama') {
    DOM.groupAiToken.classList.add('hidden');
    DOM.groupAiEndpoint.classList.remove('hidden');
    DOM.groupAiEndpoint.querySelector('label').textContent = 'Ollama Host Address:';
    if (!DOM.aiEndpoint.value || DOM.aiEndpoint.value.includes('huggingface') || DOM.aiEndpoint.value.includes('openrouter')) {
      DOM.aiEndpoint.value = 'http://localhost:11434';
    }
    if (!DOM.aiModel.value || DOM.aiModel.value.includes('/') || DOM.aiModel.value.includes(':')) {
      DOM.aiModel.value = 'llama3';
    }
  } else if (provider === 'openrouter') {
    DOM.groupAiToken.classList.remove('hidden');
    DOM.groupAiToken.querySelector('label').textContent = 'OpenRouter API Key:';
    DOM.aiToken.placeholder = 'sk-or-... (Enter OpenRouter API Key)';
    DOM.groupAiEndpoint.classList.add('hidden');
    DOM.aiEndpoint.value = 'https://openrouter.ai/api/v1/chat/completions';
    if (!DOM.aiModel.value || !DOM.aiModel.value.includes(':')) {
      DOM.aiModel.value = 'nvidia/nemotron-3-ultra-550b-a55b:free';
    }
  } else {
    // HuggingFace
    DOM.groupAiToken.classList.remove('hidden');
    DOM.groupAiToken.querySelector('label').textContent = 'API Token / Secret Key:';
    DOM.aiToken.placeholder = 'Enter HuggingFace API key';
    DOM.groupAiEndpoint.classList.remove('hidden');
    DOM.groupAiEndpoint.querySelector('label').textContent = 'API Endpoint:';
    if (!DOM.aiEndpoint.value || DOM.aiEndpoint.value.includes('localhost') || DOM.aiEndpoint.value.includes('openrouter')) {
      DOM.aiEndpoint.value = 'https://api-inference.huggingface.co/models/';
    }
    if (!DOM.aiModel.value || !DOM.aiModel.value.includes('/') || DOM.aiModel.value.includes(':')) {
      DOM.aiModel.value = 'meta-llama/Meta-Llama-3-8B-Instruct';
    }
  }
}

// Cleanly switch visible panels
function showPane(paneName) {
  const panels = [DOM.panelMenu, DOM.panelBudget, DOM.panelShopping, DOM.panelCooking];
  
  if (paneName === 'empty') {
    panels.forEach(p => p.classList.add('hidden'));
    DOM.emptyState.classList.remove('hidden');
    return;
  }
  
  DOM.emptyState.classList.add('hidden');
  panels.forEach(p => p.classList.add('hidden'));
  
  if (paneName === 'menu') DOM.panelMenu.classList.remove('hidden');
  if (paneName === 'budget') DOM.panelBudget.classList.remove('hidden');
  if (paneName === 'shopping') DOM.panelShopping.classList.remove('hidden');
  if (paneName === 'cooking') DOM.panelCooking.classList.remove('hidden');
}

// Generate the cooking plan based on user settings
async function generatePlanFromUi() {
  // Validation: Must select at least one meal
  if (state.mealsNeeded.length === 0) {
    alert('Please select at least one meal to include (Breakfast, Lunch, or Dinner).');
    return;
  }
  
  state.dayDescription = DOM.inputDayDesc.value.trim();
  saveState();
  
  setGeneratingLoadingState(true);
  clearAllTimers();
  
  try {
    let result;
    if (state.useAiEngine) {
      if (state.aiConfig.provider === 'huggingface' && !state.aiConfig.token) {
        throw new Error('A Hugging Face API key token is required to use Cloud AI planning.');
      }
      
      // Perform AI Generation
      result = await generateAiPlan(
        state.aiConfig, 
        state.dayDescription, 
        state.budgetLimit, 
        state.dietaryRestrictions, 
        state.mealsNeeded
      );
    } else {
      // Perform Heuristic local Generation
      result = generateHeuristicPlan(
        state.dayDescription, 
        state.budgetLimit, 
        state.dietaryRestrictions, 
        state.mealsNeeded
      );
    }
    
    // Save generated plan to state
    state.currentPlan = result;
    state.activeSubstitutions = result.activeSubstitutions || {};
    state.purchasedIngredients = [];
    state.completedCookingSteps = [];
    saveState();
    
    // Render
    DOM.emptyState.classList.add('hidden');
    renderAll();
    showPane('menu');
    
    // Focus the Today's Menu tab
    DOM.tabMenu.click();
    
  } catch (err) {
    console.error('Plan generation failed: ', err);
    
    // Auto fallback to heuristic if AI failed
    if (state.useAiEngine) {
      alert(`AI Plan failed: ${err.message}.\nFalling back to local Smart Heuristics Planner...`);
      try {
        const result = generateHeuristicPlan(
          state.dayDescription, 
          state.budgetLimit, 
          state.dietaryRestrictions, 
          state.mealsNeeded
        );
        state.currentPlan = result;
        state.activeSubstitutions = {};
        state.purchasedIngredients = [];
        state.completedCookingSteps = [];
        saveState();
        
        DOM.emptyState.classList.add('hidden');
        renderAll();
        showPane('menu');
        DOM.tabMenu.click();
      } catch (err2) {
        alert(`Planner error: ${err2.message}`);
      }
    } else {
      alert(`Planner error: ${err.message}`);
    }
  } finally {
    setGeneratingLoadingState(false);
  }
}

// UI feedback during calculation
function setGeneratingLoadingState(isLoading) {
  const btn = DOM.btnGenerate;
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  
  if (isLoading) {
    btn.disabled = true;
    text.textContent = 'Generating Strategy...';
    spinner.classList.remove('hidden');
  } else {
    btn.disabled = false;
    text.textContent = 'Generate Cooking Plan';
    spinner.classList.add('hidden');
  }
}

// Renders the entire dashboard
function renderAll() {
  if (!state.currentPlan) return;
  
  renderMenu();
  renderBudget();
  renderShoppingList();
  renderCookingMode();
  updateBadges();
}

// Tab 1: Render Today's Menu
function renderMenu() {
  const plan = state.currentPlan;
  DOM.recipeGrid.innerHTML = '';
  
  // Render AI explanation box
  DOM.aiExplanation.textContent = (plan.explanation || "No explanation provided.").replace(/\$/g, '₹');
  
  plan.meals.forEach(recipe => {
    const card = document.createElement('article');
    card.className = `card recipe-card ${recipe.mealType}`;
    
    // Check if substitutions exist for any ingredients in this recipe
    const ingredientsHtml = recipe.ingredients.map(ing => {
      const originalName = ing.name;
      const isSubbed = state.activeSubstitutions[recipe.id] && state.activeSubstitutions[recipe.id][originalName];
      
      const displayName = isSubbed ? state.activeSubstitutions[recipe.id][originalName].name : originalName;
      const displayPrice = isSubbed ? (ing.basePrice + state.activeSubstitutions[recipe.id][originalName].priceOffset) : ing.basePrice;
      const noteText = isSubbed ? `Substituted: ${state.activeSubstitutions[recipe.id][originalName].reason}` : '';
      
      // Let's check if there are substitutions possible
      const possibleSubs = substitutionDb[originalName];
      let swapButtonHtml = '';
      
      if (possibleSubs && possibleSubs.length > 0) {
        swapButtonHtml = `
          <div class="swap-dropdown-container">
            <button type="button" class="btn-swap" data-recipe-id="${recipe.id}" data-ing-name="${originalName}" aria-label="Swap ${originalName}">
              Swap 🔄
            </button>
            <div class="swap-dropdown hidden" id="dropdown-${recipe.id}-${originalName.replace(/\s+/g, '-')}">
              <button class="swap-option reset-swap" data-recipe-id="${recipe.id}" data-ing-name="${originalName}">
                Original: ${originalName}
                <span class="sub-details">Reset to default • ₹${ing.basePrice.toFixed(2)}</span>
              </button>
              ${possibleSubs.map(opt => {
                const diff = opt.priceOffset;
                const diffText = diff === 0 ? 'no cost change' : (diff > 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`);
                const diffClass = diff === 0 ? '' : (diff > 0 ? 'price-extra' : 'price-saving');
                
                return `
                  <button type="button" class="swap-option apply-swap" 
                          data-recipe-id="${recipe.id}" 
                          data-ing-name="${originalName}"
                          data-sub-name="${opt.name}"
                          data-sub-reason="${opt.reason}"
                          data-sub-offset="${opt.priceOffset}">
                    ${opt.name}
                    <span class="sub-details">${opt.reason} • <span class="${diffClass}">${diffText}</span></span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
      
      return `
        <li class="ingredient-item-row">
          <div class="ingredient-details">
            <span class="ingredient-name ${isSubbed ? 'ingredient-original-striked' : ''}">${ing.amount} ${ing.unit} of ${originalName}</span>
            ${isSubbed ? `<span class="ingredient-name text-success">${ing.amount} ${ing.unit} of ${displayName}</span>` : ''}
            ${isSubbed ? `<span class="ingredient-subbed">✓ ${noteText}</span>` : ''}
          </div>
          <div class="ingredient-actions">
            <span class="ingredient-price">₹${displayPrice.toFixed(2)}</span>
            ${swapButtonHtml}
          </div>
        </li>
      `;
    }).join('');

    // Instructions checklist preview
    const drawerId = `drawer-${recipe.id}`;
    
    // Calculate custom recipe cost taking subs into account
    let recipeCost = recipe.baseCost;
    if (state.activeSubstitutions[recipe.id]) {
      const subs = state.activeSubstitutions[recipe.id];
      Object.keys(subs).forEach(origName => {
        recipeCost += subs[origName].priceOffset;
      });
    }

    card.innerHTML = `
      <div class="recipe-card-header">
        <span class="meal-badge">${recipe.mealType}</span>
        <span class="calories-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          ${recipe.calories} kcal
        </span>
      </div>
      <h3 class="recipe-name">${recipe.name}</h3>
      
      <div class="recipe-meta-row">
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Prep: ${recipe.prepTime}m
        </span>
        <span class="meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Cook: ${recipe.cookTime}m
        </span>
      </div>

      <div class="recipe-tags">
        ${recipe.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
      </div>

      <div class="recipe-ingredients-box">
        <h4 class="ingredients-title">Ingredients Checklist</h4>
        <ul class="ingredients-list">
          ${ingredientsHtml}
        </ul>
      </div>

      <div class="recipe-instructions-drawer">
        <button class="drawer-toggle" data-target="${drawerId}">
          <span>Cooking Instructions Preview</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="drawer-content" id="${drawerId}">
          <ol class="ingredients-list" style="list-style-type: decimal; padding-left: 18px;">
            ${recipe.instructions.map(step => `
              <li style="margin-bottom: 6px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${step}</li>
            `).join('')}
          </ol>
        </div>
      </div>

      <div class="recipe-cost-row">
        <span class="recipe-cost-label">Recipe Cost:</span>
        <span class="recipe-cost-value">₹${recipeCost.toFixed(2)}</span>
      </div>
    `;
    DOM.recipeGrid.appendChild(card);
  });
  
  // Attach swap button listeners
  document.querySelectorAll('.btn-swap').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rId = btn.getAttribute('data-recipe-id');
      const ingName = btn.getAttribute('data-ing-name');
      const dropdownId = `dropdown-${rId}-${ingName.replace(/\s+/g, '-')}`;
      
      // Close other dropdowns
      document.querySelectorAll('.swap-dropdown').forEach(el => {
        if (el.id !== dropdownId) el.classList.add('hidden');
      });
      
      const dropdown = document.getElementById(dropdownId);
      dropdown.classList.toggle('hidden');
    });
  });
  
  // Apply swap listeners
  document.querySelectorAll('.apply-swap').forEach(btn => {
    btn.addEventListener('click', () => {
      const recipeId = btn.getAttribute('data-recipe-id');
      const origName = btn.getAttribute('data-ing-name');
      const subName = btn.getAttribute('data-sub-name');
      const subReason = btn.getAttribute('data-sub-reason');
      const subOffset = parseFloat(btn.getAttribute('data-sub-offset'));
      
      applyIngredientSubstitution(recipeId, origName, {
        name: subName,
        reason: subReason,
        priceOffset: subOffset
      });
    });
  });
  
  // Reset swap listeners
  document.querySelectorAll('.reset-swap').forEach(btn => {
    btn.addEventListener('click', () => {
      const recipeId = btn.getAttribute('data-recipe-id');
      const origName = btn.getAttribute('data-ing-name');
      resetIngredientSubstitution(recipeId, origName);
    });
  });
  
  // Drawer Toggles
  document.querySelectorAll('.drawer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const content = document.getElementById(targetId);
      btn.classList.toggle('active');
      content.classList.toggle('open');
    });
  });
}

// Perform swapping logic
function applyIngredientSubstitution(recipeId, originalIngredient, subObj) {
  if (!state.activeSubstitutions[recipeId]) {
    state.activeSubstitutions[recipeId] = {};
  }
  state.activeSubstitutions[recipeId][originalIngredient] = subObj;
  saveState();
  
  recalculatePlanEconomics();
  renderAll();
}

function resetIngredientSubstitution(recipeId, originalIngredient) {
  if (state.activeSubstitutions[recipeId] && state.activeSubstitutions[recipeId][originalIngredient]) {
    delete state.activeSubstitutions[recipeId][originalIngredient];
    if (Object.keys(state.activeSubstitutions[recipeId]).length === 0) {
      delete state.activeSubstitutions[recipeId];
    }
  }
  saveState();
  
  recalculatePlanEconomics();
  renderAll();
}

// Recalculates total cost, lists, budget health
function recalculatePlanEconomics() {
  if (!state.currentPlan) return;
  
  const { groceryList, totalCost } = compileGroceryList(state.currentPlan.meals, state.activeSubstitutions);
  const feasibility = calculateBudgetFeasibility(totalCost, state.budgetLimit);
  
  state.currentPlan.groceryList = groceryList;
  state.currentPlan.totalCost = totalCost;
  state.currentPlan.feasibility = feasibility;
  
  saveState();
}

// Tab 2: Render Budget Dashboard
function renderBudget() {
  const plan = state.currentPlan;
  if (!plan) return;
  
  const total = plan.totalCost;
  const limit = plan.budgetLimit;
  const feasibility = plan.feasibility;
  
  // Update texts
  DOM.budgetSpentText.textContent = `₹${total.toFixed(2)}`;
  DOM.budgetLimitText.textContent = `₹${limit.toFixed(2)}`;
  
  // Calculate gauge fill stroke
  // SVG arc length is roughly 125.6 (PI * radius, where r=40 is drawn in path)
  const percent = Math.min(total / limit, 1.2); // cap visual fill at 120%
  const offset = 125.6 - (percent * 125.6);
  DOM.gaugeFill.setAttribute('stroke-dashoffset', offset);
  
  // Set gauge color and Alert Box content
  DOM.gaugeFill.className.baseVal = `gauge-fill ${feasibility.status === 'within' ? 'success' : (feasibility.status === 'near_limit' ? 'warning' : 'danger')}`;
  
  // Render health check card
  DOM.budgetStatusAlert.className = `alert-box ${feasibility.cssClass}`;
  
  let statusText = '';
  const cleanMsg = feasibility.message.replace(/\$/g, '₹');
  if (feasibility.status === 'within') {
    statusText = `<strong>💪 Healthy Budget!</strong> ${cleanMsg}`;
    DOM.budgetStatusDot.className = 'status-dot dot-success';
  } else if (feasibility.status === 'near_limit') {
    statusText = `<strong>⚠️ Near Limit!</strong> ${cleanMsg}`;
    DOM.budgetStatusDot.className = 'status-dot dot-warning';
  } else {
    statusText = `<strong>🚨 Over Budget!</strong> ${cleanMsg} Try the ingredient substitutions recommended below to stay under limit.`;
    DOM.budgetStatusDot.className = 'status-dot dot-danger';
  }
  DOM.budgetStatusAlert.innerHTML = statusText;
  
  // Render savings tips list
  DOM.savingsTipsList.innerHTML = '';
  
  // Let's filter savings tips to only display suggestions that are relevant to current recipes,
  // AND are not already applied!
  const tips = feasibility.savingsTips || [];
  let applicableTipsCount = 0;
  
  tips.forEach(tip => {
    // Check if recipe is in plan
    const recipeInPlan = plan.meals.find(r => r.id === tip.recipeId);
    if (!recipeInPlan) return;
    
    // Check if already subbed
    const isAlreadySubbed = state.activeSubstitutions[tip.recipeId] && 
                            state.activeSubstitutions[tip.recipeId][tip.original] &&
                            state.activeSubstitutions[tip.recipeId][tip.original].name === tip.replacement;
    if (isAlreadySubbed) return;
    
    applicableTipsCount++;
    const tipCard = document.createElement('div');
    tipCard.className = 'savings-tip-item';
    
    // Find original price and sub details
    const origIng = recipeInPlan.ingredients.find(i => i.name === tip.original);
    const priceOffset = substitutionDb[tip.original].find(s => s.name === tip.replacement).priceOffset;
    
    tipCard.innerHTML = `
      <div class="tip-content-info">
        <span class="tip-label-meal">${recipeInPlan.mealType.toUpperCase()} • ${recipeInPlan.name}</span>
        <p class="tip-description">Replace <strong>${tip.original}</strong> with <strong>${tip.replacement}</strong></p>
        <span class="tip-reason">Why: "${tip.reason}"</span>
      </div>
      <div class="ingredient-actions">
        <span class="savings-amount-badge">-₹${Math.abs(priceOffset).toFixed(2)}</span>
        <button type="button" class="btn-apply-tip" 
                data-recipe-id="${tip.recipeId}"
                data-original="${tip.original}"
                data-replace="${tip.replacement}"
                data-reason="${tip.reason}"
                data-offset="${priceOffset}">
          Apply
        </button>
      </div>
    `;
    
    DOM.savingsTipsList.appendChild(tipCard);
  });
  
  if (applicableTipsCount === 0) {
    DOM.savingsTipsList.innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 20px;">
        🎉 Great job! No cost-trimming substitutions available or all recommendations are already active.
      </div>
    `;
  }
  
  // Attach listeners to apply tip buttons
  document.querySelectorAll('.btn-apply-tip').forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-recipe-id');
      const orig = btn.getAttribute('data-original');
      const rep = btn.getAttribute('data-replace');
      const reason = btn.getAttribute('data-reason');
      const offset = parseFloat(btn.getAttribute('data-offset'));
      
      applyIngredientSubstitution(rId, orig, {
        name: rep,
        reason: reason,
        priceOffset: offset
      });
    });
  });
}

// Tab 3: Render Grocery Shopping List
function renderShoppingList() {
  const plan = state.currentPlan;
  if (!plan) return;
  
  const list = plan.groceryList || [];
  
  // Group categories
  const categories = {};
  list.forEach(item => {
    const cat = item.category || 'Pantry';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });
  
  DOM.shoppingCategories.innerHTML = '';
  
  // Update progress bar
  const totalCount = list.length;
  const purchasedCount = list.filter(item => state.purchasedIngredients.includes(item.name)).length;
  
  DOM.shoppingProgressText.textContent = `${purchasedCount} / ${totalCount} Items Purchased`;
  const percent = totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0;
  DOM.shoppingProgressBar.style.width = `${percent}%`;
  
  Object.keys(categories).sort().forEach(catName => {
    const catCard = document.createElement('div');
    catCard.className = 'category-card';
    
    const catItems = categories[catName];
    const catHeader = `
      <h3 class="category-card-header">
        <span>${catName}</span>
        <span class="category-badge">${catItems.length} items</span>
      </h3>
    `;
    
    const itemsListHtml = catItems.map(item => {
      const isChecked = state.purchasedIngredients.includes(item.name);
      const isSubbed = item.notes && item.notes.length > 0;
      
      return `
        <div class="shopping-item-wrapper ${isChecked ? 'checked' : ''}" data-item-name="${item.name}">
          <label class="shopping-item-checkbox">
            <input type="checkbox" ${isChecked ? 'checked' : ''}>
            <div class="shopping-item-details">
              <span class="shopping-item-name">${item.amount.toFixed(1).replace(/\.0$/, '')} ${item.unit} ${item.name}</span>
              ${isSubbed ? `<span class="shopping-item-note">${item.notes.join(' • ')}</span>` : ''}
            </div>
          </label>
          <span class="shopping-item-price">₹${item.price.toFixed(2)}</span>
        </div>
      `;
    }).join('');
    
    catCard.innerHTML = `
      ${catHeader}
      <div class="shopping-items-list">
        ${itemsListHtml}
      </div>
    `;
    DOM.shoppingCategories.appendChild(catCard);
  });
  
  // Attach checkbox toggle events
  document.querySelectorAll('.shopping-item-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      // Prevent double trigger if clicking label/checkbox directly
      if (e.target.tagName === 'INPUT') {
        togglePurchasedItem(wrapper.getAttribute('data-item-name'), e.target.checked);
        return;
      }
      e.preventDefault();
      const checkbox = wrapper.querySelector('input');
      checkbox.checked = !checkbox.checked;
      togglePurchasedItem(wrapper.getAttribute('data-item-name'), checkbox.checked);
    });
  });
}

function togglePurchasedItem(itemName, isChecked) {
  if (isChecked) {
    if (!state.purchasedIngredients.includes(itemName)) {
      state.purchasedIngredients.push(itemName);
    }
  } else {
    state.purchasedIngredients = state.purchasedIngredients.filter(n => n !== itemName);
  }
  saveState();
  
  // Refresh shopping list and badges without redrawing entire DOM where possible
  renderShoppingList();
  updateBadges();
}

// Tab 4: Render Cooking Mode Steps
function renderCookingMode() {
  const plan = state.currentPlan;
  if (!plan) return;
  
  DOM.cookingRecipeBlocks.innerHTML = '';
  
  // Calculate global step counts
  let totalSteps = 0;
  let completedSteps = 0;
  
  plan.meals.forEach(recipe => {
    totalSteps += recipe.instructions.length;
    recipe.instructions.forEach((step, idx) => {
      const stepKey = `${recipe.id}-${idx}`;
      if (state.completedCookingSteps.includes(stepKey)) {
        completedSteps++;
      }
    });
  });
  
  // Update Cooking progress bar
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  DOM.cookingProgressText.textContent = `Completed ${completedSteps} / ${totalSteps} Steps (${progressPercent}%)`;
  DOM.cookingProgressBar.style.width = `${progressPercent}%`;
  
  plan.meals.forEach(recipe => {
    const block = document.createElement('div');
    block.className = `cooking-recipe-block ${recipe.mealType}`;
    
    const blockHeader = `
      <h3>
        <span class="meal-badge">${recipe.mealType}</span>
        <span>${recipe.name}</span>
      </h3>
    `;
    
    const stepsHtml = recipe.instructions.map((stepText, idx) => {
      const stepKey = `${recipe.id}-${idx}`;
      const isCompleted = state.completedCookingSteps.includes(stepKey);
      
      // Look for timers in text
      const durationSec = extractTimerDuration(stepText);
      let timerHtml = '';
      
      if (durationSec > 0) {
        // Retrieve state of active/paused timer if exists
        const timerState = activeTimers[stepKey];
        const displaySeconds = timerState ? timerState.remaining : durationSec;
        const displayTimeStr = formatTime(displaySeconds);
        
        const isRunning = timerState && timerState.intervalId;
        const isFinished = timerState && timerState.remaining === 0;
        
        let containerClass = 'timer-container';
        if (isRunning) containerClass += ' running';
        if (isFinished) containerClass += ' finished';
        
        timerHtml = `
          <div class="${containerClass}" data-step-key="${stepKey}" data-duration="${durationSec}" style="margin-left: auto;">
            <span class="timer-time">${isFinished ? 'Done! ⏰' : displayTimeStr}</span>
            <button type="button" class="timer-btn play-pause-btn ${isRunning ? 'active' : ''}" aria-label="${isRunning ? 'Pause Timer' : 'Start Timer'}">
              ${isRunning ? 
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>` : 
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
              }
            </button>
            <button type="button" class="timer-btn cancel-btn" aria-label="Reset Timer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        `;
      }
      
      return `
        <div class="cooking-step-card ${isCompleted ? 'completed' : ''}" data-step-key="${stepKey}">
          <div class="cooking-step-number">${idx + 1}</div>
          <div class="cooking-step-text">${stepText}</div>
          <div class="cooking-step-actions">
            ${timerHtml}
            <button type="button" class="btn-complete-step" aria-label="${isCompleted ? 'Mark step incomplete' : 'Mark step complete'}">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    block.innerHTML = `
      ${blockHeader}
      <div class="cooking-steps-list">
        ${stepsHtml}
      </div>
    `;
    DOM.cookingRecipeBlocks.appendChild(block);
  });
  
  // Attach complete step listeners
  document.querySelectorAll('.btn-complete-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.cooking-step-card');
      const stepKey = card.getAttribute('data-step-key');
      const willComplete = !card.classList.contains('completed');
      
      toggleCookingStep(stepKey, willComplete);
    });
  });
  
  // Attach Timer listeners
  document.querySelectorAll('.timer-container').forEach(timerNode => {
    const stepKey = timerNode.getAttribute('data-step-key');
    const defaultDuration = parseInt(timerNode.getAttribute('data-duration'), 10);
    
    const playPauseBtn = timerNode.querySelector('.play-pause-btn');
    const cancelBtn = timerNode.querySelector('.cancel-btn');
    
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleTimerToggle(stepKey, defaultDuration);
    });
    
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetTimer(stepKey);
    });
  });
}

function toggleCookingStep(stepKey, isCompleted) {
  if (isCompleted) {
    if (!state.completedCookingSteps.includes(stepKey)) {
      state.completedCookingSteps.push(stepKey);
    }
  } else {
    state.completedCookingSteps = state.completedCookingSteps.filter(s => s !== stepKey);
  }
  saveState();
  
  renderCookingMode();
  updateBadges();
}

// Timer management
function extractTimerDuration(text) {
  // Regex looks for "X minutes", "X-Y mins", "X min"
  const match = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:minutes|minute|mins|min)\b/i);
  if (match) {
    // Use upper bound of range if available (e.g. 8-10 minutes -> 10 minutes)
    const minutes = parseInt(match[2] || match[1], 10);
    return minutes * 60; // Return total seconds
  }
  return 0;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function handleTimerToggle(stepKey, durationSec) {
  if (!activeTimers[stepKey]) {
    // Create new timer
    activeTimers[stepKey] = {
      remaining: durationSec,
      intervalId: null
    };
  }
  
  const tState = activeTimers[stepKey];
  
  if (tState.intervalId) {
    // Pause timer
    clearInterval(tState.intervalId);
    tState.intervalId = null;
    renderCookingMode();
  } else {
    // Reset if it finished earlier
    if (tState.remaining === 0) {
      tState.remaining = durationSec;
    }
    
    // Start interval ticking
    tState.intervalId = setInterval(() => {
      tState.remaining--;
      
      if (tState.remaining <= 0) {
        clearInterval(tState.intervalId);
        tState.intervalId = null;
        tState.remaining = 0;
        
        // Play Sound alert!
        playAlertSound();
      }
      
      renderCookingMode();
    }, 1000);
    
    renderCookingMode();
  }
}

function playAlertSound() {
  try {
    DOM.audioTimerAlert.currentTime = 0;
    DOM.audioTimerAlert.play();
  } catch (err) {
    console.warn('Audio play was blocked or failed', err);
  }
}

function resetTimer(stepKey) {
  if (activeTimers[stepKey]) {
    if (activeTimers[stepKey].intervalId) {
      clearInterval(activeTimers[stepKey].intervalId);
    }
    delete activeTimers[stepKey];
    renderCookingMode();
  }
}

function clearAllTimers() {
  Object.keys(activeTimers).forEach(key => {
    if (activeTimers[key].intervalId) {
      clearInterval(activeTimers[key].intervalId);
    }
  });
  // Clear object
  for (const key in activeTimers) {
    delete activeTimers[key];
  }
}

// Update badges on Tab header
function updateBadges() {
  const plan = state.currentPlan;
  if (!plan) {
    DOM.shoppingBadge.textContent = '0';
    DOM.cookingBadge.textContent = '0%';
    return;
  }
  
  // Shopping checklist badge: remaining items count
  const list = plan.groceryList || [];
  const remainingShopping = list.length - list.filter(item => state.purchasedIngredients.includes(item.name)).length;
  DOM.shoppingBadge.textContent = remainingShopping;
  
  // Cooking checklist badge: completion percentage
  let totalSteps = 0;
  let completedSteps = 0;
  
  plan.meals.forEach(recipe => {
    totalSteps += recipe.instructions.length;
    recipe.instructions.forEach((step, idx) => {
      if (state.completedCookingSteps.includes(`${recipe.id}-${idx}`)) {
        completedSteps++;
      }
    });
  });
  
  const cookingPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  DOM.cookingBadge.textContent = `${cookingPercent}%`;
}

// Load application
window.addEventListener('DOMContentLoaded', init);
