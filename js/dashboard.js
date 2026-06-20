// Dashboard Controller for Mental Wellness Tracker (MWT)
import { db } from './db.js';

let moodChartInstance = null;
let triggerChartInstance = null;

export const dashboard = {
  /**
   * Calculates the Study-Wellness Balance Index (0 - 100)
   * Formula values:
   * - Sleep (optimal 7.5 hrs): 40% weight
   * - Study (optimal 6-9 hrs): 30% weight
   * - Mindfulness/Break (optimal 45+ min): 30% weight
   */
  calculateBalanceIndex(studyHours, sleepHours, relaxationMin) {
    // 1. Sleep Score (out of 100)
    // Decreases if sleep is too low (< 6) or excessively high (> 9)
    let sleepScore = 100;
    if (sleepHours < 7.5) {
      sleepScore = Math.max(0, 100 - (7.5 - sleepHours) * 25);
    } else if (sleepHours > 8.5) {
      sleepScore = Math.max(0, 100 - (sleepHours - 8.5) * 20);
    }

    // 2. Study Score (out of 100)
    // Reaching 6-9 hours is optimal. Over-studying (> 10 hrs) actually degrades the wellness score due to fatigue risk.
    let studyScore = 0;
    if (studyHours >= 6 && studyHours <= 9.5) {
      studyScore = 100;
    } else if (studyHours < 6) {
      studyScore = (studyHours / 6) * 100;
    } else {
      // Over 9.5 hours
      studyScore = Math.max(20, 100 - (studyHours - 9.5) * 15);
    }

    // 3. Relaxation Score (out of 100)
    const relaxationScore = Math.min(100, (relaxationMin / 45) * 100);

    // Weighted index
    const totalIndex = Math.round((sleepScore * 0.4) + (studyScore * 0.3) + (relaxationScore * 0.3));

    return {
      totalIndex,
      sleepScore: Math.round(sleepScore),
      studyScore: Math.round(studyScore),
      relaxationScore: Math.round(relaxationScore),
      rating: this.getBalanceRating(totalIndex)
    };
  },

  getBalanceRating(score) {
    if (score >= 85) return { text: 'Excellent Balance', class: 'text-success', tip: 'Outstanding! You are balancing hard work with recovery. This is highly sustainable.' };
    if (score >= 65) return { text: 'Good Balance', class: 'text-info', tip: 'Great job. You are on the right track, but try to optimize sleep or relaxation slightly.' };
    if (score >= 45) return { text: 'Moderate Stress Risk', class: 'text-warning', tip: 'Warning: imbalance detected. Ensure you are taking regular study breaks.' };
    return { text: 'High Burnout Danger', class: 'text-danger', tip: 'Critical: Study load is unsustainable or recovery is too low. Prioritize sleep and breathing breaks today.' };
  },

  /**
   * Initializes and renders dashboard charts
   */
  renderCharts(containerIds) {
    const journals = db.getJournals();
    const moodLogs = db.getMoodLogs();

    this.renderMoodTrend(containerIds.mood, moodLogs, journals);
    this.renderStressTriggers(containerIds.triggers, journals);
  },

  renderMoodTrend(canvasId, moodLogs, journals) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Combine mood logs and journal entries into a sorted timeline
    let timeline = [];

    moodLogs.forEach(log => {
      timeline.push({
        date: new Date(log.timestamp),
        score: log.score,
        source: 'Mood Log'
      });
    });

    journals.forEach(j => {
      timeline.push({
        date: new Date(j.timestamp),
        score: j.moodScore,
        source: 'Journal'
      });
    });

    // Sort by date ascending
    timeline.sort((a, b) => a.date - b.date);

    // Group or filter last 7 entries for clean chart
    const recentData = timeline.slice(-7);

    if (recentData.length === 0) {
      this.showChartFallback(canvas, 'Log your mood or analyze journals to see emotional trends.');
      return;
    }

    const labels = recentData.map(d => d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    const dataPoints = recentData.map(d => d.score);

    // Destroy existing chart instance to prevent canvas reuse bugs
    if (moodChartInstance) {
      moodChartInstance.destroy();
    }

    if (!window.Chart) {
      console.warn('Chart.js not loaded. Skipping chart rendering.');
      return;
    }

    // Chart.js configuration
    moodChartInstance = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mood Index',
          data: dataPoints,
          borderColor: '#6366f1', // Calming Violet
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#14b8a6', // Teal points
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const moodLabels = ['', '😫 Highly Stressed', '😕 Anxious', '😐 Neutral', '😊 Relaxed', '🧘 Highly Calm'];
                return moodLabels[value];
              },
              color: '#94a3b8'
            },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  },

  renderStressTriggers(canvasId, journals) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Count triggers from journal analyses
    const triggerCounts = {};
    journals.forEach(j => {
      if (j.analysis?.triggers) {
        j.analysis.triggers.forEach(t => {
          triggerCounts[t] = (triggerCounts[t] || 0) + 1;
        });
      }
    });

    const triggerLabels = Object.keys(triggerCounts);
    const triggerData = Object.values(triggerCounts);

    if (triggerLabels.length === 0) {
      this.showChartFallback(canvas, 'AI analysis will identify and graph stress triggers here.');
      return;
    }

    if (triggerChartInstance) {
      triggerChartInstance.destroy();
    }

    if (!window.Chart) return;

    triggerChartInstance = new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: triggerLabels,
        datasets: [{
          data: triggerData,
          backgroundColor: [
            'rgba(244, 63, 94, 0.85)',  // Rose / Academic
            'rgba(245, 158, 11, 0.85)', // Amber / Sleep
            'rgba(14, 165, 233, 0.85)', // Sky / Peer
            'rgba(168, 85, 247, 0.85)', // Purple / Family
            'rgba(20, 184, 166, 0.85)'  // Teal / Time
          ],
          borderColor: '#1e293b',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              boxWidth: 12
            }
          }
        }
      }
    });
  },

  showChartFallback(canvas, message) {
    const ctx = canvas.getContext('2d');
    
    // Ensure canvas drawing resolution matches display boundaries to prevent pixelation
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = rect.height || 250;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background style
    ctx.fillStyle = 'rgba(30, 41, 59, 0.2)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 8);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, width, height);
    }

    // Draw text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, width / 2, height / 2);
  }
};
