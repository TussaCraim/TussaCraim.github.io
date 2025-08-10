// Глобальные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Аудио элементы
const backgroundMusic = document.getElementById('backgroundMusic');
const buttonClickSound = document.getElementById('buttonClickSound');
const gameOverSound = document.getElementById('gameOverSound');
const scoreSound = document.getElementById('scoreSound');

// Состояние игры
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0');
let totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
let totalGames = parseInt(localStorage.getItem('totalGames') || '0');
let allScores = JSON.parse(localStorage.getItem('allScores') || '[]');

// Переменные для задержки старта
let gameStartTime = 0;
let isGameStartDelay = false;

// Игровые объекты
let bird = {
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jump: -10
};

let pipes = [];
let gameSpeed = 2;
let pipeGap = 150;
let lastPipeX = 400;

// Частицы и анимации
let backgroundParticles = [];
let destructionParticles = [];

// Настройки магазина
const skins = [
    { id: 'default', name: 'Золотая птичка', price: 0, color: '#FFD700', owned: true, selected: true },
    { id: 'red', name: 'Алая птичка', price: 50, color: '#FF6B9D', owned: false, selected: false },
    { id: 'blue', name: 'Сапфировая птичка', price: 100, color: '#6BB6FF', owned: false, selected: false },
    { id: 'green', name: 'Изумрудная птичка', price: 150, color: '#6BCF7F', owned: false, selected: false }
];

const backgrounds = [
    { 
        id: 'default', 
        name: 'Дневное небо', 
        price: 0, 
        colors: ['#87CEEB', '#B4E7CE'], 
        music: 'sounds/А-hа-The-Sun-Always-Shines-On-TV.mp3',
        owned: true, 
        selected: true 
    },
    { 
        id: 'sunset', 
        name: 'Романтический закат', 
        price: 80, 
        colors: ['#FF8A80', '#FFE082'], 
        music: 'sounds/Tears-For-Fears-Everybody-Wants-To-Rule-The-World.mp3', 
        owned: false, 
        selected: false 
    },
    { 
        id: 'night', 
        name: 'Звёздная ночь', 
        price: 120, 
        colors: ['#3F51B5', '#9C27B0'], 
        music: 'sounds/A-ha-Take-On-Me.mp3',
        owned: false, 
        selected: false 
    },
    { 
        id: 'space', 
        name: 'Космическая одиссея', 
        price: 200, 
        colors: ['#000051', '#6A1B9A'], 
        music: 'sounds/Tears-for-Fears-Shout-remix.mp3',
        owned: false, 
        selected: false 
    }
];

let currentTab = 'skins';

// Инициализация частиц
function initBackgroundParticles() {
    backgroundParticles = [];
    for (let i = 0; i < 15; i++) {
        backgroundParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.3
        });
    }
}

// Создание частиц разрушения труб
function createDestructionParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        destructionParticles.push({
            x: x + Math.random() * 50,
            y: y + Math.random() * 100,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 6 + 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            color: '#4CAF50'
        });
    }
}

// Звуковые функции
function playButtonSound() {
    try {
        buttonClickSound.currentTime = 0;
        buttonClickSound.play().catch(e => console.log('Звук кнопки не воспроизведен:', e));
    } catch (e) {
        console.log('Ошибка воспроизведения звука кнопки:', e);
    }
}

function playGameOverSound() {
    try {
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log('Звук Game Over не воспроизведен:', e));
    } catch (e) {
        console.log('Ошибка воспроизведения звука Game Over:', e);
    }
}

function playScoreSound() {
    try {
        scoreSound.currentTime = 0;
        scoreSound.play().catch(e => console.log('Звук очков не воспроизведен:', e));
    } catch (e) {
        console.log('Ошибка воспроизведения звука очков:', e);
    }
}

function playBackgroundMusic() {
    const selectedBg = backgrounds.find(bg => bg.selected);
    if (selectedBg && selectedBg.music) {
        try {
            backgroundMusic.src = selectedBg.music;
            backgroundMusic.volume = 0.3;
            backgroundMusic.play().catch(e => console.log('Фоновая музыка не воспроизведена:', e));
        } catch (e) {
            console.log('Ошибка воспроизведения фоновой музыки:', e);
        }
    }
}

