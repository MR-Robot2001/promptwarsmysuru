// AI Engine for Mental Wellness Tracker (MWT)
import { db, DEFAULT_OR_KEY } from './db.js';

// --- Local CalmCompanion Simulation Engine ---
const SIMULATED_TRIGGERS = [
  {
    keywords: ['mock', 'test', 'exam', 'score', 'rank', 'marks', 'syllabus', 'physics', 'math', 'chemistry', 'biology', 'history', 'revision'],
    trigger: 'Academic Pressure & Test Anxiety',
    coping: [
      'Focus on the process of learning rather than raw scores. Treat mock tests as diagnostic tools, not final verdicts.',
      'Try the "3-2-1 Grounding Technique" before starting mock tests: name 3 things you can see, 2 you can feel, and 1 you can hear.',
      'Divide your daily revision into smaller, micro-topics to avoid syllabus paralysis.'
    ]
  },
  {
    keywords: ['parent', 'father', 'mother', 'family', 'brother', 'sister', 'expect', 'expectation', 'home', 'disappoint'],
    trigger: 'Family Expectations',
    coping: [
      'Communicate your study milestones and boundaries gently with your parents. Sometimes they just want to see you try.',
      'Understand that their anxiety often stems from care, but it is not your burden to carry. Your worth is not tied to a rank.',
      'Take short walks outside when household tension gets overwhelming to clear your mind.'
    ]
  },
  {
    keywords: ['friend', 'peer', 'group', 'compare', 'better than me', 'everyone else', 'coaching', 'classroom'],
    trigger: 'Social Comparison & Peer Pressure',
    coping: [
      'Limit discussion of study hours, test marks, and progress with competitive friends. Protect your peace.',
      'Remember that social comparison is an illusion. Everyone has unique learning curves, backlogs, and strengths.',
      'Focus strictly on "Me vs. Yesterday Me" metrics instead of comparing notes with coaching toppers.'
    ]
  },
  {
    keywords: ['sleep', 'tired', 'night', 'insomnia', 'exhausted', 'headache', 'dizzy', 'weak', 'fatigue', 'wake up'],
    trigger: 'Sleep Deprivation & Physical Burnout',
    coping: [
      'Set a strict sleep boundary: no screens 30 minutes before sleep and aim for a minimum of 6.5 hours of sleep.',
      'Try progressive muscle relaxation in bed: tense and release each muscle group starting from your toes.',
      'Hydrate regularly. Dehydration is a stealthy contributor to study fatigue and headaches.'
    ]
  },
  {
    keywords: ['time', 'backlog', 'schedule', 'pending', 'finish', 'waste', 'procrastinate', 'hours', 'phone', 'distracted'],
    trigger: 'Time Management & Study Backlogs',
    coping: [
      'Create a "Focus Container": Use a 25-minute Pomodoro timer, with your phone in another room or on Do Not Disturb.',
      'Do not try to clear the entire backlog at once. Assign just 45 minutes a day specifically to backlog clearance.',
      'Use the 5-Minute Rule: Commit to studying a challenging topic for just 5 minutes. Often, getting started is the hardest part.'
    ]
  },
  {
    keywords: ['give up', 'fail', 'cannot', 'can\'t', 'worthless', 'dumb', 'lose', 'crying', 'hopeless', 'depressed', 'sad', 'scared'],
    trigger: 'Self-Doubt & Emotional Distress',
    coping: [
      'Acknowledge these feelings without judgment. It is normal to feel overwhelmed when striving for big goals.',
      'Write down three past instances where you overcame a hard concept or test. Build your self-efficacy.',
      'Connect with a counselor, empathetic teacher, or trusted friend to vent. You do not have to walk this road alone.'
    ]
  }
];

