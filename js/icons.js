// Древнерусские иконки для игры Match-3

const ICONS = {
    // Основные иконки (обычные)
    BERRY: { image: 'media/icons/berry.png', name: 'Ягода', color: '#ff6b6b', points: 10 },
    MUSHROOM: { image: 'media/icons/mushroom.png', name: 'Гриб', color: '#c9a959', points: 10 },
    FLOWER: { image: 'media/icons/flower.png', name: 'Цветок', color: '#ff9ff3', points: 10 },
    MATRYOSHKA: { image: 'media/icons/matryoshka.png', name: 'Матрёшка', color: '#ee5a5a', points: 10 },
    BALALAIKA: { image: 'media/icons/balalaika.png', name: 'Балалайка', color: '#8b5a2b', points: 10 },
    KARAWAY: { image: 'media/icons/karawai.png', name: 'Каравай', color: '#f4a460', points: 10 },
    BEAR: { image: 'media/icons/bear.png', name: 'Мишка', color: '#8b4513', points: 10 },
    FOX: { image: 'media/icons/fox.png', name: 'Лиса', color: '#ff7f50', points: 10 },

    // Специальные иконки (создаются при комбинациях)
    ROCKET: { image: 'media/icons/rocket.png', name: 'Ракета', color: '#ffd700', points: 50, special: 'rocket' },
    BOMB: { image: 'media/icons/bomb.png', name: 'Бомба', color: '#ff4500', points: 75, special: 'bomb' },
    DIAGONAL: { image: 'media/icons/diagonal.png', name: 'Диа-бомба', color: '#ff69b4', points: 100, special: 'star' }
};


// Кеш загруженных изображений
const iconImages = {};


// Загрузить все иконки
function loadIcons(callback) {
    let loaded = 0;
    const total = Object.keys(ICONS).length;
    
    // Если нет что загружать - сразу вызываем callback
    if (total === 0) {
        if (callback) callback();
        return;
    }
    
    // Таймаут на случай если изображения не загружаются
    setTimeout(() => {
        if (callback) callback();
    }, 3000);
    
    for (const type in ICONS) {
        const img = new Image();
        img.src = ICONS[type].image;
        img.onload = () => {
            iconImages[type] = img;
            loaded++;
            if (loaded >= total && callback) {
                callback();
            }
        };
        img.onerror = () => {
            console.warn('Failed to load icon:', ICONS[type].image);
            loaded++;
            if (loaded >= total && callback) {
                callback();
            }
        };
    }
}

// Типы иконок для обычной игры (без специальных)
const NORMAL_ICONS = ['BERRY', 'MUSHROOM', 'FLOWER', 'MATRYOSHKA', 'BALALAIKA', 'KARAWAY', 'BEAR', 'FOX'];

// Получить иконку по типу
function getIcon(type) {
    return ICONS[type] || ICONS.BERRY;
}

// Получить изображение иконки
function getIconImage(type) {
    return iconImages[type];
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

// Получить тип специальной иконки
function getSpecialType(type) {
    return ICONS[type] ? ICONS[type].special : null;
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
window.getIconImage = getIconImage;
window.getRandomIcon = getRandomIcon;
window.isSpecialIcon = isSpecialIcon;
window.getSpecialType = getSpecialType;
window.getEmoji = getEmoji;
window.loadIcons = loadIcons;
window.drawIcon = drawIcon;