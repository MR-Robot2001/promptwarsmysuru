// Main Application Controller for Mental Wellness Tracker (MWT)
import { db } from './db.js';
import { ai } from './ai.js';
import { mindfulness } from './mindfulness.js';
import { dashboard } from './dashboard.js';
import { tests } from './tests.js';

// Global variables for active timers
let activeBoxBreathing = null;
let activePomodoro = null;
let currentGuidedTimer = null;
let currentGuidedProgressInterval = null;

// --- Motivational Quotes Database ---
const COMPANION_QUOTES = [
  { text: "Your mock test score is a compass pointing to revision areas, not a final report card on your potential.", author: "Aura Guide" },
  { text: "Sleep is not waste time. It consolidates your long-term memory. 7 hours of sleep is as important as 7 hours of study.", author: "Cognitive Science" },
  { text: "Break your massive syllabus into micro-tasks. You don't build a wall at once; you lay one brick as perfectly as you can.", author: "Habit Lab" },
  { text: "The stress you feel is just a sign that you care about your future. But do not let the fear of failing stop you from learning.", author: "Empathetic Coach" },
  { text: "Take a deep breath. Focus on what is in front of you right now. The past is mock data, the future is yet to compile.", author: "Calm Mind" }
];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 1. Initial State Check (Show Setup Overlay for new users)
  const profile = db.getProfile();
  if (!profile) {
    showSetupOverlay();
  } else {
    updateMiniProfile(profile);
    updateDashboardGreeting(profile);
  }

  // 2. Load Settings & Theme
  let settings = db.getSettings();
  
  // Force active local sessions to transition from simulated mode and rate-limited configurations to Free Router
  if (settings.provider === 'simulated' || settings.openRouterModel === 'meta-llama/llama-3.3-70b-instruct:free') {
    db.saveSettings({ 
      provider: 'openrouter', 
      openRouterModel: 'openrouter/free'
    });
    settings = db.getSettings();
  }
  
  applyTheme(settings.theme);
  document.getElementById('select-settings-provider').value = settings.provider;
  document.getElementById('input-gemini-key').value = settings.geminiKey || '';
  document.getElementById('input-openrouter-key').value = settings.openRouterKey || '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';
  document.getElementById('select-openrouter-model').value = settings.openRouterModel || 'openrouter/free';
  
  if (settings.provider === 'gemini') {
    document.getElementById('group-gemini-key').style.display = 'flex';
  } else if (settings.provider === 'openrouter') {
    document.getElementById('group-openrouter-config').style.display = 'flex';
  }

  // 3. Start Routing System
  initRouter();

  // 4. Initialize Core Modules
  initDashboard();
  initJournal();
  initMindfulness();
  initChat();
  initDiagnostics();
  initSettings();

  // Listeners for global database resets
  window.addEventListener('mwt-data-reset', () => {
    window.location.reload();
  });
}