const SIMULATED_RESPONSES = {
  general_stress: [
    "I hear you. The pressure of competitive exams can feel like a heavy weight, but remember you are taking it step by step. Have you taken a break in the last few hours?",
    "It's completely valid to feel this way. Preparing for competitive exams is a marathon, not a sprint. Remember to be kind to yourself today.",
    "Your hard work is commendable, but your well-being comes first. Let's focus on taking a deep breath and calming your thoughts right now."
  ],
  test_anxiety: [
    "Mock test scores fluctuate, and they are purely indicators of what needs revision, not your intelligence. Let's analyze the mistakes without self-judgment.",
    "Exam anxiety is a physiological response. Let's do a 2-minute box breathing session to reset your nervous system. What do you say?",
    "A bad test score does not define your future. Focus on the concept gaps and try again. You are growing with every attempt."
  ],
  burnout: [
    "Burnout is your body's way of asking for a pause. Continuing to study in a burnt-out state yields very low retention. Please take a 15-minute screen-free break.",
    "It sounds like your study container is full. Let's schedule a guilt-free rest period. Rest is productive because it consolidates your memory!",
    "Give yourself permission to step away from the books. A walk, a stretch, or a glass of water can do wonders for a tired mind."
  ],
  motivation: [
    "Remember why you started, but also remember that your mental health is the foundation of your success. You've got this, one small topic at a time.",
    "Success in competitive exams is built on consistency, not perfection. Celebrate the fact that you showed up today.",
    "You are capable of doing hard things. Break this big block of syllabus into small bites and tackle just the first step."
  ],
  safety: [
    "I hear how much pain and pressure you are in. Please know that your life and well-being are infinitely more valuable than any exam rank or score. Please reach out to someone who can help. You can contact AASRA at 91-9820466726 or Vandrevala Foundation at 91-9999666555. They are free, confidential, and available 24/7.",
    "Please stay safe. This exam is a tiny chapter in a very long, beautiful book of your life. Please talk to a family member, a teacher, or professional support immediately. You can contact AASRA at 91-9820466726 or Vandrevala Foundation at 91-9999666555 for free 24/7 support. You are not alone."
  ]
};

/**
 * Performs a simulated mental wellness analysis of journal entries offline.
 * @param {string} text - The journal content
 * @param {number} userMood - The student's self-logged mood rating (1-5)
 * @returns {{ sentiment: string, triggers: string[], summary: string, coping: string[] }}
 */
function performSimulatedAnalysis(text, userMood) {
  const lowercaseText = text.toLowerCase();
  const matchedTriggers = [];
  let copingList = [];

  // Scan for triggers
  SIMULATED_TRIGGERS.forEach(item => {
    const hasKeyword = item.keywords.some(keyword => lowercaseText.includes(keyword));
    if (hasKeyword) {
      matchedTriggers.push(item.trigger);
      copingList.push(...item.coping);
    }
  });

  // Default triggers if none matched
  if (matchedTriggers.length === 0) {
    matchedTriggers.push('General Exam Prep Stress');
    copingList.push(
      'Incorporate a 10-minute active stretch break into every 2 hours of study.',
      'Keep a study-free zone in your bedroom to help your brain associate that space with rest.',
      'Practice mindfulness for 5 minutes daily to train your focus muscles.'
    );
  }

  // Shuffle and limit coping strategies to 3
  copingList = [...new Set(copingList)].sort(() => 0.5 - Math.random()).slice(0, 3);

  // Sentiment scoring
  let score = 0;
  const positiveWords = ['happy', 'glad', 'confident', 'clear', 'solved', 'good', 'focused', 'cracked', 'learnt', 'better', 'motivated', 'hopeful', 'calm'];
  const negativeWords = ['stressed', 'anxious', 'scared', 'fail', 'waste', 'procrastinate', 'tired', 'exhausted', 'crying', 'hopeless', 'fear', 'pressure', 'worry'];

  positiveWords.forEach(w => { if (lowercaseText.includes(w)) score++; });
  negativeWords.forEach(w => { if (lowercaseText.includes(w)) score--; });

  let sentiment = 'Neutral';
  if (score > 1) sentiment = 'Optimistic / Determined';
  else if (score < -1) {
    if (lowercaseText.includes('tired') || lowercaseText.includes('exhaust') || lowercaseText.includes('burn')) {
      sentiment = 'Exhausted / Burnt Out';
    } else {
      sentiment = 'Anxious / Overwhelmed';
    }
  } else if (userMood <= 2) {
    sentiment = 'Anxious / Under Pressure';
  } else if (userMood >= 4) {
    sentiment = 'Calm / Focused';
  }

  // Empathetic Summary
  let summary = '';
  if (sentiment.includes('Optimistic')) {
    summary = 'You are showing strong determination and focus despite the rigorous prep. Keep channeling this positive energy!';
  } else if (sentiment.includes('Exhausted')) {
    summary = 'Your journal indicates significant exhaustion. It seems you are pushing past your energy limits, causing academic fatigue.';
  } else if (sentiment.includes('Anxious')) {
    summary = 'You are experiencing heighted anxiety and concern, likely revolving around exam prep, schedule backlogs, or performance worries.';
  } else {
    summary = 'You are carrying standard preparation pressure. There is a sense of focus, mixed with typical study anxiety.';
  }

  return {
    sentiment,
    triggers: matchedTriggers,
    summary,
    coping: copingList
  };
}

