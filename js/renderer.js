// Отрисовка игры на Canvas

const Renderer = {
    canvas: null,
    ctx: null,
    cellSize: 40,
    boardOffset: { x: 0, y: 0 },

    // Инициализация
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },

    // Установить размер доски
    setBoardSize(cols, rows, canvasSize) {
        this.cellSize = Math.floor(canvasSize / Math.max(cols, rows));
        this.boardOffset = {
            x: (canvasSize - this.cellSize * cols) / 2,
            y: (canvasSize - this.cellSize * rows) / 2
        };
    },

    // Очистить canvas
    clear() {
        this.ctx.fillStyle = '#1a0a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    // Нарисовать доску
    drawBoard(board) {
        this.clear();

        const boardWidth = this.cellSize * board.cols;
        const boardHeight = this.cellSize * board.rows;

        // Рисуем деревянную текстуру доски
        this.drawWoodTexture(boardWidth, boardHeight);

        // Рисуем клетки
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const cell = board.getCell(row, col);
                if (cell) {
                    // Добавляем информацию о специальном типе
                    cell.special = getSpecialType(cell.type);
                    this.drawCell(cell, row, col);
                }
            }
        }
    },

    // Нарисовать текстуру дерева
    drawWoodTexture(boardWidth, boardHeight) {
        // Базовый деревянный цвет
        const gradient = this.ctx.createLinearGradient(
            this.boardOffset.x, this.boardOffset.y,
            this.boardOffset.x + boardWidth, this.boardOffset.y + boardHeight
        );
        gradient.addColorStop(0, '#a0522d');
        gradient.addColorStop(0.5, '#8b4513');
        gradient.addColorStop(1, '#a0522d');

        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = '#5c3d1e';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.roundRect(
            this.boardOffset.x - 5,
            this.boardOffset.y - 5,
            boardWidth + 10,
            boardHeight + 10,
            10
        );
        this.ctx.fill();
        this.ctx.stroke();

        // Линии текстуры дерева (горизонтальные)
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        for (let y = this.boardOffset.y; y < this.boardOffset.y + boardHeight; y += 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardOffset.x, y);
            for (let x = this.boardOffset.x; x < this.boardOffset.x + boardWidth; x += 20) {
                this.ctx.lineTo(x + 10, y);
            }
            this.ctx.stroke();
        }
    },

    // Нарисовать одну клетку
    drawCell(cell, row, col) {
        const x = this.boardOffset.x + col * this.cellSize;
        const y = this.boardOffset.y + row * this.cellSize;
        const size = this.cellSize;
        const padding = 2;

        // Фон клетки
        let bgColor = this.getCellBackground(cell);
        this.ctx.fillStyle = bgColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, 6);
        this.ctx.fill();

        // Рамка
        this.ctx.strokeStyle = '#5c3d1e';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Рисуем иконку
        if (cell.type) {
            this.drawIcon(cell.type, x, y, size);
        }

        // Эффект заморозки
        if (cell.frozen && cell.frozen > 0) {
            this.drawFrozenEffect(x, y, size, cell.frozen);
        }

        // Свечение для специальных иконок
        if (cell.special) {
            this.drawSpecialGlow(x, y, size, cell.special);
        }
    },

    // Получить цвет фона клетки (деревянная текстура)
    getCellBackground(cell) {
        if (cell.frozen && cell.frozen > 0) {
            return '#a8d8ea'; // Ледяной цвет
        }

        switch (cell.special) {
            case 'rocket':
                return 'rgba(255, 215, 0, 0.3)';
            case 'bomb':
                return 'rgba(255, 69, 0, 0.3)';
            case 'star':
                return 'rgba(255, 105, 180, 0.3)';
            default:
                return '#8b5a2b';
        }
    },

    // Нарисовать иконку (картинка с обводкой)
    drawIcon(type, x, y, size) {
        const icon = getIcon(type);
        const img = new Image();
        img.src = icon.image;
        const padding = 2;
        const imgSize = size - padding * 2;
        
        // Рисуем обводку (деревянный цвет)
        this.ctx.strokeStyle = '#5c3d1e';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x + padding, y + padding, imgSize, imgSize, 3);
        this.ctx.stroke();
        
        // Рисуем картинку только когда она загружена, без растягивания
        if (img.complete && img.naturalWidth > 0) {
            // Рисуем картинку в натуральном размере (она может быть меньше клетки)
            this.ctx.drawImage(img, x + padding, y + padding, imgSize, imgSize);
        }
    },

    // Эффект заморозки
    drawFrozenEffect(x, y, size, frozen) {
        const padding = 2;
        this.ctx.save();
        this.ctx.strokeStyle = '#87ceeb';
        this.ctx.lineWidth = 2 + frozen;

        this.ctx.beginPath();
        this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, 6);
        this.ctx.stroke();

        // Снежинка
        this.ctx.font = `${size * 0.3}px "Segoe UI Emoji", sans-serif`;
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('❄️', x + size / 2, y + size / 2);
        this.ctx.restore();
    },

    // Свечение для специальных иконок
    drawSpecialGlow(x, y, size, special) {
        const padding = 2;
        const centerX = x + size / 2;
        const centerY = y + size / 2;

        this.ctx.save();

        let color;
        switch (special) {
            case 'rocket':
                color = 'rgba(255, 215, 0, 0.6)';
                break;
            case 'bomb':
                color = 'rgba(255, 69, 0, 0.6)';
                break;
            case 'star':
                color = 'rgba(255, 255, 0, 0.6)';
                break;
            default:
                color = 'transparent';
        }

        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, 6);
        this.ctx.stroke();

        this.ctx.restore();
    },

    // Анимация выделения
    drawSelection(row, col) {
        const x = this.boardOffset.x + col * this.cellSize;
        const y = this.boardOffset.y + row * this.cellSize;
        const size = this.cellSize;
        const padding = 2;

        this.ctx.save();
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 3]);

        this.ctx.beginPath();
        this.ctx.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, 6);
        this.ctx.stroke();

        this.ctx.restore();
    },

    // Анимация подсказки (возможный ход)
    drawHint(row1, col1, row2, col2) {
        this.drawSelection(row1, col1);
        this.drawSelection(row2, col2);
    },

    // Показать эффект взрыва
    drawExplosion(row, col, color, callback) {
        const x = this.boardOffset.x + col * this.cellSize + this.cellSize / 2;
        const y = this.boardOffset.y + row * this.cellSize + this.cellSize / 2;
        const maxRadius = this.cellSize;
        let radius = 0;
        let alpha = 1;

        const animate = () => {
            this.clear();

            if (Board.data) {
                this.drawBoard(Board);
            }

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            this.ctx.fill();
            this.ctx.restore();

            radius += 3;
            alpha -= 0.05;

            if (alpha > 0 && radius < maxRadius * 1.5) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };

        requestAnimationFrame(animate);
    },

    // Показать текст с очками
    drawScorePopup(row, col, score, textColor = '#ffd700') {
        const x = this.boardOffset.x + col * this.cellSize + this.cellSize / 2;
        const y = this.boardOffset.y + row * this.cellSize;
        let alpha = 1;
        let offsetY = 0;

        const animate = () => {
            this.ctx.save();
            this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = textColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');

            this.ctx.fillText(`+${score}`, x, y + offsetY);
            this.ctx.restore();

            offsetY -= 2;
            alpha -= 0.03;

            if (alpha > 0) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Установить размер canvas
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
};

// Экспорт
window.Renderer = Renderer;