// --- ROUTING SYSTEM ---
function initRouter() {
  const navItems = [
    { btnId: 'btn-nav-dashboard', paneId: 'pane-dashboard', title: 'Wellness Dashboard', subtitle: 'Your study-wellness balance statistics' },
    { btnId: 'btn-nav-journal', paneId: 'pane-journal', title: 'Daily Journal & AI Insights', subtitle: 'Uncover hidden stress triggers and emotional patterns' },
    { btnId: 'btn-nav-mindfulness', paneId: 'pane-mindfulness', title: 'Mindfulness & Focus Center', subtitle: 'Decompress with breathing techniques and focused sprints' },
    { btnId: 'btn-nav-chat', paneId: 'pane-chat', title: 'CalmCompanion Chat', subtitle: 'Your always-available digital companion' },
    { btnId: 'btn-nav-diagnostics', paneId: 'pane-diagnostics', title: 'System Diagnostics', subtitle: 'Verify stability with integrated unit tests' },
    { btnId: 'btn-nav-settings', paneId: 'pane-settings', title: 'Settings & Key Management', subtitle: 'Manage your profile and API integrations' }
  ];

  navItems.forEach(item => {
    const button = document.getElementById(item.btnId);
    if (button) {
      button.addEventListener('click', () => {
        // Toggle Sidebar Active states
        navItems.forEach(nav => {
          document.getElementById(nav.btnId).closest('.nav-item').classList.remove('active');
        });
        button.closest('.nav-item').classList.add('active');

        // Toggle Visible Panes
        navItems.forEach(nav => {
          document.getElementById(nav.paneId).classList.remove('active');
        });
        document.getElementById(item.paneId).classList.add('active');

        // Update top bar text
        document.getElementById('main-header-title').textContent = item.title;
        document.getElementById('main-header-subtitle').textContent = item.subtitle;

        // Perform layout updates on navigation (e.g., render charts)
        if (item.paneId === 'pane-dashboard') {
          updateDashboard();
        }
      });
    }
  });

  // Theme Toggle Button Event
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      const newTheme = isLight ? 'dark' : 'light';
      applyTheme(newTheme);
      db.saveSettings({ theme: newTheme });
    });
  }
}

function applyTheme(theme) {
  const icon = document.getElementById('icon-theme');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (icon) {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  } else {
    document.body.classList.remove('light-theme');
    if (icon) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }
}

// --- USER SETUP PROFILE FLOW ---
function showSetupOverlay() {
  const overlay = document.getElementById('overlay-setup');
  overlay.style.display = 'flex';

  // Set default date to 3 months from today for target exam date
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 3);
  document.getElementById('input-setup-date').value = defaultDate.toISOString().substring(0, 10);

  const form = document.getElementById('form-setup');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-setup-name').value.trim();
    const exam = document.getElementById('select-setup-exam').value;
    const examDate = document.getElementById('input-setup-date').value;

    if (name && exam && examDate) {
      const newProfile = { name, exam, examDate, created: new Date().toISOString() };
      db.saveProfile(newProfile);
      overlay.style.display = 'none';
      updateMiniProfile(newProfile);
      updateDashboardGreeting(newProfile);
      updateDashboard();
    }
  });
}

function updateMiniProfile(profile) {
  document.getElementById('lbl-username').textContent = profile.name;
  document.getElementById('lbl-exam').textContent = profile.exam;
  document.getElementById('lbl-avatar').textContent = profile.name.charAt(0).toUpperCase();

  // Pre-fill inputs in settings page
  document.getElementById('input-settings-name').value = profile.name;
  document.getElementById('select-settings-exam').value = profile.exam;
  document.getElementById('input-settings-date').value = profile.examDate;
}

function updateDashboardGreeting(profile) {
  document.getElementById('lbl-greeting').textContent = `Hello, ${profile.name}`;
  
  // Calculate remaining days until exam
  const examDate = new Date(profile.examDate);
  const today = new Date();
  const diffTime = examDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const countdownText = document.getElementById('lbl-countdown');
  if (diffDays > 0) {
    countdownText.textContent = `${diffDays} days remaining until your ${profile.exam}. Keep calm and protect your peace of mind.`;
  } else if (diffDays === 0) {
    countdownText.textContent = `Today is the day! Focus on breathing, trust your practice. You got this!`;
  } else {
    countdownText.textContent = `Revise, grow, and decompress. Wellness is a continuous journey.`;
  }
}