/**
 * Generates a local offline chat response using heuristic keyword triggers.
 * @param {Array<{role: string, content: string}>} messageHistory - The chat thread history
 * @returns {{ content: string, isSafetyAlert?: boolean }}
 */
function generateSimulatedChatResponse(messageHistory) {
  const latestMessage = messageHistory[messageHistory.length - 1].content.toLowerCase();

  // Safety trigger check
  const safetyKeywords = ['suicide', 'die', 'kill myself', 'give up life', 'end my life', 'self harm', 'ending it all', 'worthless life'];
  if (safetyKeywords.some(keyword => latestMessage.includes(keyword))) {
    return {
      content: SIMULATED_RESPONSES.safety[Math.floor(Math.random() * SIMULATED_RESPONSES.safety.length)],
      isSafetyAlert: true
    };
  }

  // Specific keyword responses
  if (latestMessage.includes('mock') || latestMessage.includes('test') || latestMessage.includes('score') || latestMessage.includes('marks')) {
    return { content: SIMULATED_RESPONSES.test_anxiety[Math.floor(Math.random() * SIMULATED_RESPONSES.test_anxiety.length)] };
  }
  if (latestMessage.includes('burnout') || latestMessage.includes('tired') || latestMessage.includes('exhausted') || latestMessage.includes('sleep') || latestMessage.includes('break')) {
    return { content: SIMULATED_RESPONSES.burnout[Math.floor(Math.random() * SIMULATED_RESPONSES.burnout.length)] };
  }
  if (latestMessage.includes('motivate') || latestMessage.includes('inspire') || latestMessage.includes('give up') || latestMessage.includes('can\'t do')) {
    return { content: SIMULATED_RESPONSES.motivation[Math.floor(Math.random() * SIMULATED_RESPONSES.motivation.length)] };
  }

  // Default general stress response
  return { content: SIMULATED_RESPONSES.general_stress[Math.floor(Math.random() * SIMULATED_RESPONSES.general_stress.length)] };
}

// --- Clean and Parse JSON Helper ---
/**
 * Strips markdown JSON wrappers and parses raw text into a JSON object.
 * @param {string} rawText - The raw response string from the model
 * @returns {Object} The parsed JSON object
 */
function cleanAndParseJSON(rawText) {
  let cleaned = rawText.trim();
  // Strip markdown code block wrappers if present (e.g. ```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

// --- Live OpenRouter API Integration ---
/**
 * Calls the OpenRouter completions API endpoint.
 * @param {Array<{role: string, content: string}>} messages - The formatted chat messages
 * @param {string} apiKey - The OpenRouter API key
 * @param {string} model - The model endpoint string to request
 * @param {boolean} [jsonMode=false] - Enforce structured JSON object response format
 * @returns {Promise<string>} The string completion content
 */
async function callOpenRouterAPI(messages, apiKey, model, jsonMode = false) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const body = {
    model: model || 'meta-llama/llama-3.3-70b-instruct:free',
    messages: messages
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/abhay/mwt',
        'X-Title': 'Aura Wellness Tracker'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

// --- Live Gemini API Integration ---
/**
 * Calls the Google Gemini content generation API key endpoint.
 * @param {string} systemInstruction - The system directives for the agent
 * @param {string} prompt - The student prompt payload
 * @param {string} apiKey - The Gemini API key
 * @param {boolean} [jsonMode=false] - Enforce structured JSON format
 * @returns {Promise<string>} The completion output string
 */
async function callGeminiAPI(systemInstruction, prompt, apiKey, jsonMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }]
    }
  ];

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: jsonMode ? {
      responseMimeType: 'application/json'
    } : {}
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Robust list of safety / self-harm indicators
export const SAFETY_KEYWORDS = [
  'suicide', 'suicidal', 'suiciding', 'kill myself', 'killing myself', 'end my life', 'ending my life', 
  'want to die', 'wishing to die', 'wanna die', 'give up on life', 'giving up on life', 'self-harm', 
  'self harm', 'cut myself', 'cutting myself', 'hurt myself', 'hurting myself', 'poison myself', 
  'overdose', 'hang myself', 'hanging myself', 'jump off', 'jumping off', 'take my life', 'taking my life', 
  'better off dead', 'dont want to live', 'don\'t want to live', 'not want to live', 'end it all', 
  'ending it all', 'worthless life', 'no point living', 'no point in living', 'wish i was dead', 
  'wishing i was dead', 'want to end it', 'wanting to end it', 'suicide note', 'kill my self', 'die today'
];