function stopBackgroundMusic() {
    try {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    } catch (e) {
        console.log('Ошибка остановки фоновой музыки:', e);
    }
}

// Загрузка сохранённых данных
function loadGameData() {
    // Загрузка скинов
    const savedSkins = localStorage.getItem('skins');
    if (savedSkins) {
        const skinData = JSON.parse(savedSkins);
        skins.forEach(skin => {
            const savedSkin = skinData.find(s => s.id === skin.id);
            if (savedSkin) {
                skin.owned = savedSkin.owned;
                skin.selected = savedSkin.selected;
            }
        });
    }

    // Загрузка фонов
    const savedBackgrounds = localStorage.getItem('backgrounds');
    if (savedBackgrounds) {
        const bgData = JSON.parse(savedBackgrounds);
        backgrounds.forEach(bg => {
            const savedBg = bgData.find(b => b.id === bg.id);
            if (savedBg) {
                bg.owned = savedBg.owned;
                bg.selected = savedBg.selected;
            }
        });
    }

    totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');
    highScore = parseInt(localStorage.getItem('highScore') || '0');
    totalGames = parseInt(localStorage.getItem('totalGames') || '0');
    allScores = JSON.parse(localStorage.getItem('allScores') || '[]');
}

// Сохранение данных
function saveGameData() {
    localStorage.setItem('skins', JSON.stringify(skins));
    localStorage.setItem('backgrounds', JSON.stringify(backgrounds));
    localStorage.setItem('totalPoints', totalPoints.toString());
    localStorage.setItem('highScore', highScore.toString());
    localStorage.setItem('totalGames', totalGames.toString());
    localStorage.setItem('allScores', JSON.stringify(allScores));
}

// Функция для обновления фона body в зависимости от выбранной локации
function updateBodyBackground() {
    const selectedBg = backgrounds.find(bg => bg.selected);
    const body = document.body;
    
    let backgroundStyle = '';
    
    switch(selectedBg.id) {
        case 'default':
            backgroundStyle = `
                radial-gradient(circle at 20% 20%, rgba(135, 206, 235, 0.6) 0%, transparent 40%),
                radial-gradient(circle at 80% 80%, rgba(180, 231, 206, 0.6) 0%, transparent 40%),
                radial-gradient(circle at 40% 60%, rgba(135, 206, 235, 0.4) 0%, transparent 60%),
                linear-gradient(135deg, ${selectedBg.colors[0]}80, ${selectedBg.colors[1]}80)
            `;
            break;
        case 'sunset':
            backgroundStyle = `
                radial-gradient(circle at 30% 30%, rgba(255, 138, 128, 0.7) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(255, 224, 130, 0.7) 0%, transparent 50%),
                radial-gradient(circle at 50% 20%, rgba(255, 183, 77, 0.5) 0%, transparent 60%),
                linear-gradient(135deg, ${selectedBg.colors[0]}80, ${selectedBg.colors[1]}80)
            `;
            break;
        case 'night':
            backgroundStyle = `
                radial-gradient(circle at 25% 25%, rgba(63, 81, 181, 0.6) 0%, transparent 40%),
                radial-gradient(circle at 75% 75%, rgba(156, 39, 176, 0.6) 0%, transparent 40%),
                radial-gradient(circle at 10% 80%, rgba(63, 81, 181, 0.4) 0%, transparent 50%),
                linear-gradient(135deg, ${selectedBg.colors[0]}80, ${selectedBg.colors[1]}80)
            `;
            break;
        case 'space':
            backgroundStyle = `
                radial-gradient(circle at 15% 15%, rgba(0, 0, 81, 0.8) 0%, transparent 30%),
                radial-gradient(circle at 85% 85%, rgba(106, 27, 154, 0.8) 0%, transparent 30%),
                radial-gradient(circle at 50% 50%, rgba(0, 0, 81, 0.6) 0%, transparent 50%),
                radial-gradient(circle at 30% 70%, rgba(106, 27, 154, 0.4) 0%, transparent 60%),
                linear-gradient(135deg, ${selectedBg.colors[0]}90, ${selectedBg.colors[1]}90)
            `;
            break;
    }
    
    body.style.background = backgroundStyle;
    body.style.filter = 'blur(1px)';
    body.style.animation = 'backgroundPulse 10s ease-in-out infinite';
}

