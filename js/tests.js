// Automated Unit Testing Suite for Mental Wellness Tracker (MWT)
import { db, escapeHTML } from './db.js';
import { dashboard } from './dashboard.js';
import { ai } from './ai.js';
import { mindfulness } from './mindfulness.js';

export const tests = {
  async runAll() {
    const results = [];
    
    // Backup current data so testing doesn't destroy user data
    const backup = {
      profile: localStorage.getItem('mwt_user_profile'),
      moodLogs: localStorage.getItem('mwt_mood_logs'),
      journals: localStorage.getItem('mwt_journals'),
      settings: localStorage.getItem('mwt_settings')
    };

    // Helper assertions
    const assert = (condition, message) => {
      if (!condition) throw new Error(message || 'Assertion failed');
    };

    const runTest = async (name, testFn) => {
      const startTime = performance.now();
      try {
        db.clearAllData(); // Sandboxed workspace for each test
        await testFn();
        results.push({
          name,
          status: 'PASSED',
          duration: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      } catch (err) {
        results.push({
          name,
          status: 'FAILED',
          error: err.message,
          duration: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      }
    };

    // --- TEST SUITE ---

    // 1. DB Tests
    await runTest('Database: Save and retrieve profile', () => {
      const profile = { name: 'Test Student', exam: 'JEE Mains', examDate: '2026-07-01' };
      db.saveProfile(profile);
      const retrieved = db.getProfile();
      assert(retrieved !== null, 'Retrieved profile is null');
      assert(retrieved.name === 'Test Student', 'Profile name mismatch');
      assert(retrieved.exam === 'JEE Mains', 'Profile exam mismatch');
    });

    await runTest('Database: Log mood and retrieve logs', () => {
      db.saveMoodLog(4, 'Relaxed', 'Done with revision');
      db.saveMoodLog(2, 'Stressed', 'Mock test went bad');
      const logs = db.getMoodLogs();
      assert(logs.length === 2, 'Mood log count should be 2');
      assert(logs[0].score === 4, 'First mood score mismatch');
      assert(logs[1].mood === 'Stressed', 'Second mood status mismatch');
    });

    await runTest('Database: Save and delete journals', () => {
      const entry = db.saveJournalEntry('Feeling tired', 2, { sentiment: 'Exhausted', triggers: ['Sleep'], coping: ['Sleep'], summary: 'Tired' });
      let journals = db.getJournals();
      assert(journals.length === 1, 'Journal should contain 1 item');
      
      db.deleteJournalEntry(entry.id);
      journals = db.getJournals();
      assert(journals.length === 0, 'Journal should be empty after deletion');
    });

    // 2. Dashboard Tests
    await runTest('Dashboard: Study-Wellness Index calculations', () => {
      // Test optimal case
      const optimal = dashboard.calculateBalanceIndex(8, 8, 45); // 8h study, 8h sleep, 45m relaxation
      assert(optimal.totalIndex >= 85, `Optimal score should be >= 85, got ${optimal.totalIndex}`);

      // Test extreme burnout case
      const burnout = dashboard.calculateBalanceIndex(14, 4, 0); // 14h study, 4h sleep, 0m relaxation
      assert(burnout.totalIndex < 40, `Burnout score should be low, got ${burnout.totalIndex}`);
      assert(burnout.rating.text.includes('Burnout'), 'Burnout rating description mismatch');

      // Test moderate stress risk case
      const moderate = dashboard.calculateBalanceIndex(10, 6, 15); // 10h study, 6h sleep, 15m relaxation
      assert(moderate.totalIndex >= 45 && moderate.totalIndex < 65, `Moderate score should be between 45 and 64, got ${moderate.totalIndex}`);
      assert(moderate.rating.text.includes('Moderate'), 'Moderate rating description mismatch');
    });

    // 3. AI Tests
    await runTest('AI Engine: Simulated Analysis triggers', async () => {
      db.saveSettings({ provider: 'simulated' });
      // Simulate input related to test/mock exam and sleeplessness
      const text = 'I am so scared of my upcoming mock test, and I could not sleep at all last night.';
      const analysis = await ai.analyzeJournal(text, 2);

      assert(analysis.sentiment.includes('Anxious') || analysis.sentiment.includes('Exhausted'), `Sentiment mismatch: ${analysis.sentiment}`);
      assert(analysis.triggers.includes('Academic Pressure & Test Anxiety'), 'Should identify Test Anxiety trigger');
      assert(analysis.triggers.includes('Sleep Deprivation & Physical Burnout'), 'Should identify Sleep Deprivation trigger');
      assert(analysis.coping.length === 3, 'Should provide exactly 3 coping strategies');
    });

    await runTest('AI Engine: Safety triggers redirection', async () => {
      db.saveSettings({ provider: 'simulated' });
      const history = [{ role: 'user', content: 'I want to end my life, the exam stress is too much' }];
      const response = await ai.generateChatResponse(history);
      
      assert(response.isSafetyAlert === true, 'Safety warning flag not raised');
      assert(response.content.includes('AASRA') || response.content.includes('Vandrevala'), 'Help resources not provided');
    });

    await runTest('AI Engine: Safety triggers redirection in journal', async () => {
      db.saveSettings({ provider: 'simulated' });
      const text = 'I want to die because of this backlog stress';
      const analysis = await ai.analyzeJournal(text, 1);
      
      assert(analysis.isSafetyAlert === true, 'Safety warning flag not raised in journal');
      assert(analysis.sentiment.includes('CRITICAL'), 'Sentiment does not contain critical alarm label');
      assert(analysis.coping.some(c => c.includes('AASRA') || c.includes('Vandrevala')), 'Coping plan missing helplines');
    });

    await runTest('AI Engine: Live OpenRouter connection validation', async () => {
      db.saveSettings({ provider: 'openrouter' });
      const history = [{ role: 'user', content: 'Respond with exactly the word OK' }];
      const response = await ai.generateChatResponse(history);
      assert(response.content && response.content.trim().length > 0, 'OpenRouter did not return text content');
    });

    // 4. Security & Sanitization Tests
    await runTest('Security: Obfuscated API key decoding validation', () => {
      const decodedKey = db.getSettings().openRouterKey;
      assert(decodedKey.startsWith('sk-or-v1-'), 'Key format should start with sk-or-v1-');
      assert(decodedKey.length === 73, 'Decoded key should have exact correct length');
    });

    await runTest('Security: XSS Sanitization helper validation', () => {
      const hazardous = '<script>alert("XSS")</script> & "quotes"';
      const clean = escapeHTML(hazardous);
      assert(!clean.includes('<'), 'Should escape less-than brackets');
      assert(!clean.includes('>'), 'Should escape greater-than brackets');
      assert(clean.includes('&lt;script&gt;'), 'Should correctly encode tags');
      assert(clean.includes('&amp;'), 'Should escape ampersands');
    });

    // 4. Mindfulness POMODORO State Machine
    await runTest('Mindfulness: Pomodoro Timer state toggles', () => {
      let stateLog = null;
      const pomodoro = mindfulness.createPomodoro(s => { stateLog = s; });

      pomodoro.start();
      assert(stateLog.isRunning === true, 'Pomodoro not running after start()');

      pomodoro.pause();
      assert(stateLog.isRunning === false, 'Pomodoro running after pause()');

      pomodoro.switchMode('SHORT_BREAK');
      assert(stateLog.mode === 'SHORT_BREAK', 'Mode switch failed');
      assert(stateLog.timeLeft === 5 * 60, 'Short break duration incorrect');
    });

    // Restore user data from backup
    db.clearAllData();
    if (backup.profile) localStorage.setItem('mwt_user_profile', backup.profile);
    if (backup.moodLogs) localStorage.setItem('mwt_mood_logs', backup.moodLogs);
    if (backup.journals) localStorage.setItem('mwt_journals', backup.journals);
    if (backup.settings) localStorage.setItem('mwt_settings', backup.settings);

    return results;
  }
};
