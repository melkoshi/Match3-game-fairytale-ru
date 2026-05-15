// Главная игровая логика

const Game = {
    currentLevel: 1,
    score: 0,
    moves: 0,
    target: 0,
    isPlaying: false,
    isAnimating: false,
    selectedCell: null,
    board: null,
    levelConfig: null,

    // Активные анимации для отмены
    activeAnimations: [],

    // Инициализация игры
    init() {
        Renderer.init('gameCanvas');
        initLevels();
        UI.init();
        this.setupCanvasEvents();
    },

    // Настройка событий canvas
    setupCanvasEvents() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    },

    // Начать уровень
    startLevel(levelId) {
        this.currentLevel = levelId;
        this.levelConfig = getLevel(levelId);
        this.score = 0;
        this.moves = this.levelConfig.moves;
        this.target = this.levelConfig.target;
        this.isPlaying = true;
        this.isAnimating = false;
        this.selectedCell = null;

        // Отменяем все активные анимации
        this.cancelAllAnimations();

        // Инициализируем доску
        Board.init(this.levelConfig.cols, this.levelConfig.rows);

        // Устанавливаем размер canvas
        const canvas = document.getElementById('gameCanvas');
        const settings = Storage.getSettings();
        const size = settings.quality === 'low' ? 270 : 360;
        canvas.width = size;
        canvas.height = size;

        Renderer.setBoardSize(this.levelConfig.cols, this.levelConfig.rows, size);
        Renderer.drawBoard(Board);

        // Обновляем UI
        UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);

        // Сохраняем текущий уровень
        Storage.saveCurrentLevel(levelId);
    },

    // Отменить все активные анимации
    cancelAllAnimations() {
        this.activeAnimations.forEach(animId => {
            cancelAnimationFrame(animId);
        });
        this.activeAnimations = [];
    },

    // Зарегистрировать анимацию
    registerAnimation(animId) {
        this.activeAnimations.push(animId);
    },

    // Обработка клика по canvas
    handleCanvasClick(e) {
        if (!this.isPlaying || this.isAnimating) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Вычисляем клетку
        const col = Math.floor((x - Renderer.boardOffset.x) / Renderer.cellSize);
        const row = Math.floor((y - Renderer.boardOffset.y) / Renderer.cellSize);

        // Проверяем границы
        if (row < 0 || row >= Board.rows || col < 0 || col >= Board.cols) return;

        const clickedCell = Board.getCell(row, col);
        if (!clickedCell) return;

        // Если нет выбранной клетки - выбираем
        if (!this.selectedCell) {
            this.selectedCell = { row, col };
            Renderer.drawBoard(Board);
            Renderer.drawSelection(row, col);
            return;
        }

        // Проверяем является ли кликнутая клетка соседней
        const dr = Math.abs(row - this.selectedCell.row);
        const dc = Math.abs(col - this.selectedCell.col);

        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
            // Пробуем сделать ход
            this.makeMove(this.selectedCell.row, this.selectedCell.col, row, col);
        } else if (row === this.selectedCell.row && col === this.selectedCell.col) {
            // Кликнули на ту же клетку - снимаем выделение
            this.selectedCell = null;
            Renderer.drawBoard(Board);
        } else {
            // Выбираем новую клетку
            this.selectedCell = { row, col };
            Renderer.drawBoard(Board);
            Renderer.drawSelection(row, col);
        }
    },

    // Сделать ход
    async makeMove(row1, col1, row2, col2) {
        this.isAnimating = true;
        this.selectedCell = null;

        // Меняем клетки местами
        Board.swap(row1, col1, row2, col2);

        // Проверяем матчи
        const matches = Board.findMatches();

        if (matches.length === 0) {
            // Нет матчей - возвращаем обратно
            await this.animateSwap(row1, col1, row2, col2, true);
            Board.swap(row1, col1, row2, col2);
            Renderer.drawBoard(Board);
            this.isAnimating = false;
            return;
        }

        // Есть матчи!
        await this.animateSwap(row1, col1, row2, col2, false);

        // Уменьшаем ходы
        this.moves--;
        UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);

        // Обрабатываем матчи
        await this.processMatchesLoop();

        // Проверяем условия победы/поражения
        this.checkGameEnd();

        this.isAnimating = false;
    },

    // Анимация обмена
    animateSwap(row1, col1, row2, col2, reverse) {
        return new Promise(resolve => {
            Renderer.drawBoard(Board);
            setTimeout(resolve, 200);
        });
    },

    // Цикл обработки матчей
    async processMatchesLoop() {
        let matches = Board.findMatches();

        while (matches.length > 0) {
            // Собираем все клетки для удаления и создаём специальные иконки
            let allCellsToRemove = [];
            let specialCells = [];

            for (const match of matches) {
                const result = Board.processMatches(match);
                allCellsToRemove.push(...result.cellsToRemove);

                for (const special of result.specialCreated) {
                    specialCells.push(special);
                }
            }

            // Дедуплицируем клетки для удаления (SET'ом)
            const uniqueCells = [];
            const seen = new Set();
            for (const cell of allCellsToRemove) {
                const key = `${cell.row},${cell.col}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueCells.push(cell);
                }
            }

            // Удаляем клетки
            Board.removeCells(uniqueCells);
            Renderer.drawBoard(Board);

            // Просто показываем очки без анимации (чтобы не было конфликтов)
            for (const cell of uniqueCells) {
                // ничего не делаем - визуально клетки уже исчезли
            }

            // Перерисовываем и ждём
            await this.delay(150);

            // Сдвигаем клетки вниз и заполняем сверху
            Board.dropCells();
            Renderer.drawBoard(Board);
            await this.delay(150);

            // Обновляем счёт
            UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);

            // Проверяем новые матчи
            matches = Board.findMatches();
        }

        // Проверяем возможность хода
        if (!Board.hasValidMoves()) {
            Board.init(this.levelConfig.cols, this.levelConfig.rows);
            Renderer.drawBoard(Board);
        }
    },

    // Проверить конец игры
    checkGameEnd() {
        if (this.score >= this.target) {
            this.isPlaying = false;
            Storage.completeLevel(this.currentLevel, this.score);
            UI.showWinPopup(this.score);
        } else if (this.moves <= 0) {
            this.isPlaying = false;
            UI.showLosePopup();
        }
    },

    // Пауза
    pause() {
        this.isPlaying = false;
    },

    // Возобновить
    resume() {
        this.isPlaying = true;
    },

    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => Game.init());

// Экспорт
window.Game = Game;