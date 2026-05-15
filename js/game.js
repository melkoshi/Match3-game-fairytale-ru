// Главная игровая логика - минимальная стабильная версия

window.Game = {
    level: null,
    score: 0,
    movesLeft: 0,
    target: 0,
    selected: null,
    board: null,
    
    init() {
        window.Renderer.init('gameCanvas');
        window.initLevels();
        window.UI.init();
        
        document.getElementById('gameCanvas').addEventListener('click', (e) => this.onClick(e));
    },
    
    startLevel(levelId) {
        this.level = window.getLevel(levelId);
        this.score = 0;
        this.movesLeft = this.level.moves;
        this.target = this.level.target;
        this.selected = null;
        
        // Инициализируем доску
        this.board = this.createBoard(this.level.cols, this.level.rows);
        
        // Canvas размер
        const canvas = document.getElementById('gameCanvas');
        const settings = window.Storage.getSettings();
        const size = settings.quality === 'low' ? 270 : 360;
        canvas.width = size;
        canvas.height = size;
        
        window.Renderer.setBoardSize(this.level.cols, this.level.rows, size);
        this.render();
        this.updateUI();
    },
    
    createBoard(cols, rows) {
        const board = [];
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = this.randomCell();
            }
        }
        // Убираем начальные матчи
        this.removeInitialMatches(board, cols, rows);
        return board;
    },
    
    randomCell() {
        const types = ['BERRY', 'MUSHROOM', 'FLOWER', 'MATRYOSHKA', 'BALALAIKA', 'KARAWAY', 'BEAR', 'FOX'];
        return types[Math.floor(Math.random() * types.length)];
    },
    
    removeInitialMatches(board, cols, rows) {
        // Простая проверка - если есть 3 в ряд, меняем третью клетку
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 2; c++) {
                if (board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2]) {
                    board[r][c+2] = this.randomCell();
                }
            }
        }
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows - 2; r++) {
                if (board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c]) {
                    board[r+2][c] = this.randomCell();
                }
            }
        }
    },
    
    onClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cellSize = window.Renderer.cellSize;
        const offset = window.Renderer.boardOffset;
        
        const col = Math.floor((x - offset.x) / cellSize);
        const row = Math.floor((y - offset.y) / cellSize);
        
        if (row < 0 || row >= this.level.rows || col < 0 || col >= this.level.cols) return;
        
        if (this.selected === null) {
            this.selected = { row, col };
            this.render();
            window.Renderer.drawSelection(row, col);
        } else {
            const dr = Math.abs(row - this.selected.row);
            const dc = Math.abs(col - this.selected.col);
            
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                this.tryMove(this.selected.row, this.selected.col, row, col);
            } else {
                this.selected = { row, col };
                this.render();
                window.Renderer.drawSelection(row, col);
            }
        }
    },
    
    async tryMove(r1, c1, r2, c2) {
        this.selected = null;
        
        // Меняем местами
        const temp = this.board[r1][c1];
        this.board[r1][c1] = this.board[r2][c2];
        this.board[r2][c2] = temp;
        
        this.render();
        await this.delay(150);
        
        // Проверяем матчи
        const matches = this.findMatches();
        
        if (matches.length === 0) {
            // Возвращаем обратно
            this.board[r2][c2] = this.board[r1][c1];
            this.board[r1][c1] = temp;
            this.render();
            return;
        }
        
        // Есть матчи!
        this.movesLeft--;
        this.updateUI();
        
        await this.handleMatches(matches);
        
        // Проверяем конец игры
        if (this.score >= this.target) {
            window.UI.showWinPopup(this.score);
        } else if (this.movesLeft <= 0) {
            window.UI.showLosePopup();
        }
    },
    
    findMatches() {
        const matches = [];
        const rows = this.level.rows;
        const cols = this.level.cols;
        
        // Горизонтальные
        for (let r = 0; r < rows; r++) {
            let start = 0;
            for (let c = 1; c <= cols; c++) {
                if (c < cols && this.board[r][c] === this.board[r][start]) {
                    continue;
                }
                if (c - start >= 3) {
                    const cells = [];
                    for (let i = start; i < c; i++) cells.push({ row: r, col: i });
                    matches.push({ cells, length: c - start });
                }
                start = c;
            }
        }
        
        // Вертикальные
        for (let c = 0; c < cols; c++) {
            let start = 0;
            for (let r = 1; r <= rows; r++) {
                if (r < rows && this.board[r][c] === this.board[start][c]) {
                    continue;
                }
                if (r - start >= 3) {
                    const cells = [];
                    for (let i = start; i < r; i++) cells.push({ row: i, col: c });
                    matches.push({ cells, length: r - start });
                }
                start = r;
            }
        }
        
        return matches;
    },
    
    async handleMatches(matches) {
        // Собираем все клетки для удаления
        const toRemove = [];
        for (const match of matches) {
            for (const cell of match.cells) {
                toRemove.push(`${cell.row},${cell.col}`);
            }
        }
        
        // Уникальные
        const unique = [...new Set(toRemove)].map(s => {
            const [r, c] = s.split(',').map(Number);
            return { row: r, col: c };
        });
        
        // Удаляем и считаем очки
        for (const { row, col } of unique) {
            this.score += 10;
        }
        
        // Удаляем клетки (ставим null)
        for (const { row, col } of unique) {
            this.board[row][col] = null;
        }
        
        this.render();
        this.updateUI();
        await this.delay(200);
        
        // Падаем и заполняем
        this.dropAndFill();
        this.render();
        await this.delay(200);
        
        // Проверяем каскад
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            await this.handleMatches(newMatches);
        }
    },
    
    dropAndFill() {
        const rows = this.level.rows;
        const cols = this.level.cols;
        
        for (let c = 0; c < cols; c++) {
            // Собираем не-null клетки
            const cells = [];
            for (let r = rows - 1; r >= 0; r--) {
                if (this.board[r][c] !== null) {
                    cells.push(this.board[r][c]);
                }
            }
            
            // Заполняем сверху новыми
            const fillCount = rows - cells.length;
            for (let i = 0; i < fillCount; i++) {
                cells.push(this.randomCell());
            }
            
            // Кладём обратно снизу вверх
            for (let r = rows - 1; r >= 0; r--) {
                this.board[r][c] = cells[rows - 1 - r];
            }
        }
    },
    
    render() {
        window.Renderer.drawBoard({
            data: this.board,
            rows: this.level.rows,
            cols: this.level.cols,
            getCell: (r, c) => this.board[r] && this.board[r][c] !== null ? 
                { type: this.board[r][c], row: r, col: c } : null
        });
    },
    
    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('movesDisplay').textContent = this.movesLeft;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => window.Game.init());