// Создание анимированных частиц в DOM
function createDOMParticles() {
    const particlesContainer = document.getElementById('backgroundParticles');
    
    // Очищаем существующие частицы
    particlesContainer.innerHTML = '';
    
    // Создаем новые частицы
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Инициализация игры
function initGame() {
    loadGameData();
    initBackgroundParticles();
    updateBodyBackground();
    updatePointsDisplay();
    updateRecordsDisplay();
    drawBackground();
    createDOMParticles();
    gameLoop();
}

// Обновление частиц фона
function updateBackgroundParticles() {
    backgroundParticles.forEach(particle => {
        particle.y -= particle.speed;
        if (particle.y < -10) {
            particle.y = canvas.height + 10;
            particle.x = Math.random() * canvas.width;
        }
    });
}

// Обновление частиц разрушения
function updateDestructionParticles() {
    destructionParticles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // гравитация
        particle.life -= particle.decay;
        
        if (particle.life <= 0) {
            destructionParticles.splice(index, 1);
        }
    });
}

// Отрисовка фона в пиксельном стиле
function drawBackground() {
    const selectedBg = backgrounds.find(bg => bg.selected);
    
    // Основной градиент
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, selectedBg.colors[0]);
    gradient.addColorStop(1, selectedBg.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Пиксельная сетка для эффекта
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let x = 0; x < canvas.width; x += 4) {
        for (let y = 0; y < canvas.height; y += 4) {
            if ((x + y) % 8 === 0) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    // Рисуем анимированные элементы в зависимости от локации
    if (selectedBg.id === 'default') {
        drawPixelClouds();
    } else if (selectedBg.id === 'sunset') {
        drawPixelClouds();
        drawPixelSun();
    } else if (selectedBg.id === 'night' || selectedBg.id === 'space') {
        drawPixelStars();
        if (selectedBg.id === 'night') {
            drawPixelMoon();
        }
    }

    // Частицы фона
    drawBackgroundParticles();
}

// Рисование частиц фона
function drawBackgroundParticles() {
    backgroundParticles.forEach(particle => {
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = 'white';
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// Пиксельные облака
function drawPixelClouds() {
    const time = Date.now() * 0.001;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Облако 1
    const cloud1X = 50 + Math.sin(time * 0.3) * 20;
    drawPixelCloud(cloud1X, 80, 1);
    
    // Облако 2
    const cloud2X = 200 + Math.sin(time * 0.2) * 15;
    drawPixelCloud(cloud2X, 120, 0.8);
    
    // Облако 3
    const cloud3X = 320 + Math.sin(time * 0.4) * 25;
    drawPixelCloud(cloud3X, 60, 1.2);
}

function drawPixelCloud(x, y, scale) {
    const size = 4 * scale;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    // Пиксельное облако
    const cloudPattern = [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0]
    ];
    
    cloudPattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                ctx.fillRect(x + colIndex * size, y + rowIndex * size, size, size);
            }
        });
    });
}

// Пиксельное солнце
function drawPixelSun() {
    const sunX = canvas.width - 80;
    const sunY = 80;
    const time = Date.now() * 0.002;
    
    ctx.fillStyle = '#FFD700';
    
    // Основной круг солнца (пиксельный)
    const sunPattern = [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0]
    ];
    
    sunPattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                ctx.fillRect(sunX + colIndex * 4 - 14, sunY + rowIndex * 4 - 14, 4, 4);
            }
        });
    });
    
    // Лучи (анимированные)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + time;
        const rayLength = 25 + Math.sin(time * 3 + i) * 5;
        const startX = sunX + Math.cos(angle) * 20;
        const startY = sunY + Math.sin(angle) * 20;
        const endX = sunX + Math.cos(angle) * rayLength;
        const endY = sunY + Math.sin(angle) * rayLength;
        
        // Пиксельные лучи
        for (let j = 0; j < rayLength - 20; j += 4) {
            const x = startX + (endX - startX) * (j / (rayLength - 20));
            const y = startY + (endY - startY) * (j / (rayLength - 20));
            ctx.fillRect(x, y, 2, 2);
        }
    }
}