// --- Exported AI Methods ---
export const ai = {
  /**
   * Analyzes a journal entry using OpenRouter, Gemini, or simulated engine.
   * @param {string} text - The journal text
   * @param {number} userMood - Selected mood score (1-5)
   * @returns {Promise<{ sentiment: string, triggers: string[], summary: string, coping: string[] }>}
   */
  async analyzeJournal(text, userMood) {
    const settings = db.getSettings();
    const profile = db.getProfile() || { name: 'Aspirant', exam: 'Competitive Exams' };

    const lowercaseText = text.toLowerCase();
    const isSafetyTriggered = SAFETY_KEYWORDS.some(keyword => lowercaseText.includes(keyword));

    const systemInstruction = `You are an empathetic, professional AI mental wellness coach assisting a student preparing for high-stakes exams (User's Exam: ${profile.exam}). 
Analyze the student's journal entry. Provide a supportive analysis containing:
1. "sentiment": A string describing the student's emotional state (e.g. "Stressed but determined", "Exhausted", "Anxious").
2. "triggers": An array of strings representing stress triggers identified in their text (e.g., "Mock Test Anxiety", "Lack of Sleep", "Parental Pressure", "Backlog Anxiety").
3. "summary": A warm, 1-2 sentence empathetic summarization showing you truly understand their experience.
4. "coping": An array of exactly 3 highly actionable, evidence-based coping strategies tailored specifically to competitive exam aspirants (e.g. Pomodoro tips, deep breathing, screen-free breaks, mock test strategies).

You MUST output your response as raw JSON matching this schema:
{
  "sentiment": "string",
  "triggers": ["string"],
  "summary": "string",
  "coping": ["string", "string", "string"]
}`;

    const prompt = `Student's Journal Entry: "${text}"
Logged Mood Rating: ${userMood}/5 (where 1 is highly stressed/low and 5 is calm/energetic).`;

    let result = null;

    if (settings.provider === 'openrouter') {
      const apiKey = settings.openRouterKey || DEFAULT_OR_KEY;
      const model = settings.openRouterModel || 'meta-llama/llama-3.3-70b-instruct:free';
      const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ];

      try {
        const rawText = await callOpenRouterAPI(messages, apiKey, model, true);
        result = cleanAndParseJSON(rawText);
      } catch (err) {
        console.warn('OpenRouter API call failed, falling back to local simulation analysis.', err);
        result = performSimulatedAnalysis(text, userMood);
      }
    } else if (settings.provider === 'gemini' && settings.geminiKey) {
      try {
        const rawJson = await callGeminiAPI(systemInstruction, prompt, settings.geminiKey, true);
        result = JSON.parse(rawJson);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local simulation analysis.', err);
        result = performSimulatedAnalysis(text, userMood);
      }
    } else {
      // Local simulated response with delay to feel natural
      result = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(performSimulatedAnalysis(text, userMood));
        }, 1200);
      });
    }

    // Dynamic safety post-processing injection
    if (isSafetyTriggered && result) {
      result.sentiment = 'CRITICAL ALERT: Severe Distress';
      if (!result.triggers.includes('Severe Emotional Distress & Safety Alert')) {
        result.triggers = ['Severe Emotional Distress & Safety Alert', ...result.triggers];
      }
      result.coping = [
        'Contact AASRA Helpline immediately: 91-9820466726 (Confidential, Free, 24/7).',
        'Contact Vandrevala Foundation: 91-9999666555 (Confidential, Free, 24/7).',
        ...result.coping
      ].slice(0, 4); // Pin safety details above AI coping outcomes
      result.isSafetyAlert = true;
    }

    return result;
  },

  /**
   * Generates a chat response in an ongoing conversation.
   * @param {Array<{role: 'user'|'model', content: string}>} messageHistory 
   * @returns {Promise<{content: string, isSafetyAlert?: boolean}>}
   */
  async generateChatResponse(messageHistory) {
    const settings = db.getSettings();
    const profile = db.getProfile() || { name: 'Aspirant', exam: 'Competitive Exams' };

    // Dynamic safety check list for UI alert formatting
    const latestMessage = messageHistory[messageHistory.length - 1].content.toLowerCase();
    const isSafetyTriggered = SAFETY_KEYWORDS.some(keyword => latestMessage.includes(keyword));

    const systemInstruction = `You are "CalmCompanion", an empathetic, supportive, and safe digital companion for students preparing for competitive exams like JEE, NEET, UPSC, GATE, CAT, and Board Exams.
The student's name is ${profile.name} and they are studying for ${profile.exam}.
Guidelines:
1. Be extremely supportive, empathetic, active listening, and calm.
2. Provide short, readable responses. Break blocks of text into friendly paragraphs or bullet points.
3. Suggest practical academic-wellness strategies: active recall breaks, breathing timers, coping with mock test fluctuations, and self-compassion.
4. Keep the tone friendly, reassuring, and non-prescriptive.
5. If the user indicates severe depression, self-harm, or suicidal ideation, you must instantly express support, prioritize safety, and share Indian mental health helpline resources (AASRA: 91-9820466726, Vandrevala: 91-9999666555).`;

    if (settings.provider === 'openrouter') {
      const apiKey = settings.openRouterKey || DEFAULT_OR_KEY;
      const model = settings.openRouterModel || 'meta-llama/llama-3.3-70b-instruct:free';
      const messages = [
        { role: 'system', content: systemInstruction },
        ...messageHistory.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.content
        }))
      ];

      try {
        const textResponse = await callOpenRouterAPI(messages, apiKey, model, false);
        return { content: textResponse, isSafetyAlert: isSafetyTriggered };
      } catch (err) {
        console.warn('OpenRouter Chat API failed, falling back to local simulation chat.', err);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: isSafetyTriggered 
                ? SIMULATED_RESPONSES.safety[Math.floor(Math.random() * SIMULATED_RESPONSES.safety.length)] 
                : generateSimulatedChatResponse(messageHistory).content,
              isSafetyAlert: isSafetyTriggered
            });
          }, 800);
        });
      }
    } else if (settings.provider === 'gemini' && settings.geminiKey) {
      // Format conversation history for Gemini API
      const contextPrompt = messageHistory.map(m => `${m.role === 'user' ? 'Student' : 'CalmCompanion'}: ${m.content}`).join('\n') + '\nCalmCompanion:';

      try {
        const textResponse = await callGeminiAPI(systemInstruction, contextPrompt, settings.geminiKey, false);
        return { content: textResponse, isSafetyAlert: isSafetyTriggered };
      } catch (err) {
        console.warn('Chat API failed, falling back to local simulation chat.', err);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: isSafetyTriggered 
                ? SIMULATED_RESPONSES.safety[Math.floor(Math.random() * SIMULATED_RESPONSES.safety.length)] 
                : generateSimulatedChatResponse(messageHistory).content,
              isSafetyAlert: isSafetyTriggered
            });
          }, 800);
        });
      }
    } else {
      // Local simulation with natural chat delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            content: isSafetyTriggered 
              ? SIMULATED_RESPONSES.safety[Math.floor(Math.random() * SIMULATED_RESPONSES.safety.length)] 
              : generateSimulatedChatResponse(messageHistory).content,
            isSafetyAlert: isSafetyTriggered
          });
        }, 1000);
      });
    }
  }
};
