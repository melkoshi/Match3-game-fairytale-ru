// Локальное хранилище для сохранения прогресса игры

const Storage = {
    KEYS: {
        PROGRESS: 'match3_progress',
        SETTINGS: 'match3_settings',
        CURRENT_LEVEL: 'match3_current_level'
    },

    // Получить данные из localStorage
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Storage get error:', e);
            return null;
        }
    },

    // Сохранить данные в localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set error:', e);
            return false;
        }
    },

    // Получить сохранённый прогресс
    getProgress() {
        const data = this.get(this.KEYS.PROGRESS);
        return data || {
            completedLevels: [],
            totalScore: 0,
            gamesPlayed: 0
        };
    },

    // Сохранить прогресс
    saveProgress(progress) {
        return this.set(this.KEYS.PROGRESS, progress);
    },

    // Завершить уровень
    completeLevel(levelId, score) {
        const progress = this.getProgress();

        if (!progress.completedLevels.includes(levelId)) {
            progress.completedLevels.push(levelId);
            progress.totalScore += score;
            progress.gamesPlayed = (progress.gamesPlayed || 0) + 1;

            this.saveProgress(progress);
        }

        return progress;
    },

    // Проверить пройден ли уровень
    isLevelCompleted(levelId) {
        const progress = this.getProgress();
        return progress.completedLevels.includes(levelId);
    },

    // Получить следующий не пройденный уровень
    getNextUncompletedLevel() {
        const progress = this.getProgress();
        for (let i = 1; i <= 15; i++) {
            if (!progress.completedLevels.includes(i)) {
                return i;
            }
        }
        return 15; // Все пройдены
    },

    // Получить настройки
    getSettings() {
        const data = this.get(this.KEYS.SETTINGS);
        return data || {
            sound: true,
            music: true,
            quality: 'high',
            soundVolume: 0.3,
            musicVolume: 0.1
        };
    },

    // Сохранить настройки
    saveSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    // Установить конкретную настройку
    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    },

    // Получить текущий сохранённый уровень (для продолжения)
    getSavedCurrentLevel() {
        return this.get(this.KEYS.CURRENT_LEVEL);
    },

    // Сохранить текущий уровень
    saveCurrentLevel(levelId) {
        return this.set(this.KEYS.CURRENT_LEVEL, levelId);
    },

    // Сбросить весь прогресс
    resetProgress() {
        localStorage.removeItem(this.KEYS.PROGRESS);
        localStorage.removeItem(this.KEYS.CURRENT_LEVEL);
        return true;
    }
};

// Экспорт
window.Storage = Storage;