// --- WELLNESS DASHBOARD MODULE ---
function initDashboard() {
  // Study-Wellness calculations triggers on slider/input edits
  const inputs = ['input-study-hours', 'input-sleep-hours', 'input-relax-mins'];
  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', updateStudyBalanceIndex);
  });

  // Mood buttons picker trigger
  const moodButtons = document.querySelectorAll('.mood-btn');
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const moodVal = parseInt(btn.getAttribute('data-mood'));
      const moodsText = ['', 'Highly Stressed', 'Anxious', 'Neutral', 'Calm', 'Peaceful'];
      
      // Select visual style
      moodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Save to Database
      db.saveMoodLog(moodVal, moodsText[moodVal]);

      // Update feedback text
      const statusText = document.getElementById('lbl-mood-logged-status');
      statusText.textContent = `Logged: ${moodsText[moodVal]} (score: ${moodVal}/5) • Saved!`;
      statusText.style.color = 'var(--color-secondary)';
      
      setTimeout(() => {
        statusText.textContent = 'Quick-log your state any time';
        statusText.style.color = 'var(--text-muted)';
      }, 3000);

      // Redraw Timeline graphs
      updateDashboard();
    });
  });

  // Cycle affirmations quotes
  const quote = COMPANION_QUOTES[Math.floor(Math.random() * COMPANION_QUOTES.length)];
  document.getElementById('lbl-dashboard-quote').textContent = `"${quote.text}"`;

  // First calculation load
  updateStudyBalanceIndex();
}

function updateDashboard() {
  // Redraw Chart.js graphs
  dashboard.renderCharts({
    mood: 'chart-mood',
    triggers: 'chart-triggers'
  });
}

function updateStudyBalanceIndex() {
  const study = parseFloat(document.getElementById('input-study-hours').value) || 0;
  const sleep = parseFloat(document.getElementById('input-sleep-hours').value) || 0;
  const relax = parseFloat(document.getElementById('input-relax-mins').value) || 0;

  const result = dashboard.calculateBalanceIndex(study, sleep, relax);

  // Update ring UI
  document.getElementById('lbl-balance-score').textContent = result.totalIndex;
  
  const ring = document.getElementById('balance-conic');
  if (ring) {
    // conic-gradient update
    ring.style.background = `conic-gradient(var(--color-secondary) ${result.totalIndex}%, var(--card-border) ${result.totalIndex}% 100%)`;
  }

  // Update text label & class
  const verdictText = document.getElementById('lbl-balance-verdict');
  verdictText.textContent = result.rating.text;
  verdictText.className = result.rating.class;
  verdictText.setAttribute('title', result.rating.tip);
}

// --- DAILY JOURNAL & AI COACH MODULE ---
function initJournal() {
  const textarea = document.getElementById('txt-journal-body');
  const analyzeBtn = document.getElementById('btn-analyze-journal');

  // Word count dynamic updates
  textarea.addEventListener('input', () => {
    const text = textarea.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    document.getElementById('lbl-word-count').textContent = `${count} word${count === 1 ? '' : 's'}`;
  });

  // AI analysis click handler
  analyzeBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    const moodScore = parseInt(document.getElementById('select-journal-mood').value);

    if (text.length < 10) {
      alert('Please write at least a few sentences (10+ characters) describing your state or exam details before executing the AI analysis.');
      return;
    }

    // Set Loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Log...`;
    document.getElementById('lbl-sentiment-badge').textContent = 'Processing...';

    try {
      const result = await ai.analyzeJournal(text, moodScore);

      // Save entry to LocalStorage DB
      db.saveJournalEntry(text, moodScore, result);

      // Render insights sidebar
      renderJournalAnalysisResults(result);

      // Refresh form & histories
      textarea.value = '';
      document.getElementById('lbl-word-count').textContent = '0 words';
      renderJournalHistory();
      updateDashboard();
      
      // Play wellness notification chime
      mindfulness.triggerSound('success');
    } catch (e) {
      console.error(e);
      alert('Failed to analyze journal. Please verify your settings or internet connection.');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Log`;
    }
  });

  // Render initial entries list
  renderJournalHistory();
}

function renderJournalAnalysisResults(result) {
  const sentimentBadge = document.getElementById('lbl-sentiment-badge');
  sentimentBadge.textContent = result.sentiment;
  
  // Assign styling classes based on keywords in sentiment
  sentimentBadge.className = 'sentiment-badge';
  const stateStr = result.sentiment.toLowerCase();
  if (stateStr.includes('critical') || stateStr.includes('severe') || stateStr.includes('distress')) {
    sentimentBadge.classList.add('badge-burnout');
  } else if (stateStr.includes('anxious') || stateStr.includes('stress')) {
    sentimentBadge.classList.add('badge-anxious');
  } else if (stateStr.includes('burnout') || stateStr.includes('exhausted')) {
    sentimentBadge.classList.add('badge-burnout');
  } else if (stateStr.includes('optimistic') || stateStr.includes('determine') || stateStr.includes('focused')) {
    sentimentBadge.classList.add('badge-optimistic');
  } else {
    sentimentBadge.classList.add('badge-neutral');
  }

  // Set Summary
  document.getElementById('lbl-analysis-summary').textContent = result.summary;

  // Render trigger chips
  const chipsContainer = document.getElementById('container-triggers-chips');
  chipsContainer.innerHTML = '';
  result.triggers.forEach(trigger => {
    const chip = document.createElement('span');
    chip.className = 'trigger-chip';
    chip.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${trigger}`;
    chipsContainer.appendChild(chip);
  });

  // Render coping plan list
  const copingContainer = document.getElementById('container-coping-list');
  copingContainer.innerHTML = '';
  result.coping.forEach(strategy => {
    const li = document.createElement('li');
    li.textContent = strategy;
    copingContainer.appendChild(li);
  });
}

