// Главная игровая логика - расширенная версия с ракетами, бомбами и диагональным взрывом

// Версия игры - менять вручную при каждом изменении!
const GAME_VERSION = '1.1705262030';
const BUILD_DATE = '2026-05-17 20:30';

window.Game = {
    level: null,
    score: 0,
    movesLeft: 0,
    target: 0,
    selected: null,
    board: null,
    hintShown: false,
    
    init() {
        // Скрываем главное меню пока грузимся
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) mainMenu.classList.remove('active');
        
        window.Renderer.init('gameCanvas');
        window.initLevels();
        window.UI.init();
        window.Sound.init();
        window.Music.init();
        
        document.getElementById('gameCanvas').addEventListener('click', (e) => this.onClick(e));
        
        // Показываем версию на главном экране
        const versionEl = document.getElementById('versionDisplay');
        if (versionEl) {
            versionEl.textContent = `Версия ${GAME_VERSION} (${BUILD_DATE})`;
        }
        
        // Загружаем иконки и показываем прогресс
        this.updateLoadingProgress(10, 'Загрузка иконок...');
        preloadIcons().then(() => {
            this.updateLoadingProgress(80, 'Загрузка звуков...');
            setTimeout(() => {
                this.updateLoadingProgress(100, 'Готово!');
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showMainMenu();
                }, 500);
            }, 300);
        });
    },
    
    updateLoadingProgress(percent, text) {
        const bar = document.getElementById('loadingBar');
        const txt = document.getElementById('loadingText');
        if (bar) bar.style.width = percent + '%';
        if (txt) txt.textContent = text;
    },
    
    hideLoadingScreen() {
        const loading = document.getElementById('loadingScreen');
        if (loading) loading.classList.add('hidden');
    },
    
    showMainMenu() {
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) mainMenu.classList.add('active');
    },
    
    vibrate(pattern) {
        // Telegram WebApp HapticFeedback
        try {
            const tg = window.Telegram && window.Telegram.WebApp;
            if (tg && tg.HapticFeedback) {
                const haptic = tg.HapticFeedback;
                // Пробуем разные типы вибрации
                if (typeof pattern === 'number' && pattern > 50) {
                    haptic.impactOccurred('heavy');
                } else if (typeof pattern === 'number') {
                    haptic.impactOccurred('light');
                } else if (Array.isArray(pattern)) {
                    haptic.impactOccurred('medium');
                } else {
                    haptic.selectionChanged();
                }
                return;
            }
        } catch (e) {}
        
        // Fallback: Web Vibration API
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {}
        }
    },
    
    startLevel(levelId) {
        this.level = window.getLevel(levelId);
        this.currentLevel = levelId;
        this.score = 0;
        this.movesLeft = this.level.moves;
        this.target = this.level.target;
        this.selected = null;
        
        // Инициализируем доску
        this.board = this.createBoard(this.level.cols, this.level.rows);
        
        // Проверяем что есть ходы, если нет - перемешиваем
        while (!this.hasValidMoves()) {
            this.shuffleBoard();
        }
        
        // Canvas размер
        const canvas = document.getElementById('gameCanvas');
        const settings = window.Storage.getSettings();
        const size = settings.quality === 'low' ? 270 : 360;
        canvas.width = size;
        canvas.height = size;
        
        window.Renderer.setBoardSize(this.level.cols, this.level.rows, size);
        this.render();
        this.updateUI();
        
        // Запускаем музыку при начале игры
        window.Music.play();
    },
    
    createBoard(cols, rows) {
        const board = [];
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = { type: this.randomCell() };
            }
        }
        // Убираем начальные матчи и квадраты
        this.removeInitialMatches(board, cols, rows);
        return board;
    },
    
    randomCell() {
        const types = ['BERRY', 'MUSHROOM', 'FLOWER', 'MATRYOSHKA', 'BALALAIKA', 'KARAWAY', 'BEAR', 'FOX'];
        return types[Math.floor(Math.random() * types.length)];
    },
    
    removeInitialMatches(board, cols, rows) {
        let iterations = 0;
        const maxIterations = 100; // Защита от бесконечного цикла
        
        do {
            let modified = false;
            
            // Убираем горизонтальные 3 в ряд
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols - 2; c++) {
                    if (board[r] && board[r][c] && board[r][c+1] && board[r][c+2] &&
                        board[r][c].type === board[r][c+1].type && board[r][c].type === board[r][c+2].type) {
                        board[r][c+2].type = this.randomCell();
                        modified = true;
                    }
                }
            }
            
            // Убираем вертикальные 3 в ряд
            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows - 2; r++) {
                    if (board[r] && board[r][c] && board[r+1] && board[r+1][c] && board[r+2] && board[r+2][c] &&
                        board[r][c].type === board[r+1][c].type && board[r][c].type === board[r+2][c].type) {
                        board[r+2][c].type = this.randomCell();
                        modified = true;
                    }
                }
            }
            
            // Убираем квадраты 2x2
            for (let r = 0; r < rows - 1; r++) {
                for (let c = 0; c < cols - 1; c++) {
                    if (!board[r] || !board[r][c] || !board[r][c+1] || !board[r+1] || !board[r+1][c] || !board[r+1][c+1]) continue;
                    const type = board[r][c].type;
                    if (type === board[r][c+1].type && type === board[r+1][c].type && type === board[r+1][c+1].type) {
                        board[r][c+1].type = this.randomCell();
                        modified = true;
                    }
                }
            }
            
            iterations++;
            if (!modified) break; // Нет изменений - можно выходить
            
        } while (iterations < maxIterations);
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
        if (!this.board[row][col]) return;
        
        if (this.selected === null) {
            this.selected = { row, col };
            this.render();
            window.Renderer.drawSelection(row, col);
            window.Sound.play('select');
            this.vibrate(10);
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
        
        // Проверяем Special ДО свопа!
        const sourceSpecial = temp && isSpecialIcon(temp.type) ? temp.type : null;
        const destSpecial = this.board[r2][c2] && isSpecialIcon(this.board[r2][c2].type) ? this.board[r2][c2].type : null;
        
        // Теперь меняем
        this.board[r1][c1] = this.board[r2][c2];
        this.board[r2][c2] = temp;
        
        this.render();
        await this.delay(150);
        
        // Проверяем матчи
        const matches = this.findMatches();
        const squares = this.findSquares();
        
        // Если нет матчей и нет активации специальных иконок - возвращаем обратно
        if (matches.length === 0 && squares.length === 0 && !sourceSpecial && !destSpecial) {
            // Возвращаем обратно
            this.board[r2][c2] = this.board[r1][c1];
            this.board[r1][c1] = temp;
            this.render();
            return;
        }
        
        // Есть матчи!
        this.movesLeft--;
        this.updateUI();
        window.Sound.play('match');
        this.vibrate([30, 20, 30]);
        
        // Если есть специальная иконка - активируем её
        const specialsToActivate = [];
        if (sourceSpecial) {
            // sourceSpecial активируется на позиции r2,c2 (новая позиция после свопа)
            specialsToActivate.push({ row: r2, col: c2, type: sourceSpecial });
        }
        // destSpecial не активируем отдельна - она останется на доске и handleMatches её найдёт и активирует
        if (specialsToActivate.length > 0) {
            window.Sound.play('special');
            this.vibrate([50, 30, 50, 30, 80]);
            await this.activateSpecials(specialsToActivate);
        }
        
        await this.handleMatches(matches, squares);
        
        // Проверяем что есть ходы
        if (!this.hasValidMoves()) {
            await this.doShuffle();
        }
        
        // Проверяем конец игры
        if (this.score >= this.target) {
            window.Sound.play('win');
            this.vibrate([100, 50, 100, 50, 200]);
            // Сохраняем прогресс
            window.Storage.completeLevel(this.currentLevel);
            window.UI.showWinPopup(this.score);
        } else if (this.movesLeft <= 0) {
            window.Sound.play('lose');
            this.vibrate([200, 100, 200]);
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
                if (c < cols && this.board[r][c] && this.board[r][start] && 
                    this.board[r][c].type === this.board[r][start].type && 
                    !isSpecialIcon(this.board[r][c].type)) {
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
                if (r < rows && this.board[r][c] && this.board[start][c] && 
                    this.board[r][c].type === this.board[start][c].type &&
                    !isSpecialIcon(this.board[r][c].type)) {
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
    
    // Найти квадраты 2x2
    findSquares() {
        const squares = [];
        const rows = this.level.rows;
        const cols = this.level.cols;
        
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                if (!this.board[r] || !this.board[r][c] || !this.board[r][c+1] || 
                    !this.board[r+1] || !this.board[r+1][c] || !this.board[r+1][c+1]) continue;
                const type = this.board[r][c].type;
                if (type && !isSpecialIcon(type) &&
                    this.board[r][c+1].type === type &&
                    this.board[r+1][c].type === type &&
                    this.board[r+1][c+1].type === type) {
                    squares.push([
                        { row: r, col: c },
                        { row: r, col: c+1 },
                        { row: r+1, col: c },
                        { row: r+1, col: c+1 }
                    ]);
                }
            }
        }
        return squares;
    },
    
    async handleMatches(matches, squares) {
        // Собираем все клетки для удаления
        const toRemove = new Set();
        const specialsToCreate = [];
        
        // Обычные матчи
        for (const match of matches) {
            for (const cell of match.cells) {
                toRemove.add(`${cell.row},${cell.col}`);
            }
            
            // Создаём специальные иконки
            if (match.length >= 4) {
                const centerCell = match.cells[Math.floor(match.cells.length / 2)];
                if (match.length >= 5) {
                    specialsToCreate.push({ ...centerCell, specialType: 'BOMB' });
                } else if (match.length === 4) {
                    // Ракета - зависит от направления
                    const isHorizontal = match.cells.every(c => c.row === match.cells[0].row);
                    specialsToCreate.push({ ...centerCell, specialType: isHorizontal ? 'ROCKET_H' : 'ROCKET_V' });
                }
            }
        }
        
        // Квадраты - создают диагональную бомбу
        for (const square of squares) {
            for (const cell of square) {
                toRemove.add(`${cell.row},${cell.col}`);
            }
            const center = square[1]; // Верхняя правая клетка квадрата
            specialsToCreate.push({ ...center, specialType: 'DIAGONAL' });
        }
        
        // Удаляем клетки
        const removeList = Array.from(toRemove).map(s => {
            const [r, c] = s.split(',').map(Number);
            return { row: r, col: c };
        });
        
        for (const { row, col } of removeList) {
            const cell = this.board[row][col];
            if (cell && cell.type) {
                const icon = getIcon(cell.type);
                this.score += icon.points || 10;
            }
            this.board[row][col] = null;
        }
        
        this.render();
        this.updateUI();
        await this.delay(200);
        
        // Создаём специальные иконки
        for (const special of specialsToCreate) {
            if (!this.board[special.row][special.col]) {
                this.board[special.row][special.col] = { type: special.specialType };
            }
        }
        
        // Активируем специальные иконки которые были на поле (не созданные только что)
        const specialsToActivate = [];
        for (let r = 0; r < this.level.rows; r++) {
            for (let c = 0; c < this.level.cols; c++) {
                if (this.board[r][c] && isSpecialIcon(this.board[r][c].type)) {
                    // Проверяем что эта иконка не была создана в этом ходу
                    const wasJustCreated = specialsToCreate.some(s => s.row === r && s.col === c);
                    if (!wasJustCreated) {
                        specialsToActivate.push({ row: r, col: c });
                    }
                }
            }
        }
        
        if (specialsToActivate.length > 0) {
            window.Sound.play('special');
            this.vibrate([50, 30, 50, 30, 80]);
            await this.activateSpecials(specialsToActivate);
        }
        
        // Падаем и заполняем
        this.dropAndFill();
        this.render();
        await this.delay(200);
        
        // Проверяем каскад
        const newMatches = this.findMatches();
        const newSquares = this.findSquares();
        if (newMatches.length > 0 || newSquares.length > 0) {
            await this.handleMatches(newMatches, newSquares);
        }
    },
    
    async activateSpecials(specials) {
        const allToRemove = new Set();
        
        for (const special of specials) {
            const row = special.row;
            const col = special.col;
            const type = special.type || (this.board[row][col] && this.board[row][col].type);
            const rows = this.level.rows;
            const cols = this.level.cols;
            
            if (type === 'ROCKET' || type === 'ROCKET_H') {
                // Горизонтальная ракета - взрывает всю строку
                for (let c = 0; c < cols; c++) {
                    allToRemove.add(`${row},${c}`);
                }
                this.score += cols * 10;
            } else if (type === 'ROCKET_V') {
                // Вертикальная ракета - взрывает весь столбец
                for (let r = 0; r < rows; r++) {
                    allToRemove.add(`${r},${col}`);
                }
                this.score += rows * 10;
            } else if (type === 'BOMB') {
                // Бомба взрывает область 3x3
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        if (r >= 0 && r < rows && c >= 0 && c < cols) {
                            allToRemove.add(`${r},${c}`);
                        }
                    }
                }
                this.score += 9 * 15;
            } else if (type === 'DIAGONAL') {
                // Диагональная бомба взрывает по 1 клетке в каждую сторону по диагоналям (всего 4 клетки)
                allToRemove.add(`${row},${col}`); // сама бомба тоже удаляется
                for (let d = 1; d <= 1; d++) {
                    if (row + d >= 0 && row + d < rows && col + d >= 0 && col + d < cols) {
                        allToRemove.add(`${row + d},${col + d}`);
                    }
                    if (row + d >= 0 && row + d < rows && col - d >= 0 && col - d < cols) {
                        allToRemove.add(`${row + d},${col - d}`);
                    }
                    if (row - d >= 0 && row - d < rows && col + d >= 0 && col + d < cols) {
                        allToRemove.add(`${row - d},${col + d}`);
                    }
                    if (row - d >= 0 && row - d < rows && col - d >= 0 && col - d < cols) {
                        allToRemove.add(`${row - d},${col - d}`);
                    }
                }
                this.score += 4 * 10;
            }
        }
        
        // Удаляем все клетки
        const removeList = Array.from(allToRemove).map(s => {
            const [r, c] = s.split(',').map(Number);
            return { row: r, col: c };
        });
        
        for (const { row, col } of removeList) {
            if (this.board[row][col]) {
                const icon = getIcon(this.board[row][col].type);
                if (!isSpecialIcon(this.board[row][col].type)) {
                    this.score += icon.points || 10;
                }
                this.board[row][col] = null;
            }
        }
        
        this.render();
        this.updateUI();
        await this.delay(200);
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
                cells.push({ type: this.randomCell() });
            }
            
            // Кладём обратно снизу вверх
            for (let r = rows - 1; r >= 0; r--) {
                this.board[r][c] = cells[rows - 1 - r];
            }
        }
    },
    
    // Проверить есть ли валидные ходы
    hasValidMoves() {
        const rows = this.level.rows;
        const cols = this.level.cols;
        
        // Проверяем горизонтальные соседства
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                if (this.board[r][c] && this.board[r][c+1]) {
                    // Меняем местами
                    const temp = this.board[r][c];
                    this.board[r][c] = this.board[r][c+1];
                    this.board[r][c+1] = temp;
                    
                    // Проверяем есть ли матч
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    // Возвращаем обратно
                    this.board[r][c+1] = this.board[r][c];
                    this.board[r][c] = temp;
                    
                    if (matches.length > 0 || squares.length > 0) {
                        return true;
                    }
                }
            }
        }
        
        // Проверяем вертикальные соседства
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.board[r][c] && this.board[r+1][c]) {
                    // Меняем местами
                    const temp = this.board[r][c];
                    this.board[r][c] = this.board[r+1][c];
                    this.board[r+1][c] = temp;
                    
                    // Проверяем есть ли матч
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    // Возвращаем обратно
                    this.board[r+1][c] = this.board[r][c];
                    this.board[r][c] = temp;
                    
                    if (matches.length > 0 || squares.length > 0) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    },
    
    // Найти возможный ход (для подсказки)
    // Ищем ходы которые создают 4+ или 2x2 (special icons)
    findHint() {
        const rows = this.level.rows;
        const cols = this.level.cols;
        
        // Проверяем создание special icons (4 в ряд, 5+, 2x2)
        // Сначала горизонтальные
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const cell1 = this.board[r][c];
                const cell2 = this.board[r][c+1];
                if (cell1 && cell2 && !isSpecialIcon(cell1.type) && !isSpecialIcon(cell2.type)) {
                    // Меняем местами
                    this.board[r][c] = cell2;
                    this.board[r][c+1] = cell1;
                    
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    // Возвращаем обратно
                    this.board[r][c] = cell1;
                    this.board[r][c+1] = cell2;
                    
                    // Ищем важные ходы: 4+, 5, или 2x2
                    for (const match of matches) {
                        if (match.length >= 4 || squares.length > 0) {
                            return { row1: r, col1: c, row2: r, col2: c + 1, reason: match.length >= 5 ? 'BOMB' : (match.length >= 4 ? 'ROCKET' : 'SPECIAL') };
                        }
                    }
                    for (const sq of squares) {
                        return { row1: r, col1: c, row2: r, col2: c + 1, reason: 'DIAGONAL' };
                    }
                }
            }
        }
        
        // Проверяем вертикальные
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                const cell1 = this.board[r][c];
                const cell2 = this.board[r+1][c];
                if (cell1 && cell2 && !isSpecialIcon(cell1.type) && !isSpecialIcon(cell2.type)) {
                    // Меняем местами
                    this.board[r][c] = cell2;
                    this.board[r+1][c] = cell1;
                    
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    // Возвращаем обратно
                    this.board[r][c] = cell1;
                    this.board[r+1][c] = cell2;
                    
                    // Ищем важные ходы
                    for (const match of matches) {
                        if (match.length >= 4 || squares.length > 0) {
                            return { row1: r, col1: c, row2: r + 1, col2: c, reason: match.length >= 5 ? 'BOMB' : (match.length >= 4 ? 'ROCKET' : 'SPECIAL') };
                        }
                    }
                    for (const sq of squares) {
                        return { row1: r, col1: c, row2: r + 1, col2: c, reason: 'DIAGONAL' };
                    }
                }
            }
        }
        
        // Если нет special - ищем любой ход с 3+ 
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const cell1 = this.board[r][c];
                const cell2 = this.board[r][c+1];
                if (cell1 && cell2 && !isSpecialIcon(cell1.type) && !isSpecialIcon(cell2.type)) {
                    this.board[r][c] = cell2;
                    this.board[r][c+1] = cell1;
                    
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    this.board[r][c] = cell1;
                    this.board[r][c+1] = cell2;
                    
                    if (matches.length > 0 || squares.length > 0) {
                        return { row1: r, col1: c, row2: r, col2: c + 1, reason: 'MATCH' };
                    }
                }
            }
        }
        
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                const cell1 = this.board[r][c];
                const cell2 = this.board[r+1][c];
                if (cell1 && cell2 && !isSpecialIcon(cell1.type) && !isSpecialIcon(cell2.type)) {
                    this.board[r][c] = cell2;
                    this.board[r+1][c] = cell1;
                    
                    const matches = this.findMatches();
                    const squares = this.findSquares();
                    
                    this.board[r][c] = cell1;
                    this.board[r+1][c] = cell2;
                    
                    if (matches.length > 0 || squares.length > 0) {
                        return { row1: r, col1: c, row2: r + 1, col2: c, reason: 'MATCH' };
                    }
                }
            }
        }
        
        return null;
    },
    
    // Показать подсказку с анимацией
    showHint() {
        // Убираем предыдущую подсказку
        if (this.hintShown) {
            this.render();
            this.hintShown = false;
            return;
        }
        
        const hint = this.findHint();
        if (hint) {
            this.vibrate(50);
            
            // Мигаем подсказкой 3 раза
            let count = 0;
            const flashInterval = setInterval(() => {
                if (count >= 6) {
                    clearInterval(flashInterval);
                    this.hintShown = false;
                    this.render();
                } else {
                    if (count % 2 === 0) {
                        this.render();
                        Renderer.drawHint(hint.row1, hint.col1, hint.row2, hint.col2);
                    } else {
                        this.render();
                    }
                    count++;
                }
            }, 400);
            
            this.hintShown = true;
        }
    },
    shuffleBoard() {
        const rows = this.level.rows;
        const cols = this.level.cols;
        const cells = [];
        
        // Собираем все обычные иконки
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.board[r][c] && !isSpecialIcon(this.board[r][c].type)) {
                    cells.push(this.board[r][c].type);
                }
            }
        }
        
        // Перемешиваем
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }
        
        // Распределяем обратно
        let idx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (this.board[r][c] && !isSpecialIcon(this.board[r][c].type)) {
                    this.board[r][c].type = cells[idx++];
                }
            }
        }
    },
    
    async doShuffle() {
        // Показываем сообщение
        const shuffleMsg = document.getElementById('shuffleMsg');
        if (shuffleMsg) {
            shuffleMsg.classList.add('active');
        }
        window.Sound.play('shuffle');
        this.vibrate([30, 20, 30, 20, 30]);
        
        await this.delay(500);
        
        // Перемешиваем пока не будут доступны ходы
        let attempts = 0;
        do {
            this.shuffleBoard();
            attempts++;
        } while (!this.hasValidMoves() && attempts < 100);
        
        // Если не получилось - создаём новую доску
        if (attempts >= 100) {
            this.board = this.createBoard(this.level.cols, this.level.rows);
        }
        
        this.render();
        
        if (shuffleMsg) {
            shuffleMsg.classList.remove('active');
        }
        
        await this.delay(300);
    },
    
    render() {
        window.Renderer.drawBoard({
            data: this.board,
            rows: this.level.rows,
            cols: this.level.cols,
            getCell: (r, c) => this.board[r] && this.board[r][c] !== null ? 
                { type: this.board[r][c].type, row: r, col: c } : null
        });
    },
    
    updateUI() {
        document.getElementById('levelDisplay').textContent = this.currentLevel || this.level.id;
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('movesDisplay').textContent = this.movesLeft;
        document.getElementById('targetDisplay').textContent = `Цель: ${this.target} очков`;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => window.Game.init());