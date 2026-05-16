// Игровая доска - упрощённая версия

const Board = {
    data: null,
    rows: 6,
    cols: 6,
    
    init(rows, cols) {
        this.rows = rows;
        this.cols = cols;
    }
};

window.Board = Board;