function renderJournalHistory() {
  const container = document.getElementById('container-journals-history');
  const journals = db.getJournals();

  if (journals.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 2rem;">No journal entries logged yet. Create your first one above!</p>`;
    return;
  }

  // Render sorted newest first
  container.innerHTML = '';
  [...journals].reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'entry-item';
    
    const dateFormatted = new Date(entry.timestamp).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const triggersChips = entry.analysis?.triggers 
      ? entry.analysis.triggers.map(t => `<span class="trigger-chip" style="padding: 0.15rem 0.5rem; font-size: 0.7rem; border-color: rgba(20,184,166,0.3);"><i class="fa-solid fa-hashtag"></i> ${t}</span>`).join(' ')
      : '';

    div.innerHTML = `
      <div class="entry-left">
        <div class="entry-meta">
          <span><i class="fa-regular fa-calendar-days"></i> ${dateFormatted}</span>
          <span>Mood: ${entry.moodScore}/5</span>
          ${entry.analysis?.sentiment ? `<span style="color: var(--color-primary); font-weight: 600;">• ${entry.analysis.sentiment}</span>` : ''}
        </div>
        <p class="entry-text">${entry.text}</p>
        ${triggersChips ? `<div class="trigger-chips-flex" style="margin-top: 0.5rem;">${triggersChips}</div>` : ''}
        ${entry.analysis?.summary ? `
          <div style="margin-top: 0.75rem; border-left: 2px solid var(--color-secondary); padding-left: 0.75rem; font-size: 0.85rem; font-style: italic; color: var(--text-secondary);">
            <strong>Companion Summary:</strong> ${entry.analysis.summary}
          </div>
        ` : ''}
      </div>
      <div class="entry-actions">
        <button class="delete-entry-btn" data-id="${entry.id}" title="Delete entry" aria-label="Delete Journal Entry"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;

    // Hook delete button
    div.querySelector('.delete-entry-btn').addEventListener('click', (e) => {
      if (confirm('Are you sure you want to delete this journal log?')) {
        db.deleteJournalEntry(entry.id);
        renderJournalHistory();
        updateDashboard();
      }
    });

    container.appendChild(div);
  });
}

// --- MINDFULNESS & FOCUS TIMERS MODULE ---
function initMindfulness() {
  // 1. Box Breathing initialization
  const breathingCard = document.getElementById('card-breathing-workspace');
  activeBoxBreathing = mindfulness.createBoxBreathing(state => {
    // UI Update callback
    document.getElementById('lbl-breath-counter').textContent = state.secondsRemaining;
    document.getElementById('lbl-breath-instruction').textContent = state.phaseName;

    // Map subtext help details
    const helpMap = {
      'inhale': 'Expand your lungs fully with calming air',
      'hold-full': 'Relax, let the carbon dioxide settle',
      'exhale': 'Let go of tension, studies anxiety, and backlogs',
      'hold-empty': 'Keep lungs resting before the next intake'
    };
    document.getElementById('lbl-breath-subtext').textContent = helpMap[state.action] || 'Follow the bubble guidelines';

    // Remove old state classes
    breathingCard.classList.remove('inhale', 'hold-full', 'exhale', 'hold-empty');
    breathingCard.classList.add(state.action);
  });

  document.getElementById('btn-breathing-start').addEventListener('click', () => {
    activeBoxBreathing.start();
    document.getElementById('btn-breathing-start').style.display = 'none';
    document.getElementById('btn-breathing-pause').style.display = 'inline-block';
  });

  document.getElementById('btn-breathing-pause').addEventListener('click', () => {
    activeBoxBreathing.pause();
    document.getElementById('btn-breathing-start').style.display = 'inline-block';
    document.getElementById('btn-breathing-pause').style.display = 'none';
  });

  document.getElementById('btn-breathing-reset').addEventListener('click', () => {
    activeBoxBreathing.reset();
    document.getElementById('btn-breathing-start').style.display = 'inline-block';
    document.getElementById('btn-breathing-pause').style.display = 'none';
    document.getElementById('lbl-breath-counter').textContent = '4';
    document.getElementById('lbl-breath-instruction').textContent = 'Start Box Breathing';
    document.getElementById('lbl-breath-subtext').textContent = 'Balances nervous system & clears pre-exam jitters';
    breathingCard.className = 'glass-card breathing-card';
  });

  // 2. Pomodoro Timer initialization
  activePomodoro = mindfulness.createPomodoro(state => {
    // Render time MM:SS
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    document.getElementById('lbl-timer-clock').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Render details
    document.getElementById('lbl-timer-mode-text').textContent = state.modeName;
    document.getElementById('lbl-completed-sessions').textContent = `Completed Focus Sessions: ${state.completedSessions}`;

    // Manage buttons visibility
    if (state.isRunning) {
      document.getElementById('btn-timer-start').style.display = 'none';
      document.getElementById('btn-timer-pause').style.display = 'inline-block';
    } else {
      document.getElementById('btn-timer-start').style.display = 'inline-block';
      document.getElementById('btn-timer-pause').style.display = 'none';
    }

    // Set buttons active state
    const modesBtn = document.querySelectorAll('.timer-mode-btn');
    modesBtn.forEach(btn => {
      if (btn.getAttribute('data-mode') === state.mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  document.getElementById('btn-timer-start').addEventListener('click', () => activePomodoro.start());
  document.getElementById('btn-timer-pause').addEventListener('click', () => activePomodoro.pause());
  document.getElementById('btn-timer-reset').addEventListener('click', () => activePomodoro.reset());

  // Pomodoro quick mode switch buttons
  document.querySelectorAll('.timer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetMode = btn.getAttribute('data-mode');
      activePomodoro.switchMode(targetMode);
    });
  });

  // Monitor completions and add relaxation minutes automatically
  window.addEventListener('mwt-timer-complete', (e) => {
    if (e.detail.mode !== 'STUDY') {
      // Completed study sprint, which auto-suggests relaxation breaks
      // Let's add 5 mins relaxation to dashboard inputs automatically to reward user!
      const currentVal = parseFloat(document.getElementById('input-relax-mins').value) || 0;
      document.getElementById('input-relax-mins').value = currentVal + 5;
      updateStudyBalanceIndex();
    }
  });

  // 3. Guided Exercises List rendering
  renderGuidedExercises();
}

function renderGuidedExercises() {
  const container = document.getElementById('container-guided-exercises');
  const catalog = mindfulness.getGuidedExercises();

  container.innerHTML = '';
  Object.entries(catalog).forEach(([key, value]) => {
    const card = document.createElement('div');
    card.className = 'glass-card exercise-card';
    card.innerHTML = `
      <div class="exercise-icon"><i class="fa-solid ${value.icon}"></i></div>
      <div class="exercise-desc">
        <h3 class="exercise-title">${value.title}</h3>
        <p class="exercise-meta">${value.duration} • ${value.description}</p>
      </div>
      <button class="btn-primary btn-run-guided" data-key="${key}">Start Reset</button>
    `;

    card.querySelector('.btn-run-guided').addEventListener('click', () => {
      startGuidedWalkthrough(value);
    });

    container.appendChild(card);
  });
}

function startGuidedWalkthrough(exercise) {
  const overlay = document.getElementById('overlay-guided');
  overlay.style.display = 'flex';

  document.getElementById('lbl-guided-title').innerHTML = `<i class="fa-solid fa-spa"></i> ${exercise.title}`;

  let currentStepIndex = 0;
  const steps = exercise.steps;
  const progressFill = document.getElementById('fill-guided-progress');

  const showStep = () => {
    if (currentStepIndex >= steps.length) {
      // Finished all steps
      stopGuidedWalkthrough();
      // Reward relaxation time to the dashboard
      const lengthMins = parseInt(exercise.duration) || 2;
      const current = parseFloat(document.getElementById('input-relax-mins').value) || 0;
      document.getElementById('input-relax-mins').value = current + lengthMins;
      updateStudyBalanceIndex();
      alert(`Well done! You completed: ${exercise.title}. Added ${lengthMins} mins to your relaxation tally!`);
      return;
    }

    const currentStep = steps[currentStepIndex];
    document.getElementById('lbl-guided-text').textContent = currentStep.text;
    
    // Play transition chime
    mindfulness.triggerSound('alert');

    // Smooth Progress Bar Filling over the step delay
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    
    // Force layout recalculation
    void progressFill.offsetWidth;

    progressFill.style.transition = `width ${currentStep.delay}s linear`;
    progressFill.style.width = '100%';

    // Clear old timer triggers
    if (currentGuidedTimer) clearTimeout(currentGuidedTimer);

    currentGuidedTimer = setTimeout(() => {
      currentStepIndex++;
      showStep();
    }, currentStep.delay * 1000);
  };

  const stopGuidedWalkthrough = () => {
    overlay.style.display = 'none';
    if (currentGuidedTimer) clearTimeout(currentGuidedTimer);
    progressFill.style.width = '0%';
  };

  // Bind close/skip button
  document.getElementById('btn-guided-skip').onclick = stopGuidedWalkthrough;

  // Run the sequence
  showStep();
}

// --- CALMCOMPANION CHATROOM MODULE ---
function initChat() {
  const chatForm = document.getElementById('form-chat');
  const chatInput = document.getElementById('input-chat-message');
  const messagesContainer = document.getElementById('container-chat-messages');

  const history = [
    { role: 'model', content: "Hi, I am CalmCompanion. Exam preparation (whether JEE, NEET, UPSC, or Boards) can be highly demanding and stressful. I am here to listen without judgment. How are you coping today?" }
  ];

  const appendBubble = (role, text, isSafety = false) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'user' : 'assistant'}`;
    if (isSafety) {
      bubble.classList.add('chat-bubble-alert');
    }
    
    // Simple line break support
    bubble.innerHTML = text.replace(/\n/g, '<br>');
    messagesContainer.appendChild(bubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const appendTypingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'chat-bubble assistant';
    indicator.id = 'chat-typing-indicator';
    indicator.innerHTML = `
      <div class="typing-indicator" aria-label="CalmCompanion is thinking">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const removeTypingIndicator = () => {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  };

  const processChatMessage = async (userText) => {
    if (!userText.trim()) return;

    // Render User message
    appendBubble('user', userText);
    history.push({ role: 'user', content: userText });
    chatInput.value = '';

    // Show AI processing bubbles
    appendTypingIndicator();

    try {
      const response = await ai.generateChatResponse(history);
      removeTypingIndicator();

      // Render Assistant reply
      appendBubble('model', response.content, response.isSafetyAlert);
      history.push({ role: 'model', content: response.content });

      // Trigger warning audio alerts on safety warnings
      if (response.isSafetyAlert) {
        mindfulness.triggerSound('alert');
      }
    } catch (e) {
      console.error(e);
      removeTypingIndicator();
      appendBubble('model', "Oops, my neural circuits got disconnected. Please verify your internet or API key and try again.");
    }
  };

  // Submit trigger
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = chatInput.value.trim();
    if (val) processChatMessage(val);
  });

  // Quick Chips prompts click bindings
  document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      processChatMessage(text);
    });
  });
}

// --- DIAGNOSTICS & SYSTEM TESTS RUNNER ---
function initDiagnostics() {
  const runBtn = document.getElementById('btn-run-diagnostics');
  const resultsContainer = document.getElementById('container-diagnostics-results');

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Executing Diagnostic Suites...`;
    
    resultsContainer.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2.5rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 0.5rem; display:block;"></i> Running unit test suites...</td></tr>`;

    try {
      const testReport = await tests.runAll();
      
      resultsContainer.innerHTML = '';
      testReport.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.status === 'PASSED' ? 'passed' : 'failed';
        
        tr.innerHTML = `
          <td><strong>${item.name}</strong></td>
          <td>${item.duration}</td>
          <td><span class="status-badge ${badgeClass}">${item.status}</span></td>
        `;
        resultsContainer.appendChild(tr);
      });
    } catch (e) {
      console.error(e);
      resultsContainer.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--color-danger); font-weight: 600; padding: 2rem;">Diagnostics Fatal Crash: ${e.message}</td></tr>`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `<i class="fa-solid fa-circle-play"></i> Execute Automated Tests`;
      
      // Update charts because test sandbox clear might have triggered changes
      updateDashboard();
    }
  });
}

