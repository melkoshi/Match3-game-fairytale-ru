// Генерация и определение уровней

const LEVELS = [];

// Инициализация уровней
function initLevels() {
    // Уровни 1-15 с прогрессирующей сложностью (ходы: 12, 14, 16, 18...)
    const levelConfigs = [
        { id: 1, cols: 6, rows: 6, moves: 12, target: 300, name: 'Луг' },
        { id: 2, cols: 6, rows: 6, moves: 14, target: 400, name: 'Опушка' },
        { id: 3, cols: 7, rows: 6, moves: 16, target: 500, name: 'Лес' },
        { id: 4, cols: 7, rows: 7, moves: 18, target: 600, name: 'Тропинка' },
        { id: 5, cols: 7, rows: 7, moves: 20, target: 750, name: 'Ручей' },
        { id: 6, cols: 7, rows: 7, moves: 22, target: 900, name: 'Мост' },
        { id: 7, cols: 8, rows: 7, moves: 24, target: 1050, name: 'Поляна' },
        { id: 8, cols: 8, rows: 7, moves: 26, target: 1200, name: 'Цветник' },
        { id: 9, cols: 8, rows: 8, moves: 28, target: 1400, name: 'Ягодник' },
        { id: 10, cols: 8, rows: 8, moves: 30, target: 1600, name: 'Грибное место' },
        { id: 11, cols: 8, rows: 8, moves: 32, target: 1850, name: 'Древний дуб' },
        { id: 12, cols: 9, rows: 8, moves: 34, target: 2100, name: 'Берёзовая роща' },
        { id: 13, cols: 9, rows: 8, moves: 36, target: 2400, name: 'Кедровый бор' },
        { id: 14, cols: 9, rows: 9, moves: 38, target: 2750, name: 'Верхушка горы' },
        { id: 15, cols: 9, rows: 9, moves: 40, target: 3000, name: 'Царство Лесовика' }
    ];

    for (const config of levelConfigs) {
        LEVELS.push({
            ...config,
            getDescription: function() {
                return `${this.name}\nЦель: ${this.target} очков\nХоды: ${this.moves}\nПоле: ${this.cols}x${this.rows}`;
            }
        });
    }
}

// Получить уровень по ID
function getLevel(levelId) {
    return LEVELS.find(l => l.id === levelId) || LEVELS[0];
}

// Создать случайную доску для уровня
function generateBoard(cols, rows) {
    const board = [];

    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            let iconType;
            do {
                iconType = getRandomIcon();
            } while (wouldMatch(col, row, board, iconType, cols, rows));

            board[row][col] = {
                type: iconType,
                row: row,
                col: col,
                frozen: 0, // Количество заморозок
                special: null // 'rocket', 'bomb', 'star'
            };
        }
    }

    return board;
}

// Проверить создаст ли иконка мгновенный матч
function wouldMatch(col, row, board, iconType, cols, rows) {
    // Проверяем горизонталь
    let horizontalCount = 1;
    if (col >= 1 && board[row][col - 1] && board[row][col - 1].type === iconType) {
        horizontalCount++;
        if (col >= 2 && board[row][col - 2] && board[row][col - 2].type === iconType) {
            horizontalCount++;
        }
    }
    if (horizontalCount >= 3) return true;

    // Проверяем вертикаль
    let verticalCount = 1;
    if (row >= 1 && board[row - 1] && board[row - 1][col] && board[row - 1][col].type === iconType) {
        verticalCount++;
        if (row >= 2 && board[row - 2] && board[row - 2][col] && board[row - 2][col].type === iconType) {
            verticalCount++;
        }
    }
    if (verticalCount >= 3) return true;

    return false;
}

// Генерация уровня с гарантированным первым матчем
function generatePlayableBoard(cols, rows) {
    let board;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        board = generateBoard(cols, rows);
        attempts++;
    } while (!hasValidMoves(board, cols, rows) && attempts < maxAttempts);

    // Если не получилось создать играемую доску, делаем одну искусственную
    if (attempts >= maxAttempts) {
        board = forceValidBoard(cols, rows);
    }

    return board;
}

// Проверить есть ли у игрока возможные ходы
function hasValidMoves(board, cols, rows) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Попробуем поменять с правым соседом
            if (col < cols - 1) {
                const testBoard = copyBoard(board);
                swapCells(testBoard, row, col, row, col + 1);
                if (findMatches(testBoard, cols, rows).length > 0) {
                    return true;
                }
            }
            // Попробуем поменять с нижним соседом
            if (row < rows - 1) {
                const testBoard = copyBoard(board);
                swapCells(testBoard, row, col, row + 1, col);
                if (findMatches(testBoard, cols, rows).length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Создать гарантированно играемую доску
function forceValidBoard(cols, rows) {
    const board = generateBoard(cols, rows);

    // Найдём позицию и создадим там матч
    const midRow = Math.floor(rows / 2);
    const midCol = Math.floor(cols / 2);

    const iconType = getRandomIcon();
    board[midRow][midCol].type = iconType;
    board[midRow][midCol - 1].type = iconType;
    board[midRow][midCol - 2].type = iconType;

    return board;
}

// Копировать доску
function copyBoard(board) {
    return board.map(row => row.map(cell => ({ ...cell })));
}

// Поменять две клетки местами
function swapCells(board, row1, col1, row2, col2) {
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
}

// Найти все матчи на доске
function findMatches(board, cols, rows) {
    const matches = [];
    const matched = new Set();

    // Горизонтальные матчи
    for (let row = 0; row < rows; row++) {
        let col = 0;
        while (col < cols - 2) {
            const type = board[row][col].type;
            if (!type) {
                col++;
                continue;
            }

            let matchLength = 1;
            while (col + matchLength < cols && board[row][col + matchLength].type === type) {
                matchLength++;
            }

            if (matchLength >= 3) {
                const match = {
                    cells: [],
                    length: matchLength,
                    direction: 'horizontal'
                };
                for (let i = 0; i < matchLength; i++) {
                    const key = `${row},${col + i}`;
                    if (!matched.has(key)) {
                        match.cells.push({ row, col: col + i });
                        matched.add(key);
                    }
                }
                if (match.cells.length > 0) {
                    matches.push(match);
                }
                col += matchLength; // Move past the entire match
            } else {
                col++;
            }
        }
    }

    // Вертикальные матчи
    for (let col = 0; col < cols; col++) {
        let row = 0;
        while (row < rows - 2) {
            const type = board[row][col].type;
            if (!type) {
                row++;
                continue;
            }

            let matchLength = 1;
            while (row + matchLength < rows && board[row + matchLength][col].type === type) {
                matchLength++;
            }

            if (matchLength >= 3) {
                const match = {
                    cells: [],
                    length: matchLength,
                    direction: 'vertical'
                };
                for (let i = 0; i < matchLength; i++) {
                    const key = `${row + i},${col}`;
                    if (!matched.has(key)) {
                        match.cells.push({ row: row + i, col });
                        matched.add(key);
                    }
                }
                if (match.cells.length > 0) {
                    matches.push(match);
                }
                row += matchLength; // Move past the entire match
            } else {
                row++;
            }
        }
    }

    return matches;
}

// Экспорт
window.LEVELS = LEVELS;
window.initLevels = initLevels;
window.getLevel = getLevel;
window.generateBoard = generateBoard;
window.generatePlayableBoard = generatePlayableBoard;
window.hasValidMoves = hasValidMoves;
window.findMatches = findMatches;
window.swapCells = swapCells;
window.copyBoard = copyBoard;