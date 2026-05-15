// Игровая доска и логика матчей

const Board = {
    data: null,
    cols: 6,
    rows: 6,

    // Инициализация доски
    init(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.data = generatePlayableBoard(cols, rows);
    },

    // Получить клетку
    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.data[row][col];
    },

    // Установить клетку
    setCell(row, col, cell) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.data[row][col] = cell;
        }
    },

    // Поменять две клетки местами (с анимацией возврата если нет матча)
    swap(row1, col1, row2, col2) {
        const cell1 = this.getCell(row1, col1);
        const cell2 = this.getCell(row2, col2);

        if (!cell1 || !cell2) return false;

        this.data[row1][col1] = cell2;
        this.data[row2][col2] = cell1;

        cell1.row = row2;
        cell1.col = col2;
        cell2.row = row1;
        cell2.col = col1;

        return true;
    },

    // Найти все матчи
    findMatches() {
        return findMatches(this.data, this.cols, this.rows);
    },

    // Обработать матчи и создать специальные иконки
    processMatches(matches) {
        const specialCreated = [];
        const cellsToRemove = [];

        for (const match of matches) {
            // Определяем какую специальную иконку создать
            if (match.length >= 5) {
                // 5+ создаёт звезду
                const center = match.cells[Math.floor(match.cells.length / 2)];
                this.data[center.row][center.col] = {
                    type: 'STAR',
                    row: center.row,
                    col: center.col,
                    special: 'star'
                };
                specialCreated.push({ row: center.row, col: center.col, type: 'STAR' });
            } else if (match.length === 4) {
                // 4 создаёт ракету
                const center = match.cells[Math.floor(match.cells.length / 2)];
                const dir = match.direction === 'horizontal' ? 'vertical' : 'horizontal';
                this.data[center.row][center.col] = {
                    type: 'ROCKET',
                    row: center.row,
                    col: center.col,
                    special: 'rocket',
                    direction: dir
                };
                specialCreated.push({ row: center.row, col: center.col, type: 'ROCKET' });
            }

            // Добавляем ВСЕ клетки матча в удаление (кроме центра специальных)
            for (const cell of match.cells) {
                const isSpecial = specialCreated.some(s => s.row === cell.row && s.col === cell.col);
                if (!isSpecial) {
                    cellsToRemove.push(cell);
                }
            }
        }

        return {
            cellsToRemove,
            specialCreated
        };
    },

    // Удалить клетки и сдвинуть вниз
    removeCells(cells) {
        const removed = [];

        for (const { row, col } of cells) {
            if (this.data[row] && this.data[row][col]) {
                removed.push(this.data[row][col]);
                this.data[row][col] = null;
            }
        }

        return removed;
    },

    // Сдвинуть клетки вниз и заполнить сверху
    dropCells() {
        const drops = [];

        for (let col = 0; col < this.cols; col++) {
            let writeRow = this.rows - 1;

            // Сдвигаем существующие клетки вниз
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.data[row][col] !== null) {
                    if (row !== writeRow) {
                        this.data[writeRow][col] = this.data[row][col];
                        this.data[writeRow][col].row = writeRow;
                        this.data[row][col] = null;
                        drops.push({ fromRow: row, toRow: writeRow, col });
                    }
                    writeRow--;
                }
            }

            // Заполняем пустые места сверху
            for (let row = writeRow; row >= 0; row--) {
                this.data[row][col] = {
                    type: getRandomIcon(),
                    row: row,
                    col: col,
                    special: null,
                    fresh: true
                };
                drops.push({ fromRow: -1, toRow: row, col });
            }
        }

        return drops;
    },

    // Активировать специальную способность
    activateSpecial(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || !cell.special) return { cells: [], score: 0 };

        const cells = [];
        let score = 0;

        if (cell.special === 'rocket') {
            // Ракета сбивает строку или столбец
            const dir = cell.direction || 'vertical';
            if (dir === 'horizontal') {
                for (let c = 0; c < this.cols; c++) {
                    cells.push({ row, col: c });
                    score += 20;
                }
            } else {
                for (let r = 0; r < this.rows; r++) {
                    cells.push({ row: r, col });
                    score += 20;
                }
            }
        } else if (cell.special === 'bomb') {
            // Бомба взрывает область 3x3
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                        cells.push({ row: r, col: c });
                        score += 15;
                    }
                }
            }
        } else if (cell.special === 'star') {
            // Звезда взрывает все клетки того же типа
            const type = cell.type;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.data[r][c] && this.data[r][c].type === type) {
                        cells.push({ row: r, col: c });
                        score += 25;
                    }
                }
            }
        }

        return { cells, score };
    },

    // Проверить есть ли возможные ходы
    hasValidMoves() {
        return hasValidMoves(this.data, this.cols, this.rows);
    },

    // Печать для отладки
    print() {
        let str = '';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.data[row][col];
                str += (cell ? getEmoji(cell.type) : '.') + ' ';
            }
            str += '\n';
        }
        console.log(str);
    }
};

// Экспорт
window.Board = Board;