// --- SETTINGS CONFIGURATION MODULE ---
function initSettings() {
  const providerSelect = document.getElementById('select-settings-provider');
  const keyGroup = document.getElementById('group-gemini-key');
  const orGroup = document.getElementById('group-openrouter-config');

  // Show/Hide API key input depending on provider selection
  providerSelect.addEventListener('change', () => {
    keyGroup.style.display = 'none';
    orGroup.style.display = 'none';
    
    if (providerSelect.value === 'gemini') {
      keyGroup.style.display = 'flex';
    } else if (providerSelect.value === 'openrouter') {
      orGroup.style.display = 'flex';
    }
  });

  // Save Settings
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const provider = providerSelect.value;
    const key = document.getElementById('input-gemini-key').value.trim();
    const orKey = document.getElementById('input-openrouter-key').value.trim();
    const orModel = document.getElementById('select-openrouter-model').value;
    
    const name = document.getElementById('input-settings-name').value.trim();
    const exam = document.getElementById('select-settings-exam').value;
    const examDate = document.getElementById('input-settings-date').value;

    if (!name || !examDate) {
      alert('Please fill out Name and Exam Date settings.');
      return;
    }

    if (provider === 'gemini' && !key) {
      alert('You selected Google Gemini, but did not supply an API key. Please supply an API key or use Simulated Coach mode.');
      return;
    }

    // Save profile data & settings
    db.saveProfile({ name, exam, examDate });
    db.saveSettings({ 
      provider, 
      geminiKey: key,
      openRouterKey: orKey,
      openRouterModel: orModel
    });

    // Sync Mini Profiles
    updateMiniProfile({ name, exam, examDate });
    updateDashboardGreeting({ name, exam, examDate });

    alert('Settings successfully updated! All profiles and key configurations saved.');
  });

  // Reset database completely
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('CRITICAL WARNING: This will permanently delete all logged journals, mood timelines, focus sessions, and settings. Are you sure you want to proceed?')) {
      db.clearAllData();
    }
  });
}
