// UI управление - меню, экраны, навигация

const UI = {
    currentScreen: 'mainMenu',
    selectedLevel: null,

    // Инициализация UI
    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateContinueButton();
    },

    // Привязка событий
    bindEvents() {
        // Главное меню
        document.getElementById('playBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showScreen('settingsScreen'));

        // Уровни
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('levelsGrid').addEventListener('click', (e) => this.handleLevelClick(e));

        // Настройки
        document.getElementById('settingsBack').addEventListener('click', () => this.showScreen('mainMenu'));
        document.querySelectorAll('[data-setting]').forEach(btn => {
            btn.addEventListener('click', () => this.handleSettingClick(btn));
        });
        document.getElementById('resetProgress').addEventListener('click', () => this.resetProgress());

        // Шапка
        document.getElementById('menuBtn').addEventListener('click', () => this.showScreen('settingsScreen'));
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());

        // Попапы
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('winMenuBtn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('retryBtn').addEventListener('click', () => this.retryLevel());
        document.getElementById('loseMenuBtn').addEventListener('click', () => this.returnToMenu());
    },

    // Показать экран
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        // Обновляем кнопку назад
        const backBtn = document.getElementById('backBtn');
        backBtn.style.display = screenId === 'mainMenu' ? 'none' : 'block';

        // Обновляем заголовок
        const title = document.querySelector('.header h1');
        switch (screenId) {
            case 'levelSelect':
                title.textContent = '🍓 Выбор Уровня';
                this.renderLevels();
                break;
            case 'settingsScreen':
                title.textContent = '⚙️ Настройки';
                break;
            case 'gameScreen':
                title.textContent = `🍓 Уровень ${Game.currentLevel}`;
                break;
            default:
                title.textContent = '🍓 Летняя Сказка';
        }
    },

    // Показать выбор уровня
    showLevelSelect() {
        this.showScreen('levelSelect');
    },

    // Рендер кнопок уровней
    renderLevels() {
        const grid = document.getElementById('levelsGrid');
        grid.innerHTML = '';

        const progress = Storage.getProgress();

        for (let i = 1; i <= 15; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.dataset.level = i;
            btn.textContent = i;

            if (progress.completedLevels.includes(i)) {
                btn.classList.add('completed');
            }

            // Разблокируем следующий уровень после текущего
            if (i === 1 || progress.completedLevels.includes(i - 1)) {
                btn.disabled = false;
                if (i === Storage.getNextUncompletedLevel()) {
                    btn.classList.add('current');
                }
            } else {
                btn.disabled = true;
            }

            grid.appendChild(btn);
        }
    },

    // Обработать клик по уровню
    handleLevelClick(e) {
        if (e.target.classList.contains('level-btn') && !e.target.disabled) {
            const levelId = parseInt(e.target.dataset.level);
            this.startLevel(levelId);
        }
    },

    // Начать уровень
    startLevel(levelId) {
        this.selectedLevel = levelId;
        Game.startLevel(levelId);
        this.showScreen('gameScreen');
    },

    // Продолжить игру
    continueGame() {
        const savedLevel = Storage.getSavedCurrentLevel();
        if (savedLevel) {
            this.startLevel(savedLevel);
        } else {
            this.startLevel(Storage.getNextUncompletedLevel());
        }
    },

    // Загрузить настройки
    loadSettings() {
        const settings = Storage.getSettings();

        // Звук
        this.updateSettingButtons('sound', settings.sound ? 'on' : 'off');
        window.Sound.setEnabled(settings.sound);

        // Качество
        this.updateSettingButtons('quality', settings.quality);

        // Музыка
        this.updateSettingButtons('music', settings.music ? 'on' : 'off');
    },

    // Обновить кнопки настроек
    updateSettingButtons(setting, value) {
        document.querySelectorAll(`[data-setting="${setting}"]`).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === value);
        });
    },

    // Обработать клик по настройке
    handleSettingClick(btn) {
        const setting = btn.dataset.setting;
        const value = btn.dataset.value;

        // Определяем тип значения
        let actualValue = value;
        if (value === 'on' || value === 'off') {
            actualValue = value === 'on';
        }

        Storage.setSetting(setting, actualValue);
        this.updateSettingButtons(setting, value);

        // Применяем настройки
        if (setting === 'quality') {
            this.applyQualitySetting(value);
        } else if (setting === 'sound') {
            window.Sound.setEnabled(actualValue);
        }
    },

    // Применить настройку качества
    applyQualitySetting(quality) {
        const canvas = document.getElementById('gameCanvas');
        if (quality === 'low') {
            canvas.width = 270;
            canvas.height = 270;
        } else {
            canvas.width = 360;
            canvas.height = 360;
        }
    },

    // Сбросить прогресс
    resetProgress() {
        if (confirm('Вы уверены? Весь прогресс будет удалён!')) {
            Storage.resetProgress();
            this.renderLevels();
            this.updateContinueButton();
            alert('Прогресс сброшен!');
        }
    },

    // Вернуться назад
    goBack() {
        switch (this.currentScreen) {
            case 'levelSelect':
            case 'settingsScreen':
                this.showScreen('mainMenu');
                break;
            case 'gameScreen':
                if (confirm('Вернуться в меню? Прогресс уровня не сохранится.')) {
                    this.showScreen('mainMenu');
                }
                break;
        }
    },

    // Обновить кнопку "Продолжить"
    updateContinueButton() {
        const btn = document.getElementById('continueBtn');
        const savedLevel = Storage.getSavedCurrentLevel();
        btn.style.display = savedLevel ? 'block' : 'none';
    },

    // Показать победу
    showWinPopup(score) {
        document.getElementById('winText').textContent = `Очки: ${score}`;
        document.getElementById('winPopup').classList.add('active');
    },

    // Скрыть победу
    hideWinPopup() {
        document.getElementById('winPopup').classList.remove('active');
    },

    // Показать поражение
    showLosePopup() {
        document.getElementById('losePopup').classList.add('active');
    },

    // Скрыть поражение
    hideLosePopup() {
        document.getElementById('losePopup').classList.remove('active');
    },

    // Следующий уровень
    nextLevel() {
        this.hideWinPopup();
        const nextLevel = this.selectedLevel + 1;
        if (nextLevel <= 15) {
            this.startLevel(nextLevel);
        } else {
            alert('Поздравляем! Ты прошёл все уровни!');
            this.showScreen('mainMenu');
        }
    },

    // Заново
    retryLevel() {
        this.hideLosePopup();
        this.startLevel(this.selectedLevel);
    },

    // Вернуться в меню
    returnToMenu() {
        this.hideWinPopup();
        this.hideLosePopup();
        this.showScreen('mainMenu');
    },

    // Обновить отображение игры
    updateGameDisplay(level, score, moves, target) {
        document.getElementById('levelDisplay').textContent = level;
        document.getElementById('scoreDisplay').textContent = score;
        document.getElementById('movesDisplay').textContent = moves;
        document.getElementById('targetDisplay').textContent = `Цель: ${target} очков`;
    }
};

// Экспорт
window.UI = UI;