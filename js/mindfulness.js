// Mindfulness and Focus Controller for Mental Wellness Tracker (MWT)

// Dynamic Audio Synthesizer using Web Audio API (for zero-dependency chimes)
/**
 * Plays a synthesized audio notification using the Web Audio API.
 * @param {'success'|'break'|'alert'} [type='success'] - The chime type key
 */
function playChime(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      // Calming high pitch bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } else if (type === 'break') {
      // Soft calming tri-tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.4); // C5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } else if (type === 'alert') {
      // Soft alert double chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {
    console.warn('Web Audio chime could not play due to browser user-gesture restrictions.', e);
  }
}

// --- Box Breathing Manager ---
class BoxBreathing {
  constructor(updateCallback) {
    this.updateCallback = updateCallback; // function({ state, secondsRemaining, isActive })
    this.phases = [
      { name: 'Breathe In', duration: 4, action: 'inhale' },
      { name: 'Hold Air', duration: 4, action: 'hold-full' },
      { name: 'Breathe Out', duration: 4, action: 'exhale' },
      { name: 'Hold Empty', duration: 4, action: 'hold-empty' }
    ];
    this.currentPhaseIndex = 0;
    this.secondsRemaining = 4;
    this.timerId = null;
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.tick();
  }

  pause() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  reset() {
    this.pause();
    this.currentPhaseIndex = 0;
    this.secondsRemaining = this.phases[0].duration;
    this.notify();
  }

  tick() {
    if (!this.isActive) return;

    this.notify();

    this.timerId = setTimeout(() => {
      this.secondsRemaining--;
      
      if (this.secondsRemaining <= 0) {
        // Play very quiet double tick at transitions
        playChime('alert');
        this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
        this.secondsRemaining = this.phases[this.currentPhaseIndex].duration;
      }
      
      this.tick();
    }, 1000);
  }

  notify() {
    const currentPhase = this.phases[this.currentPhaseIndex];
    this.updateCallback({
      phaseName: currentPhase.name,
      action: currentPhase.action,
      secondsRemaining: this.secondsRemaining,
      isActive: this.isActive
    });
  }
}

// --- Pomodoro Study Focus Timer ---
class StudyPomodoro {
  constructor(updateCallback) {
    this.updateCallback = updateCallback; // function({ mode, timeLeft, totalTime, isRunning })
    this.modes = {
      STUDY: { name: 'Study Focus', duration: 25 * 60 },
      SHORT_BREAK: { name: 'Relax Break', duration: 5 * 60 },
      LONG_BREAK: { name: 'Recharge Break', duration: 15 * 60 }
    };
    this.currentMode = 'STUDY';
    this.timeLeft = this.modes.STUDY.duration;
    this.isRunning = false;
    this.timerId = null;
    this.completedSessions = 0;
  }

  setCustomDurations(studyMin, breakMin) {
    this.modes.STUDY.duration = studyMin * 60;
    this.modes.SHORT_BREAK.duration = breakMin * 60;
    this.reset();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  reset() {
    this.pause();
    this.timeLeft = this.modes[this.currentMode].duration;
    this.notify();
  }

  switchMode(modeKey) {
    this.pause();
    this.currentMode = modeKey;
    this.timeLeft = this.modes[modeKey].duration;
    this.notify();
  }

  tick() {
    if (!this.isRunning) return;

    this.notify();

    this.timerId = setTimeout(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.handleTimerCompletion();
      } else {
        this.tick();
      }
    }, 1000);
  }

  handleTimerCompletion() {
    this.isRunning = false;
    this.timerId = null;

    if (this.currentMode === 'STUDY') {
      this.completedSessions++;
      playChime('success');
      // Suggest break
      if (this.completedSessions % 4 === 0) {
        this.currentMode = 'LONG_BREAK';
      } else {
        this.currentMode = 'SHORT_BREAK';
      }
    } else {
      playChime('break');
      this.currentMode = 'STUDY';
    }

    this.timeLeft = this.modes[this.currentMode].duration;
    this.notify();

    // Trigger completion event
    window.dispatchEvent(new CustomEvent('mwt-timer-complete', {
      detail: {
        mode: this.currentMode,
        completedSessions: this.completedSessions
      }
    }));
  }

  notify() {
    this.updateCallback({
      modeName: this.modes[this.currentMode].name,
      mode: this.currentMode,
      timeLeft: this.timeLeft,
      totalTime: this.modes[this.currentMode].duration,
      isRunning: this.isRunning,
      completedSessions: this.completedSessions
    });
  }
}

// --- Guided Exercises Catalog ---
const GUIDED_EXERCISES = {
  pre_test: {
    title: 'Pre-Exam Calm Down',
    duration: '3 Mins',
    icon: 'fa-brain',
    description: 'Ground your nervous system right before a mock test or exam to lower heart rate and clear brain fog.',
    steps: [
      { text: 'Sit comfortably with both feet flat on the floor. Rest your hands on your lap.', delay: 10 },
      { text: 'Take a long, deep inhale through your nose for 4 seconds, then sigh it out through your mouth.', delay: 15 },
      { text: 'Scan your body: drop your shoulders, loosen your jaw, and un-clench your fists.', delay: 20 },
      { text: 'Repeat to yourself: "This test is a tool to help me grow, not a measure of my human worth. I am ready to do my best."', delay: 25 },
      { text: 'Do 3 slow breaths, observing the sensation of air filling your lungs.', delay: 20 }
    ]
  },
  late_night: {
    title: 'Late-Night Wind Down',
    duration: '4 Mins',
    icon: 'fa-moon',
    description: 'Decompress after a long study day. Signal to your brain that it is safe to sleep and stop processing syllabus material.',
    steps: [
      { text: 'Close your study notebooks, place your phone out of arm\'s reach, and turn off bright lights.', delay: 12 },
      { text: 'Lay down or sit back. Gently close your eyes.', delay: 15 },
      { text: 'Perform Progressive Muscle Relaxation: Tense your shoulders for 3 seconds, then drop them completely. Feel the contrast.', delay: 25 },
      { text: 'Inhale slowly and imagine letting go of all mock scores, unresolved study doubts, and tomorrow\'s schedules.', delay: 25 },
      { text: 'Focus on the gentle rise and fall of your abdomen. Let your body sink into the bed. Sleep is your friend.', delay: 30 }
    ]
  },
  focus_reset: {
    title: 'Study Focus Reset',
    duration: '2 Mins',
    icon: 'fa-bolt',
    description: 'Feeling sluggish or scrolling mindlessly? Re-engage your attention network in 2 minutes.',
    steps: [
      { text: 'Stand up. Stretch your arms high above your head and take a deep breath. Exhale and drop them.', delay: 10 },
      { text: 'Drink a glass of cold water slowly, noticing the temperature transition down your throat.', delay: 15 },
      { text: 'Find a point on the wall or outside. Stare at it without blinking for 20 seconds. This activates physical focus.', delay: 20 },
      { text: 'Write down exactly ONE micro-task you will complete in the next 20 minutes (e.g., "Solve 3 organic chemistry equations").', delay: 15 },
      { text: 'Sit down, start your timer, and begin that single task. Let\'s go!', delay: 10 }
    ]
  }
};

export const mindfulness = {
  createBoxBreathing(updateCallback) {
    return new BoxBreathing(updateCallback);
  },
  createPomodoro(updateCallback) {
    return new StudyPomodoro(updateCallback);
  },
  getGuidedExercises() {
    return GUIDED_EXERCISES;
  },
  triggerSound(type) {
    playChime(type);
  }
};