// Пиксельная луна
function drawPixelMoon() {
    const moonX = canvas.width - 70;
    const moonY = 70;
    
    ctx.fillStyle = '#F5F5F5';
    
    // Основной круг луны
    const moonPattern = [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,0,1,1,1,1],
        [1,1,1,1,0,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0]
    ];
    
    moonPattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                ctx.fillRect(moonX + colIndex * 4 - 14, moonY + rowIndex * 4 - 14, 4, 4);
            }
        });
    });
    
    // Кратеры
    ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.fillRect(moonX - 8, moonY - 4, 4, 4);
    ctx.fillRect(moonX + 4, moonY + 8, 4, 4);
    ctx.fillRect(moonX - 4, moonY + 12, 4, 4);
}

// Пиксельные звёзды
function drawPixelStars() {
    const time = Date.now() * 0.003;
    const stars = [
        {x: 50, y: 50}, {x: 150, y: 80}, {x: 300, y: 60},
        {x: 80, y: 150}, {x: 250, y: 120}, {x: 350, y: 180},
        {x: 120, y: 200}, {x: 280, y: 250}, {x: 180, y: 300},
        {x: 20, y: 100}, {x: 200, y: 40}, {x: 320, y: 140}
    ];

    stars.forEach((star, index) => {
        const twinkle = Math.sin(time + index) * 0.5 + 0.5;
        ctx.globalAlpha = 0.5 + twinkle * 0.5;
        ctx.fillStyle = 'white';
        
        // Пиксельная звезда
        const size = 2 + Math.floor(twinkle * 2);
        ctx.fillRect(star.x, star.y, size, size);
        ctx.fillRect(star.x - 2, star.y + 1, 1, 1);
        ctx.fillRect(star.x + size + 1, star.y + 1, 1, 1);
        ctx.fillRect(star.x + 1, star.y - 2, 1, 1);
        ctx.fillRect(star.x + 1, star.y + size + 1, 1, 1);
    });
    
    ctx.globalAlpha = 1;
}

// Функция затемнения цвета
function darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `rgb(${r}, ${g}, ${b})`;
}

// Отрисовка птички в пиксельном стиле
function drawBird() {
    // Не рисуем птичку во время обратного отсчета
    if (isGameStartDelay) {
        return;
    }
    
    const selectedSkin = skins.find(skin => skin.selected);
    
    ctx.save();
    
    // Поворот птички в зависимости от скорости
    const rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);
    ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    ctx.rotate(rotation);
    
    // Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-bird.width/2 + 2, -bird.height/2 + 2, bird.width, bird.height);
    
    // Тело птички (пиксельное)
    ctx.fillStyle = selectedSkin.color;
    const birdPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    const pixelSize = 4;
    birdPattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                ctx.fillRect(-16 + colIndex * pixelSize, -14 + rowIndex * pixelSize, pixelSize, pixelSize);
            }
        });
    });
    
    // Контур птички
    ctx.strokeStyle = darkenColor(selectedSkin.color, 0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(-bird.width/2, -bird.height/2, bird.width, bird.height);
    
    // Клюв (пиксельный)
    ctx.fillStyle = '#FFA726';
    ctx.fillRect(bird.width/2, -2, 8, 4);
    ctx.fillRect(bird.width/2 + 8, -1, 4, 2);
    
    // Глаз
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, -8, 8, 8);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, -6, 4, 4);
    
    // Блик в глазу
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8, -7, 2, 2);
    
    ctx.restore();
}

// Создание новой трубы
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        width: 50,
        topHeight: topHeight,
        passed: false,
        destroyed: false,
        opacity: 1,
        destructionTime: 0
    });
}

