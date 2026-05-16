// Древнерусские иконки для игры Match-3

const ICONS = {
    // Основные иконки (обычные)
    BERRY: { emoji: '🍓', image: 'media/icons/berry.png', name: 'Ягода', color: '#ff6b6b', points: 10 },
    MUSHROOM: { emoji: '🍄', image: 'media/icons/mushroom.png', name: 'Гриб', color: '#c9a959', points: 10 },
    FLOWER: { emoji: '🍞', image: 'media/icons/flower.png', name: 'Колобок', color: '#deb887', points: 10 },
    MATRYOSHKA: { emoji: '🪆', image: 'media/icons/matryoshka.png', name: 'Матрёшка', color: '#ee5a5a', points: 10 },
    BALALAIKA: { emoji: '🎸', image: 'media/icons/balalaika.png', name: 'Балалайка', color: '#8b5a2b', points: 10 },
    KARAWAY: { emoji: '🦎', image: 'media/icons/karawai.png', name: 'Ящер', color: '#7cfc00', points: 10 },
    BEAR: { emoji: '🐻', image: 'media/icons/bear.png', name: 'Мишка', color: '#8b4513', points: 10 },
    FOX: { emoji: '🦊', image: 'media/icons/fox.png', name: 'Лиса', color: '#ff7f50', points: 10 },

    // Специальные иконки (создаются при комбинациях)
    ROCKET: { emoji: '🚀', image: 'media/icons/rocket.png', name: 'Ракета', color: '#ffd700', points: 50, special: 'rocket' },
    BOMB: { emoji: '💣', image: 'media/icons/bomb.png', name: 'Бомба', color: '#ff4500', points: 75, special: 'bomb' },
    DIAGONAL: { emoji: '✨', image: 'media/icons/diagonal.png', name: 'Диа-бомба', color: '#ff69b4', points: 100, special: 'star' }
};

// Кеш загруженных изображений
const iconImages = {};

// Загрузить все иконки
function loadIcons(callback) {
    let loaded = 0;
    const total = Object.keys(ICONS).length;
    
    if (total === 0) {
        if (callback) callback();
        return;
    }
    
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

// Получить загруженное изображение
function getIconImage(type) {
    return iconImages[type];
}

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

// Получить тип специальной иконки
function getSpecialType(type) {
    return ICONS[type] ? ICONS[type].special : null;
}

// Получить emoji для типа иконки
function getEmoji(type) {
    return getIcon(type).emoji;
}

// Экспорт
window.ICONS = ICONS;
window.NORMAL_ICONS = NORMAL_ICONS;
window.getIcon = getIcon;
window.getRandomIcon = getRandomIcon;
window.isSpecialIcon = isSpecialIcon;
window.getSpecialType = getSpecialType;
window.getEmoji = getEmoji;
window.loadIcons = loadIcons;
window.getIconImage = getIconImage;