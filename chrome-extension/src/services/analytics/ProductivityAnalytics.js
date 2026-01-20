/**
 * 📊 CUBE Nexum v7.0.0 - Productivity Analytics Service
 * 
 * ENTERPRISE-GRADE PRODUCTIVITY TRACKING & INSIGHTS
 * 
 * Features:
 * - Real-time productivity metrics
 * - Time savings calculations
 * - ROI dashboard
 * - Usage patterns analysis
 * - AI-powered productivity insights
 * - Weekly/Monthly reports
 * - Goal tracking
 * 
 * @version 7.0.0
 * @license CUBE Nexum Enterprise
 */

class ProductivityAnalytics {
  constructor() {
    this.sessionStart = Date.now();
    this.metrics = {
      session: {
        start: this.sessionStart,
        actions: 0,
        timeSaved: 0,
        formsAutofilled: 0,
        macrosRun: 0,
        documentsProcessed: 0,
        aiQueriesProcessed: 0
      },
      lifetime: {
        totalSessions: 0,
        totalTimeSaved: 0,
        totalFormsAutofilled: 0,
        totalMacrosRun: 0,
        totalDocumentsProcessed: 0,
        totalAiQueries: 0,
        totalKeystrokes: 0,
        totalClicks: 0,
        firstUseDate: null,
        streakDays: 0,
        lastActiveDate: null
      },
      goals: {
        dailyTimeSaved: 30, // minutes
        weeklyFormsAutofilled: 50,
        monthlyMacrosRun: 100
      },
      achievements: []
    };

    // Time estimates (in seconds)
    this.timeEstimates = {
      formAutofill: 120,      // 2 minutes saved per form
      macroRun: 180,          // 3 minutes per macro run
      documentProcess: 300,   // 5 minutes per document
      aiQuery: 60,            // 1 minute per AI query
      keystrokeSaved: 0.5,    // Half second per keystroke
      clickSaved: 1           // 1 second per automated click
    };

    // Achievements definitions
    this.achievementDefs = [
      { id: 'first_form', name: 'First Form', desc: 'Autofill your first form', icon: '📝', condition: (m) => m.totalFormsAutofilled >= 1 },
      { id: 'form_master', name: 'Form Master', desc: 'Autofill 100 forms', icon: '📋', condition: (m) => m.totalFormsAutofilled >= 100 },
      { id: 'first_macro', name: 'Automation Begins', desc: 'Run your first macro', icon: '🤖', condition: (m) => m.totalMacrosRun >= 1 },
      { id: 'macro_master', name: 'Macro Master', desc: 'Run 50 macros', icon: '⚡', condition: (m) => m.totalMacrosRun >= 50 },
      { id: 'time_saver', name: 'Time Saver', desc: 'Save 1 hour total', icon: '⏰', condition: (m) => m.totalTimeSaved >= 3600 },
      { id: 'super_saver', name: 'Super Saver', desc: 'Save 10 hours total', icon: '🏆', condition: (m) => m.totalTimeSaved >= 36000 },
      { id: 'ai_explorer', name: 'AI Explorer', desc: 'Use AI 10 times', icon: '🧠', condition: (m) => m.totalAiQueries >= 10 },
      { id: 'ai_master', name: 'AI Master', desc: 'Use AI 100 times', icon: '🔮', condition: (m) => m.totalAiQueries >= 100 },
      { id: 'week_streak', name: 'Week Warrior', desc: '7 day streak', icon: '🔥', condition: (m) => m.streakDays >= 7 },
      { id: 'month_streak', name: 'Month Master', desc: '30 day streak', icon: '💎', condition: (m) => m.streakDays >= 30 },
      { id: 'doc_pro', name: 'Document Pro', desc: 'Process 25 documents', icon: '📄', condition: (m) => m.totalDocumentsProcessed >= 25 },
      { id: 'productivity_god', name: 'Productivity God', desc: 'All achievements unlocked', icon: '👑', condition: (m) => this.getAllAchievementCount() >= 11 }
    ];

    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    try {
      await this.loadMetrics();
      this.startSessionTracking();
      this.updateStreak();
      console.log('📊 Productivity Analytics initialized');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  async loadMetrics() {
    try {
      const result = await chrome.storage.local.get(['productivityMetrics']);
      if (result.productivityMetrics) {
        this.metrics.lifetime = { ...this.metrics.lifetime, ...result.productivityMetrics.lifetime };
        this.metrics.goals = { ...this.metrics.goals, ...result.productivityMetrics.goals };
        this.metrics.achievements = result.productivityMetrics.achievements || [];
      } else {
        // First time user
        this.metrics.lifetime.firstUseDate = new Date().toISOString();
        this.metrics.lifetime.totalSessions = 1;
        await this.saveMetrics();
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  async saveMetrics() {
    try {
      await chrome.storage.local.set({
        productivityMetrics: {
          lifetime: this.metrics.lifetime,
          goals: this.metrics.goals,
          achievements: this.metrics.achievements
        }
      });
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  /**
   * Start session tracking
   */
  startSessionTracking() {
    this.metrics.lifetime.totalSessions++;
    this.metrics.lifetime.lastActiveDate = new Date().toISOString().split('T')[0];

    // Auto-save every 30 seconds
    setInterval(() => {
      this.saveMetrics();
    }, 30000);
  }

  /**
   * Update streak calculation
   */
  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.metrics.lifetime.lastActiveDate;

    if (!lastActive) {
      this.metrics.lifetime.streakDays = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, keep streak
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        this.metrics.lifetime.streakDays++;
      } else {
        // Streak broken
        this.metrics.lifetime.streakDays = 1;
      }
    }

    this.metrics.lifetime.lastActiveDate = today;
    this.checkAchievements();
  }

  /**
   * Track form autofill
   * @param {number} fieldsCount - Number of fields filled
   */
  trackFormAutofill(fieldsCount = 1) {
    const timeSaved = this.timeEstimates.formAutofill + (fieldsCount * this.timeEstimates.keystrokeSaved * 10);
    
    this.metrics.session.formsAutofilled++;
    this.metrics.session.timeSaved += timeSaved;
    this.metrics.session.actions++;

    this.metrics.lifetime.totalFormsAutofilled++;
    this.metrics.lifetime.totalTimeSaved += timeSaved;
    this.metrics.lifetime.totalKeystrokes += fieldsCount * 10; // Estimate 10 keystrokes per field

    this.checkAchievements();
    this.emitUpdate();
  }

  /**
   * Track macro run
   * @param {number} stepsCount - Number of steps in macro
   */
  trackMacroRun(stepsCount = 1) {
    const timeSaved = this.timeEstimates.macroRun + (stepsCount * this.timeEstimates.clickSaved);
    
    this.metrics.session.macrosRun++;
    this.metrics.session.timeSaved += timeSaved;
    this.metrics.session.actions++;

    this.metrics.lifetime.totalMacrosRun++;
    this.metrics.lifetime.totalTimeSaved += timeSaved;
    this.metrics.lifetime.totalClicks += stepsCount;

    this.checkAchievements();
    this.emitUpdate();
  }

  /**
   * Track document processing
   * @param {string} docType - Type of document
   * @param {number} pagesCount - Number of pages
   */
  trackDocumentProcessed(docType = 'general', pagesCount = 1) {
    const timeSaved = this.timeEstimates.documentProcess * pagesCount;
    
    this.metrics.session.documentsProcessed++;
    this.metrics.session.timeSaved += timeSaved;
    this.metrics.session.actions++;

    this.metrics.lifetime.totalDocumentsProcessed++;
    this.metrics.lifetime.totalTimeSaved += timeSaved;

    this.checkAchievements();
    this.emitUpdate();
  }

  /**
   * Track AI query
   * @param {string} provider - AI provider used
   * @param {string} queryType - Type of query
   */
  trackAiQuery(provider = 'openai', queryType = 'general') {
    const timeSaved = this.timeEstimates.aiQuery;
    
    this.metrics.session.aiQueriesProcessed++;
    this.metrics.session.timeSaved += timeSaved;
    this.metrics.session.actions++;

    this.metrics.lifetime.totalAiQueries++;
    this.metrics.lifetime.totalTimeSaved += timeSaved;

    this.checkAchievements();
    this.emitUpdate();
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    const newAchievements = [];
    
    for (const achievement of this.achievementDefs) {
      if (!this.metrics.achievements.includes(achievement.id)) {
        if (achievement.condition(this.metrics.lifetime)) {
          this.metrics.achievements.push(achievement.id);
          newAchievements.push(achievement);
        }
      }
    }

    if (newAchievements.length > 0) {
      this.emitAchievements(newAchievements);
    }
  }

  /**
   * Get all achievement count
   */
  getAllAchievementCount() {
    return this.metrics.achievements.length;
  }

  /**
   * Emit update event
   */
  emitUpdate() {
    const event = new CustomEvent('productivityUpdate', {
      detail: this.getDashboardData()
    });
    document.dispatchEvent(event);
  }

  /**
   * Emit achievements event
   */
  emitAchievements(achievements) {
    const event = new CustomEvent('achievementUnlocked', {
      detail: achievements
    });
    document.dispatchEvent(event);

    // Also show notification
    achievements.forEach(a => {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '../icons/icon128.png',
          title: '🏆 Achievement Unlocked!',
          message: `${a.icon} ${a.name}: ${a.desc}`,
          priority: 2
        });
      }
    });
  }

  /**
   * Format time in human readable format
   * @param {number} seconds - Time in seconds
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  /**
   * Get dashboard data for UI
   */
  getDashboardData() {
    const session = this.metrics.session;
    const lifetime = this.metrics.lifetime;
    const goals = this.metrics.goals;

    // Calculate goal progress
    const dailyTimeSavedMins = session.timeSaved / 60;
    const dailyGoalProgress = Math.min((dailyTimeSavedMins / goals.dailyTimeSaved) * 100, 100);

    // Calculate productivity score (0-100)
    const productivityScore = Math.min(
      Math.round(
        (lifetime.totalFormsAutofilled * 2 +
        lifetime.totalMacrosRun * 5 +
        lifetime.totalAiQueries * 3 +
        lifetime.streakDays * 10) / 10
      ),
      100
    );

    // ROI calculation (assuming $50/hour labor cost)
    const hourlyRate = 50;
    const totalROI = (lifetime.totalTimeSaved / 3600) * hourlyRate;

    return {
      session: {
        duration: Date.now() - this.sessionStart,
        timeSaved: session.timeSaved,
        timeSavedFormatted: this.formatTime(session.timeSaved),
        formsAutofilled: session.formsAutofilled,
        macrosRun: session.macrosRun,
        documentsProcessed: session.documentsProcessed,
        aiQueries: session.aiQueriesProcessed,
        actions: session.actions
      },
      lifetime: {
        totalSessions: lifetime.totalSessions,
        totalTimeSaved: lifetime.totalTimeSaved,
        totalTimeSavedFormatted: this.formatTime(lifetime.totalTimeSaved),
        totalFormsAutofilled: lifetime.totalFormsAutofilled,
        totalMacrosRun: lifetime.totalMacrosRun,
        totalDocumentsProcessed: lifetime.totalDocumentsProcessed,
        totalAiQueries: lifetime.totalAiQueries,
        streakDays: lifetime.streakDays,
        firstUseDate: lifetime.firstUseDate,
        daysUsing: lifetime.firstUseDate 
          ? Math.ceil((Date.now() - new Date(lifetime.firstUseDate).getTime()) / (1000 * 60 * 60 * 24))
          : 1
      },
      goals: {
        dailyTimeSaved: goals.dailyTimeSaved,
        dailyProgress: dailyGoalProgress,
        weeklyFormsAutofilled: goals.weeklyFormsAutofilled,
        monthlyMacrosRun: goals.monthlyMacrosRun
      },
      insights: {
        productivityScore,
        totalROI: totalROI.toFixed(2),
        averageTimeSavedPerSession: lifetime.totalSessions > 0 
          ? this.formatTime(lifetime.totalTimeSaved / lifetime.totalSessions)
          : '0s',
        mostProductiveFeature: this.getMostProductiveFeature()
      },
      achievements: {
        unlocked: this.metrics.achievements,
        total: this.achievementDefs.length,
        recent: this.getRecentAchievements(),
        all: this.achievementDefs.map(a => ({
          ...a,
          unlocked: this.metrics.achievements.includes(a.id)
        }))
      }
    };
  }

  /**
   * Get most productive feature
   */
  getMostProductiveFeature() {
    const lifetime = this.metrics.lifetime;
    const features = [
      { name: 'Form Autofill', value: lifetime.totalFormsAutofilled * this.timeEstimates.formAutofill },
      { name: 'Macro Automation', value: lifetime.totalMacrosRun * this.timeEstimates.macroRun },
      { name: 'Document Processing', value: lifetime.totalDocumentsProcessed * this.timeEstimates.documentProcess },
      { name: 'AI Queries', value: lifetime.totalAiQueries * this.timeEstimates.aiQuery }
    ];

    features.sort((a, b) => b.value - a.value);
    return features[0].name;
  }

  /**
   * Get recent achievements
   */
  getRecentAchievements() {
    return this.metrics.achievements.slice(-3).map(id => 
      this.achievementDefs.find(a => a.id === id)
    ).filter(Boolean);
  }

  /**
   * Generate weekly report
   */
  generateWeeklyReport() {
    const data = this.getDashboardData();
    return {
      period: 'weekly',
      generatedAt: new Date().toISOString(),
      summary: {
        timeSaved: data.lifetime.totalTimeSavedFormatted,
        formsAutofilled: data.lifetime.totalFormsAutofilled,
        macrosRun: data.lifetime.totalMacrosRun,
        productivityScore: data.insights.productivityScore,
        roi: `$${data.insights.totalROI}`
      },
      achievements: data.achievements.recent,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate productivity recommendations
   */
  generateRecommendations() {
    const lifetime = this.metrics.lifetime;
    const recommendations = [];

    if (lifetime.totalMacrosRun < 5) {
      recommendations.push({
        icon: '🤖',
        title: 'Try Macro Recording',
        desc: 'Record repetitive tasks to save even more time'
      });
    }

    if (lifetime.totalAiQueries < 10) {
      recommendations.push({
        icon: '🧠',
        title: 'Explore AI Features',
        desc: 'Use AI search and document analysis for faster results'
      });
    }

    if (lifetime.streakDays < 7) {
      recommendations.push({
        icon: '🔥',
        title: 'Build Your Streak',
        desc: 'Use CUBE daily to unlock streak achievements'
      });
    }

    if (lifetime.totalFormsAutofilled > 10 && lifetime.totalMacrosRun < 3) {
      recommendations.push({
        icon: '⚡',
        title: 'Automate Form Filling',
        desc: 'Create macros for forms you fill frequently'
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Update goals
   * @param {Object} newGoals - New goal values
   */
  async updateGoals(newGoals) {
    this.metrics.goals = { ...this.metrics.goals, ...newGoals };
    await this.saveMetrics();
    this.emitUpdate();
  }

  /**
   * Reset session metrics
   */
  resetSession() {
    this.sessionStart = Date.now();
    this.metrics.session = {
      start: this.sessionStart,
      actions: 0,
      timeSaved: 0,
      formsAutofilled: 0,
      macrosRun: 0,
      documentsProcessed: 0,
      aiQueriesProcessed: 0
    };
    this.emitUpdate();
  }

  /**
   * Export analytics data
   */
  exportData() {
    return {
      exportDate: new Date().toISOString(),
      version: '7.0.0',
      metrics: this.metrics,
      dashboardData: this.getDashboardData()
    };
  }
}

// Create singleton instance
if (typeof window !== 'undefined') {
  if (!window.productivityAnalytics) {
    window.productivityAnalytics = new ProductivityAnalytics();
    console.log('📊 Productivity Analytics Service created');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductivityAnalytics;
}