// Отрисовка труб в пиксельном стиле
function drawPipes() {
    pipes.forEach(pipe => {
        ctx.save();
        
        // Применяем эффекты разрушения
        if (pipe.destroyed) {
            ctx.globalAlpha = pipe.opacity;
            if (pipe.shakeX && pipe.shakeY) {
                ctx.translate(pipe.shakeX, pipe.shakeY);
            }
        }
        
        // Основной цвет труб
        ctx.fillStyle = '#4CAF50';
        
        // Верхняя труба
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        // Нижняя труба
        ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipe.width, canvas.height - pipe.topHeight - pipeGap);
        
        // Пиксельная текстура труб
        ctx.fillStyle = '#66BB6A';
        for (let y = 0; y < pipe.topHeight; y += 8) {
            for (let x = pipe.x; x < pipe.x + pipe.width; x += 8) {
                if ((x + y) % 16 === 0) {
                    ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        for (let y = pipe.topHeight + pipeGap; y < canvas.height; y += 8) {
            for (let x = pipe.x; x < pipe.x + pipe.width; x += 8) {
                if ((x + y) % 16 === 0) {
                    ctx.fillRect(x, y, 4, 4);
                }
            }
        }
        
        // Контуры труб
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.strokeRect(pipe.x, pipe.topHeight + pipeGap, pipe.width, canvas.height - pipe.topHeight - pipeGap);
        
        // Заглушки труб (пиксельные)
        ctx.fillStyle = '#81C784';
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 16, pipe.width + 8, 16);
        ctx.fillRect(pipe.x - 4, pipe.topHeight + pipeGap, pipe.width + 8, 16);
        
        // Контуры заглушек
        ctx.strokeStyle = '#4CAF50';
        ctx.strokeRect(pipe.x - 4, pipe.topHeight - 16, pipe.width + 8, 16);
        ctx.strokeRect(pipe.x - 4, pipe.topHeight + pipeGap, pipe.width + 8, 16);
        
        // Тени (НЕ проходят через заглушки)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        // Тень верхней трубы (до заглушки)
        ctx.fillRect(pipe.x + pipe.width - 4, 0, 4, pipe.topHeight - 16);
        // Тень нижней трубы (после заглушки)
        ctx.fillRect(pipe.x + pipe.width - 4, pipe.topHeight + pipeGap + 16, 4, canvas.height - pipe.topHeight - pipeGap - 16);
        
        ctx.restore();
    });
}

// Отрисовка частиц разрушения
function drawDestructionParticles() {
    destructionParticles.forEach(particle => {
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        
        // Контур частицы
        ctx.strokeStyle = darkenColor(particle.color, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// Обновление позиций труб
function updatePipes() {
    if (!isGameStartDelay) {
        pipes.forEach((pipe, index) => {
            // Обновляем позицию ВСЕХ труб, включая разрушенные
            pipe.x -= gameSpeed;
            
            // Если труба разрушена, применяем эффекты разрушения
            if (pipe.destroyed) {
                pipe.destructionTime += 0.02;
                pipe.opacity = Math.max(0, 1 - pipe.destructionTime * 2);
                
                // Эффект "разваливания" - случайное смещение пикселей
                pipe.shakeX = (Math.random() - 0.5) * pipe.destructionTime * 10;
                pipe.shakeY = (Math.random() - 0.5) * pipe.destructionTime * 5;
            }
            
            // Удаление труб, которые полностью вышли за экран (включая разрушенные)
            if (pipe.x + pipe.width < -50) {
                pipes.splice(index, 1);
                return;
            }
            
            // Увеличение очков и разрушение трубы
            if (!pipe.passed && !pipe.destroyed && pipe.x + pipe.width < bird.x) {
                pipe.passed = true;
                pipe.destroyed = true;
                pipe.destructionTime = 0;
                score++;
                
                // Воспроизведение звука очков
                playScoreSound();
                
                // Создание частиц разрушения
                createDestructionParticles(pipe.x, pipe.topHeight);
                createDestructionParticles(pipe.x, pipe.topHeight + pipeGap);
                
                // Анимация обновления счёта
                const scoreElement = document.getElementById('scoreDisplay');
                scoreElement.style.animation = 'none';
                setTimeout(() => {
                    scoreElement.style.animation = 'scoreUpdate 0.3s ease';
                    scoreElement.textContent = score;
                }, 10);
                
                // Постепенное усложнение
                if (score % 5 === 0) {
                    gameSpeed += 0.2;
                    if (pipeGap > 120) {
                        pipeGap -= 2;
                    }
                }
            }
        });

        // Создание новых труб
        if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
            createPipe();
        }
    }
}

// Обновление птички
function updateBird() {
    if (!isGameStartDelay) {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
    }

    // Ограничения экрана
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    if (bird.y + bird.height > canvas.height) {
        gameOver();
    }
}

// Проверка столкновений
function checkCollisions() {
    pipes.forEach(pipe => {
        if (!pipe.destroyed) {
            // Столкновение с верхней трубой
            if (bird.x < pipe.x + pipe.width &&
                bird.x + bird.width > pipe.x &&
                bird.y < pipe.topHeight) {
                gameOver();
            }
            
            // Столкновение с нижней трубой
            if (bird.x < pipe.x + pipe.width &&
                bird.x + bird.width > pipe.x &&
                bird.y + bird.height > pipe.topHeight + pipeGap) {
                gameOver();
            }
        }
    });
}

// Прыжок птички
function jump() {
    if (gameState === 'playing' && !isGameStartDelay) {
        bird.velocity = bird.jump;
    }
}

// Начало игры с обратным отсчетом
function startGame() {
    playButtonSound();
    
    gameState = 'playing';
    score = 0;
    gameSpeed = 2;
    pipeGap = 200;
    
    // Сброс позиции птички
    bird.x = 50;
    bird.y = 300;
    bird.velocity = 0;
    
    // Очистка труб и частиц
    pipes = [];
    destructionParticles = [];
    
    // Скрытие меню, показ игрового интерфейса БЕЗ блашки очков
    hideAllScreens();
    document.getElementById('gameUI').classList.remove('hidden');
    document.getElementById('scoreContainer').classList.remove('show'); // УБИРАЕМ блашку очков
    document.getElementById('scoreDisplay').textContent = '0';
    
    // Показ обратного отсчета
    showStartCountdown();
    
    // Установка задержки старта
    gameStartTime = Date.now();
    isGameStartDelay = true;
    
    setTimeout(() => {
        isGameStartDelay = false;
        // Показываем блашку очков с анимацией
        document.getElementById('scoreContainer').classList.add('show');
        // Запуск фоновой музыки после отсчета (отсчет сам себя скроет)
        playBackgroundMusic();
    }, 4500); // Увеличиваем время до 4.5 секунд (3 сек отсчет + 1.5 сек "ПОЕХАЛИ!")
}

// Показ обратного отсчета
function showStartCountdown() {
    const countdownElement = document.getElementById('startCountdown');
    const numberElement = document.getElementById('countdownNumber');
    const textElement = document.querySelector('.countdown-text');
    
    countdownElement.classList.remove('hidden');
    textElement.classList.remove('hide');
    
    let count = 3;
    numberElement.textContent = count;
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            numberElement.textContent = count;
            numberElement.style.animation = 'none';
            setTimeout(() => {
                numberElement.style.animation = 'countdownPulse 1s ease-in-out';
            }, 10);
        } else {
            clearInterval(interval);
            
            // Скрываем блашку отсчета
            countdownElement.style.transition = 'all 0.3s ease-out';
            countdownElement.style.opacity = '0';
            countdownElement.style.transform = 'translate(-50%, -50%) scale(0.8)';
            
            // Показываем блашку "ПОЕХАЛИ!"
            setTimeout(() => {
                countdownElement.classList.add('hidden');
                countdownElement.style.transition = '';
                countdownElement.style.opacity = '';
                countdownElement.style.transform = '';
                textElement.classList.remove('hide');
                
                // Показываем красивую блашку "ПОЕХАЛИ!"
                showGoMessage();
            }, 300);
        }
    }, 1000);
}

// Показ блашки "ПОЕХАЛИ!"
function showGoMessage() {
    const goElement = document.getElementById('goMessage');
    
    goElement.classList.remove('hidden');
    
    // Небольшая задержка для плавного появления
    setTimeout(() => {
        goElement.classList.add('show');
    }, 50);
    
    // Скрываем через 1.5 секунды
    setTimeout(() => {
        goElement.classList.remove('show');
        goElement.classList.add('hide');
        
        // Полностью скрываем через 300ms
        setTimeout(() => {
            goElement.classList.add('hidden');
            goElement.classList.remove('hide');
        }, 300);
    }, 1500);
}

// Окончание игры
function gameOver() {
    gameState = 'gameOver';
    
    // Скрываем блашку очков при поражении
    document.getElementById('scoreContainer').classList.remove('show');
    
    // Эффект тряски экрана
    document.getElementById('gameContainer').classList.add('game-over-shake');
    setTimeout(() => {
        document.getElementById('gameContainer').classList.remove('game-over-shake');
    }, 600);
    
    // Остановка музыки и воспроизведение звука Game Over
    stopBackgroundMusic();
    playGameOverSound();
    
    // Обновление рекордов
    totalPoints += score;
    totalGames++;
    allScores.push(score);
    
    if (score > highScore) {
        highScore = score;
    }
    
    saveGameData();
    
    // Показ экрана Game Over с задержкой для эффекта
    setTimeout(() => {
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('finalScore').textContent = score;
        document.getElementById('bestScore').textContent = highScore;
        document.getElementById('gameOverPoints').textContent = totalPoints;
    }, 800);
}

// Основной игровой цикл
function gameLoop() {
    // Очистка канваса
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка фона
    drawBackground();
    
    if (gameState === 'playing') {
        updateBackgroundParticles();
        updateBird();
        updatePipes();
        updateDestructionParticles();
        checkCollisions();
        drawPipes();
        drawDestructionParticles();
    }
    
    drawBird();
    
    requestAnimationFrame(gameLoop);
}

// Функции управления экранами
function hideAllScreens() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('shopScreen').classList.add('hidden');
    document.getElementById('recordsScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
}

function showMainMenu() {
    playButtonSound();
    stopBackgroundMusic();
    
    hideAllScreens();
    document.getElementById('gameUI').classList.add('hidden');
    document.getElementById('scoreContainer').classList.remove('show'); // Скрываем блашку очков
    document.getElementById('startCountdown').classList.add('hidden');
    document.getElementById('goMessage').classList.add('hidden'); // Скрываем блашку "ПОЕХАЛИ!"
    document.getElementById('mainMenu').classList.remove('hidden');
    gameState = 'menu';
}

function showShop() {
    playButtonSound();
    
    hideAllScreens();
    document.getElementById('shopScreen').classList.remove('hidden');
    updateShop();
}

function showRecords() {
    playButtonSound();
    
    hideAllScreens();
    document.getElementById('recordsScreen').classList.remove('hidden');
    updateRecordsDisplay();
}

// Функции магазина
function switchTab(tab) {
    playButtonSound();
    
    currentTab = tab;
    
    // Обновление активной вкладки
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Находим кнопку по содержимому
    document.querySelectorAll('.tab-button').forEach(btn => {
        const spans = btn.querySelectorAll('span');
        if (spans.length >= 2) {
            const tabText = spans[1].textContent;
            if ((tab === 'skins' && tabText === 'СКИНЫ') || 
                (tab === 'backgrounds' && tabText === 'ЛОКАЦИИ')) {
                btn.classList.add('active');
            }
        }
    });
    
    updateShop();
}

function updateShop() {
    updatePointsDisplay();
    
    const shopItems = document.getElementById('shopItems');
    shopItems.innerHTML = '';
    
    const items = currentTab === 'skins' ? skins : backgrounds;
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        
        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';
        
        const itemInfo = document.createElement('div');
        itemInfo.className = 'item-info';
        
        const itemPreview = document.createElement('div');
        itemPreview.className = 'item-preview';
        
        if (currentTab === 'skins') {
            // Для скинов рисуем птичку
            itemPreview.classList.add('skin-preview');
            drawBirdPreview(itemPreview, item.color);
        } else {
            // Для локаций используем градиент
            itemPreview.classList.add('location-preview');
            const gradient = `linear-gradient(45deg, ${item.colors[0]}, ${item.colors[1]})`;
            itemPreview.style.background = gradient;
        }
        
        const itemDetails = document.createElement('div');
        itemDetails.className = 'item-details';
        itemDetails.innerHTML = `
            <h3>${item.name}</h3>
            <div class="item-price">${item.price > 0 ? `💰 ${item.price} очков` : '🎁 Бесплатно'}</div>
        `;
        
        itemInfo.appendChild(itemPreview);
        itemInfo.appendChild(itemDetails);
        
        const actionButton = document.createElement('button');
        
        if (item.selected) {
            actionButton.className = 'selected';
            actionButton.textContent = '✅ ВЫБРАНО';
            actionButton.disabled = true;
        } else if (item.owned) {
            actionButton.className = 'buy-button';
            actionButton.textContent = '👆 ВЫБРАТЬ';
            actionButton.onclick = () => selectItem(item.id);
        } else {
            actionButton.className = 'buy-button';
            actionButton.textContent = '🛒 КУПИТЬ';
            actionButton.disabled = totalPoints < item.price;
            actionButton.onclick = () => buyItem(item.id);
        }
        
        itemContent.appendChild(itemInfo);
        itemContent.appendChild(actionButton);
        itemDiv.appendChild(itemContent);
        shopItems.appendChild(itemDiv);
    });
}

