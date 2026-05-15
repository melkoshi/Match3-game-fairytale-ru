// Древнерусские иконки для игры Match-3

const ICONS = {
    // Основные иконки (обычные)
    BERRY: { emoji: '🍓', name: 'Ягода', color: '#ff6b6b', points: 10 },
    MUSHROOM: { emoji: '🍄', name: 'Гриб', color: '#c9a959', points: 10 },
    FLOWER: { emoji: '🌸', name: 'Цветок', color: '#ff9ff3', points: 10 },
    MATRYOSHKA: { emoji: '🪆', name: 'Матрёшка', color: '#ee5a5a', points: 10 },
    BALALAIKA: { emoji: '🎸', name: 'Балалайка', color: '#8b5a2b', points: 10 },
    KARAWAY: { emoji: '🍞', name: 'Каравай', color: '#f4a460', points: 10 },
    BEAR: { emoji: '🐻', name: 'Мишка', color: '#8b4513', points: 10 },
    FOX: { emoji: '🦊', name: 'Лиса', color: '#ff7f50', points: 10 },

    // Специальные иконки (создаются при комбинациях)
    ROCKET: { emoji: '🚀', name: 'Ракета', color: '#ffd700', points: 50, special: true },
    BOMB: { emoji: '💣', name: 'Бомба', color: '#ff4500', points: 75, special: true },
    STAR: { emoji: '⭐', name: 'Звезда', color: '#ffff00', points: 100, special: true }
};

// Типы иконок для обычной игры (без специальных)
const NORMAL_ICONS = ['BERRY', 'MUSHROOM', 'FLOWER', 'MATRYOSHKA', 'BALALAIKA', 'KARAWAY', 'BEAR', 'FOX'];

// Получить иконку по типу
function getIcon(type) {
    return ICONS[type] || ICONS.BERRY;
}

// Получить случайную обычную иконку
function getRandomIcon() {
    const types = Object.keys(ICONS).filter(t => !ICONS[t].special);
    return types[Math.floor(Math.random() * types.length)];
}

// Проверить является ли иконка специальной
function isSpecialIcon(type) {
    return ICONS[type] && ICONS[type].special;
}

// Получить emoji для типа иконки
function getEmoji(type) {
    return getIcon(type).emoji;
}

// Нарисовать иконку на canvas
function drawIcon(ctx, type, x, y, size) {
    const icon = getIcon(type);
    const fontSize = size * 0.7;

    ctx.save();
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon.emoji, x + size / 2, y + size / 2);
    ctx.restore();
}

// Экспорт для использования в других файлах
window.ICONS = ICONS;
window.NORMAL_ICONS = NORMAL_ICONS;
window.getIcon = getIcon;
window.getRandomIcon = getRandomIcon;
window.isSpecialIcon = isSpecialIcon;
window.getEmoji = getEmoji;
window.drawIcon = drawIcon;