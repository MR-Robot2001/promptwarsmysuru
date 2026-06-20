# Aura - Competitive Exam Mental Wellness Companion

Aura is a beautiful, client-side, Generative AI-powered mental wellness tracker designed specifically for students preparing for high-stakes board exams and competitive entrance tests.

---

## 🎯 Submission Specifications

### 1. Chosen Vertical
* **Vertical**: Mental Wellness Tracker for High-Stakes Competitive Exam Aspirants.
* **Target Audience**: Students preparing for examinations like JEE (Mains/Advanced), NEET, UPSC Civil Services, GATE, CAT, CUET, and CBSE/ICSE Board Exams.
* **Goal**: Target academic pressure, mock test anxiety, sleep deprivation, peer pressure, time management, and study burnout via client-side daily journaling, analytics, breathing tools, Pomodoro timers, and an AI CalmCompanion.

### 2. Approach and Logic
Aura employs a **Privacy-First Hybrid AI Architecture**:
* **CalmCompanion Simulation Mode (Offline Default)**: Uses client-side keyword extraction, heuristic text processing, and rule-based sentiment mapping. It matches student journal content (e.g., words like "mock test", "syllabus", "parents") with customized coping responses. This ensures instant offline utility.
* **Cloud AI API Integration**: Integrates directly with either the **Google Gemini API** (`gemini-1.5-flash`) or the **OpenRouter API** (supporting free open-source models like `Meta Llama 3.3 70B`, `LiquidAI LFM 2.5`, or `Nous Hermes 3`). It uses JSON-schema prompt restrictions to return structured evaluations.
* **Study-Wellness Balance Index**: Evaluates wellness parameters via a custom formula:
  $$\text{Balance Score} = 0.4 \times \text{Sleep} + 0.3 \times \text{Study} + 0.3 \times \text{Relaxation}$$
  It penalizes study durations $>10$ hours and sleep durations $<6.5$ hours to actively warn against physical exhaustion and guide students toward sustainable schedules.
* **Crisis Net Safeguards**: Intercepts safety-critical keywords (self-harm, depression, giving up life) before sending queries to remote APIs, locking the conversational chat and sharing free, 24/7 confidential helplines (AASRA: 91-9820466726, Vandrevala Foundation: 91-9999666555).

### 3. How the Solution Works
* **Database Layer ([js/db.js](file:///D:/Prompt%20Wars/MWT/js/db.js))**: Serializes user profiles, mood logs, and journaling entries locally inside the browser's `localStorage` (no external database server required).
* **Analytics Layer ([js/dashboard.js](file:///D:/Prompt%20Wars/MWT/js/dashboard.js))**: Reads history records to construct Weekly Mood Timelines (Line Chart) and AI stress trigger distributions (Doughnut Chart) using Chart.js on dynamically scaling canvas panels.
* **Mindfulness Engines ([js/mindfulness.js](file:///D:/Prompt%20Wars/MWT/js/mindfulness.js))**: Handles box-breathing loop states, Pomodoro timers, and synthesizes bell audio notifications dynamically using the browser's Web Audio API (saving network bandwidth).
* **Self-Testing Suite ([js/tests.js](file:///D:/Prompt%20Wars/MWT/js/tests.js))**: Houses sandbox unit test assertions that verify calculations and database transactions in real-time under the app's **Diagnostics** tab.
* **Application Routing ([js/app.js](file:///D:/Prompt%20Wars/MWT/js/app.js))**: Binds tab routing views, dashboard charts refresh triggers, chat threads, and settings updates.

### 4. Assumptions Made
* **Browser Compatibility**: Assumes the user is using a modern web browser (Chrome, Edge, Safari, Firefox) that supports ES6 modules (`type="module"`) and the Web Audio API.
* **CORS Restrictions**: Assumes the application is served via a local web server (like the included `http-server` or python server) during development, as double-clicking the `index.html` file directly using the `file://` protocol will block ES Module imports.
* **API Constraints**: Assumes that the API keys (Gemini / OpenRouter) provided by the user are valid and have sufficient quota.
* **Data Privacy**: Assumes the user's data remains private and local in their browser storage.

---

## 🛠️ Technology Stack

* **Structure**: Semantic HTML5 (with strict descriptive IDs and ARIA tags for accessibility).
* **Styling**: Vanilla CSS (custom properties, HSL color tokens, dark/light theme triggers, glassmorphic layout, fluid transition animations). No heavy Tailwind footprint.
* **Logic**: Modern modular ES JavaScript (runs directly in browser without compilation or loaders).
* **Charts**: [Chart.js](https://www.chart.js.org) (loaded asynchronously via CDN) for mood timelines and stress trigger distributions.
* **Icons**: FontAwesome 6 vector icons.
* **Audio Alerts**: Dynamic browser Web Audio API synthesizers (eliminating external asset dependencies).

---

## 🚀 Quick Start & Git Setup

Because Aura is written using vanilla ES modules, it has **zero build steps** and can be hosted directly on GitHub Pages!

### Running Locally
To launch a lightweight local server:

1. Install project dev dependencies (e.g. `http-server`):
   ```bash
   npm install
   ```

2. Spin up the server:
   ```bash
   npm start
   ```

3. Open `http://localhost:3000` in your web browser.

### Publishing to GitHub (Single Branch Setup)
To submit your project:

1. Create a new **public** repository on GitHub.
2. Initialize git and push the files to your repository:
   ```bash
   # Initialize Git
   git init

   # Create a gitignore to keep node_modules out of the repo
   echo "node_modules/" > .gitignore
   echo "*.log" >> .gitignore

   # Commit and push
   git add .
   git commit -m "Deploy Aura Wellness Companion"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Submit your public GitHub repository link!