// Функция для рисования превью птички в пиксельном стиле
function drawBirdPreview(container, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сохраняем контекст для трансформаций
    ctx.save();
    
    // Центрируем птичку в канвасе (как в игре используется translate)
    ctx.translate(16, 16); // Центр канваса 32x32
    
    // Масштабируем в 0.5 раза (30x30 -> 15x15)
    const scale = 0.5;
    ctx.scale(scale, scale);
    
    // Тень (ТОЧНО как в игре)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-15 + 2, -15 + 2, 30, 30); // -bird.width/2 + 2, -bird.height/2 + 2
    
    // Тело птички (ТОЧНО как в игре с тем же паттерном)
    ctx.fillStyle = color;
    const birdPattern = [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    const pixelSize = 4; // Как в игре
    birdPattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                ctx.fillRect(-16 + colIndex * pixelSize, -14 + rowIndex * pixelSize, pixelSize, pixelSize);
            }
        });
    });
    
    // Контур птички (ТОЧНО как в игре)
    ctx.strokeStyle = darkenColor(color, 0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(-15, -15, 30, 30); // -bird.width/2, -bird.height/2, bird.width, bird.height
    
    // Клюв (ТОЧНО как в игре)
    ctx.fillStyle = '#FFA726';
    ctx.fillRect(15, -2, 8, 4);    // bird.width/2, -2, 8, 4
    ctx.fillRect(15 + 8, -1, 4, 2); // bird.width/2 + 8, -1, 4, 2
    
    // Глаз (ТОЧНО как в игре)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, -8, 8, 8);     // 4, -8, 8, 8
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, -6, 4, 4);     // 6, -6, 4, 4
    
    // Блик в глазу (ТОЧНО как в игре)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(8, -7, 2, 2);     // 8, -7, 2, 2
    
    ctx.restore();
    
    container.appendChild(canvas);
}

