// Главная игровая логика - исправленная версия

const Game = {
    currentLevel: 1,
    score: 0,
    moves: 0,
    target: 0,
    isPlaying: false,
    selectedCell: null,

    init() {
        Renderer.init('gameCanvas');
        initLevels();
        UI.init();
        this.setupCanvasEvents();
    },

    setupCanvasEvents() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    },

    startLevel(levelId) {
        this.currentLevel = levelId;
        this.levelConfig = getLevel(levelId);
        this.score = 0;
        this.moves = this.levelConfig.moves;
        this.target = this.levelConfig.target;
        this.isPlaying = true;
        this.selectedCell = null;

        Board.init(this.levelConfig.cols, this.levelConfig.rows);

        const canvas = document.getElementById('gameCanvas');
        const settings = Storage.getSettings();
        const size = settings.quality === 'low' ? 270 : 360;
        canvas.width = size;
        canvas.height = size;

        Renderer.setBoardSize(this.levelConfig.cols, this.levelConfig.rows, size);
        Renderer.drawBoard(Board);
        UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);
        Storage.saveCurrentLevel(levelId);
    },

    handleCanvasClick(e) {
        if (!this.isPlaying) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor((x - Renderer.boardOffset.x) / Renderer.cellSize);
        const row = Math.floor((y - Renderer.boardOffset.y) / Renderer.cellSize);

        if (row < 0 || row >= Board.rows || col < 0 || col >= Board.cols) return;

        const cell = Board.getCell(row, col);
        if (!cell) return;

        if (!this.selectedCell) {
            this.selectedCell = { row, col };
            Renderer.drawBoard(Board);
            Renderer.drawSelection(row, col);
        } else {
            const dr = Math.abs(row - this.selectedCell.row);
            const dc = Math.abs(col - this.selectedCell.col);

            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                this.trySwap(this.selectedCell.row, this.selectedCell.col, row, col);
            } else if (row === this.selectedCell.row && col === this.selectedCell.col) {
                this.selectedCell = null;
                Renderer.drawBoard(Board);
            } else {
                this.selectedCell = { row, col };
                Renderer.drawBoard(Board);
                Renderer.drawSelection(row, col);
            }
        }
    },

    async trySwap(row1, col1, row2, col2) {
        this.isPlaying = false;
        this.selectedCell = null;

        Board.swap(row1, col1, row2, col2);
        Renderer.drawBoard(Board);

        await this.delay(200);

        const matches = Board.findMatches();

        if (matches.length === 0) {
            Board.swap(row1, col1, row2, col2);
            Renderer.drawBoard(Board);
            this.isPlaying = true;
            return;
        }

        this.moves--;
        UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);

        await this.processMatches();

        if (this.moves <= 0 && this.score < this.target) {
            UI.showLosePopup();
        } else if (this.score >= this.target) {
            Storage.completeLevel(this.currentLevel, this.score);
            UI.showWinPopup(this.score);
        } else {
            this.isPlaying = true;
        }
    },

    async processMatches() {
        let matches = Board.findMatches();
        let loopSafety = 0;
        const maxLoops = 100;

        while (matches.length > 0 && loopSafety < maxLoops) {
            loopSafety++;

            let cellsToRemove = [];
            let specialCells = [];

            for (const match of matches) {
                const result = Board.processMatches(match);
                cellsToRemove = cellsToRemove.concat(result.cellsToRemove);
                specialCells = specialCells.concat(result.specialCreated);
            }

            const uniqueCells = [];
            const seen = new Set();
            for (const cell of cellsToRemove) {
                const key = `${cell.row},${cell.col}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueCells.push(cell);
                }
            }

            for (const cell of uniqueCells) {
                const removed = Board.getCell(cell.row, cell.col);
                if (removed && removed.type) {
                    const icon = getIcon(removed.type);
                    this.score += icon.points || 10;
                }
            }

            Board.removeCells(uniqueCells);
            Renderer.drawBoard(Board);
            await this.delay(200);

            Board.dropCells();
            Renderer.drawBoard(Board);
            await this.delay(200);

            UI.updateGameDisplay(this.currentLevel, this.score, this.moves, this.target);

            matches = Board.findMatches();
        }

        if (!Board.hasValidMoves()) {
            Board.init(this.levelConfig.cols, this.levelConfig.rows);
            Renderer.drawBoard(Board);
        }
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => Game.init());
window.Game = Game;