function buyItem(itemId) {
    playButtonSound();
    
    const items = currentTab === 'skins' ? skins : backgrounds;
    const item = items.find(i => i.id === itemId);
    
    if (item && totalPoints >= item.price && !item.owned) {
        totalPoints -= item.price;
        item.owned = true;
        saveGameData();
        updateShop();
    }
}

function selectItem(itemId) {
    playButtonSound();
    
    const items = currentTab === 'skins' ? skins : backgrounds;
    
    // Снимаем выбор с текущего элемента
    items.forEach(item => item.selected = false);
    
    // Выбираем новый элемент
    const item = items.find(i => i.id === itemId);
    if (item && item.owned) {
        item.selected = true;
        saveGameData();
        updateShop();
        
        // Если выбрана новая локация, обновляем фон на канвасе И body
        if (currentTab === 'backgrounds') {
            updateBodyBackground();
            drawBackground();
        }
    }
}

function updatePointsDisplay() {
    document.getElementById('shopPoints').textContent = totalPoints;
}

function updateRecordsDisplay() {
    document.getElementById('highScoreDisplay').textContent = highScore;
    document.getElementById('totalPointsDisplay').textContent = totalPoints;
    document.getElementById('totalGamesDisplay').textContent = totalGames;
    
    const averageScore = totalGames > 0 ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / totalGames) : 0;
    document.getElementById('averageScoreDisplay').textContent = averageScore;
}

// Обработчики событий
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);

// Предотвращение контекстного меню
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Обработчики для кнопок с звуковыми эффектами
document.addEventListener('click', (e) => {
    if (e.target.matches('button')) {
        playButtonSound();
    }
});

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    initGame();
});
