// Глобальные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Аудио элементы
const backgroundMusic = document.getElementById('backgroundMusic');
const buttonClickSound = document.getElementById('buttonClickSound');
const gameOverSound = document.getElementById('gameOverSound');

// Состояние игры
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0');
let totalPoints = parseInt(localStorage.getItem('totalPoints') || '0');

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

// Анимированные элементы фона
let backgroundElements = [];
let cloudPositions = [];

// Настройки магазина
const skins = [
    { id: 'default', name: 'Золотая птичка', price: 0, color: '#FFD700', owned: true, selected: true },
    { id: 'red', name: 'Алая птичка', price: 50, color: '#FF6B9D', owned: false, selected: false },
    { id: 'blue', name: 'Сапфировая птичка', price: 100, color: '#6BB6FF', owned: false, selected: false },
    { id: 'green', name: 'Изумрудная птичка', price: 150, color: '#6BCF7F', owned: false, selected: false }
];

backgrounds = [
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

// Инициализация облаков
function initClouds() {
    cloudPositions = [];
    for (let i = 0; i < 5; i++) {
        cloudPositions.push({
            x: Math.random() * canvas.width,
            y: 50 + Math.random() * 150,
            size: 30 + Math.random() * 40,
            speed: 0.2 + Math.random() * 0.3
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
}

// Сохранение данных
function saveGameData() {
    localStorage.setItem('skins', JSON.stringify(skins));
    localStorage.setItem('backgrounds', JSON.stringify(backgrounds));
    localStorage.setItem('totalPoints', totalPoints.toString());
    localStorage.setItem('highScore', highScore.toString());
}

// Инициализация игры
function initGame() {
    loadGameData();
    initClouds();
    updatePointsDisplay();
    updateRecordsDisplay();
    drawBackground();
    gameLoop();
}

// Обновление облаков
function updateClouds() {
    cloudPositions.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size * 2 < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = 50 + Math.random() * 150;
        }
    });
}

// Отрисовка фона
function drawBackground() {
    const selectedBg = backgrounds.find(bg => bg.selected);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, selectedBg.colors[0]);
    gradient.addColorStop(1, selectedBg.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем анимированные элементы в зависимости от локации
    if (selectedBg.id === 'default') {
        drawAnimatedClouds();
    } else if (selectedBg.id === 'sunset') {
        drawAnimatedClouds();
        drawSun();
    } else if (selectedBg.id === 'night' || selectedBg.id === 'space') {
        drawStars();
        if (selectedBg.id === 'night') {
            drawMoon();
        }
    }
}

// Рисование анимированных облаков
function drawAnimatedClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    cloudPositions.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.size);
    });
}

function drawCloud(x, y, size) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#FFFFFF';
    
    // Основное тело облака
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x - size * 0.4, y, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Рисование солнца
function drawSun() {
    const sunX = canvas.width - 80;
    const sunY = 80;
    const sunRadius = 40;
    
    // Солнце
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, '#FFF59D');
    sunGradient.addColorStop(1, '#FFB74D');
    
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Лучи солнца
    ctx.strokeStyle = 'rgba(255, 245, 157, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const startX = sunX + Math.cos(angle) * (sunRadius + 10);
        const startY = sunY + Math.sin(angle) * (sunRadius + 10);
        const endX = sunX + Math.cos(angle) * (sunRadius + 25);
        const endY = sunY + Math.sin(angle) * (sunRadius + 25);
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}

// Рисование луны
function drawMoon() {
    const moonX = canvas.width - 70;
    const moonY = 70;
    const moonRadius = 35;
    
    // Луна
    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Кратеры
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY - 8, 6, 0, Math.PI * 2);
    ctx.arc(moonX + 8, moonY + 5, 4, 0, Math.PI * 2);
    ctx.arc(moonX - 5, moonY + 12, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Рисование звёзд
function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    // Статичные звёзды с мерцанием
    const stars = [
        {x: 50, y: 50}, {x: 150, y: 80}, {x: 300, y: 60},
        {x: 80, y: 150}, {x: 250, y: 120}, {x: 350, y: 180},
        {x: 120, y: 200}, {x: 280, y: 250}, {x: 180, y: 300},
        {x: 20, y: 100}, {x: 200, y: 40}, {x: 320, y: 140}
    ];

    stars.forEach((star, index) => {
        const twinkle = Math.sin(Date.now() * 0.01 + index) * 0.5 + 0.5;
        ctx.globalAlpha = 0.5 + twinkle * 0.5;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1;
}

// Отрисовка птички
function drawBird() {
    const selectedSkin = skins.find(skin => skin.selected);
    
    ctx.save();
    
    // Поворот птички в зависимости от скорости
    const rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);
    ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    ctx.rotate(rotation);
    
    // Тело птички с градиентом
    const birdGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bird.width/2);
    birdGradient.addColorStop(0, selectedSkin.color);
    birdGradient.addColorStop(1, darkenColor(selectedSkin.color, 0.3));
    
    ctx.fillStyle = birdGradient;
    ctx.beginPath();
    ctx.arc(0, 0, bird.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(2, 2, bird.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Клюв
    ctx.fillStyle = '#FFA726';
    ctx.beginPath();
    ctx.moveTo(bird.width/2, 0);
    ctx.lineTo(bird.width/2 + 10, -5);
    ctx.lineTo(bird.width/2 + 10, 5);
    ctx.closePath();
    ctx.fill();
    
    // Глаз
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(5, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(7, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Блик в глазу
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8, -6, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Функция затемнения цвета
function darkenColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `rgb(${r}, ${g}, ${b})`;
}

// Отрисовка труб с улучшенным дизайном
function drawPipes() {
    pipes.forEach(pipe => {
        // Градиент для труб
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        pipeGradient.addColorStop(0, '#4CAF50');
        pipeGradient.addColorStop(0.5, '#66BB6A');
        pipeGradient.addColorStop(1, '#2E7D32');
        
        ctx.fillStyle = pipeGradient;
        
        // Верхняя труба
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        // Нижняя труба
        ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipe.width, canvas.height - pipe.topHeight - pipeGap);
        
        // Украшения на трубах
        const capGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        capGradient.addColorStop(0, '#81C784');
        capGradient.addColorStop(1, '#4CAF50');
        
        ctx.fillStyle = capGradient;
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipe.width + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.topHeight + pipeGap, pipe.width + 10, 20);
        
        // Тени
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(pipe.x + pipe.width - 5, 0, 5, pipe.topHeight);
        ctx.fillRect(pipe.x + pipe.width - 5, pipe.topHeight + pipeGap, 5, canvas.height - pipe.topHeight - pipeGap);
    });
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
        passed: false
    });
}

// Обновление позиций труб
function updatePipes() {
    pipes.forEach((pipe, index) => {
        pipe.x -= gameSpeed;
        
        // Удаление труб, которые вышли за экран
        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }
        
        // Увеличение очков
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            score++;
            
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

// Обновление птички
function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

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
    });
}

// Прыжок птички
function jump() {
    if (gameState === 'playing') {
        bird.velocity = bird.jump;
    }
}

// Начало игры
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
    
    // Очистка труб
    pipes = [];
    
    // Скрытие меню, показ игрового интерфейса
    hideAllScreens();
    document.getElementById('gameUI').classList.remove('hidden');
    document.getElementById('scoreDisplay').textContent = '0';
    
    // Запуск фоновой музыки
    playBackgroundMusic();
}

// Окончание игры
function gameOver() {
    gameState = 'gameOver';
    
    // Остановка музыки и воспроизведение звука Game Over
    stopBackgroundMusic();
    playGameOverSound();
    
    // Обновление рекордов
    totalPoints += score;
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
    }, 500);
}

// Основной игровой цикл
function gameLoop() {
    // Очистка канваса
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка фона
    drawBackground();
    
    if (gameState === 'playing') {
        updateClouds();
        updateBird();
        updatePipes();
        checkCollisions();
        drawPipes();
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
    event.target.classList.add('active');
    
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
            actionButton.textContent = '✅ Выбрано';
            actionButton.disabled = true;
        } else if (item.owned) {
            actionButton.className = 'buy-button';
            actionButton.textContent = '👆 Выбрать';
            actionButton.onclick = () => selectItem(item.id);
        } else {
            actionButton.className = 'buy-button';
            actionButton.textContent = '🛒 Купить';
            actionButton.disabled = totalPoints < item.price;
            actionButton.onclick = () => buyItem(item.id);
        }
        
        itemContent.appendChild(itemInfo);
        itemContent.appendChild(actionButton);
        itemDiv.appendChild(itemContent);
        shopItems.appendChild(itemDiv);
    });
}

// Функция для рисования превью птички
function drawBirdPreview(container, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 46;
    canvas.height = 46;
    canvas.style.borderRadius = '50%';
    
    const ctx = canvas.getContext('2d');
    
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Используем те же пропорции, что и в игре
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const birdWidth = 30;  // Как в игре
    const birdHeight = 30; // Как в игре
    const scale = 0.7; // Масштабируем для помещения в превью
    
    const scaledWidth = birdWidth * scale;
    const scaledHeight = birdHeight * scale;
    const radius = scaledWidth / 2;
    
    ctx.save();
    
    // Тень птички
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Тело птички с градиентом (точно как в игре)
    const birdGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    birdGradient.addColorStop(0, color);
    birdGradient.addColorStop(1, darkenColor(color, 0.3));
    
    ctx.fillStyle = birdGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Клюв (пропорции как в игре, но масштабированы)
    ctx.fillStyle = '#FFA726';
    ctx.beginPath();
    ctx.moveTo(centerX + radius, centerY);
    ctx.lineTo(centerX + radius + (10 * scale), centerY - (5 * scale));
    ctx.lineTo(centerX + radius + (10 * scale), centerY + (5 * scale));
    ctx.closePath();
    ctx.fill();
    
    // Глаз (белая часть) - пропорции как в игре
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX + (5 * scale), centerY - (5 * scale), 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачок - пропорции как в игре
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX + (7 * scale), centerY - (5 * scale), 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Блик в глазу - пропорции как в игре
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX + (8 * scale), centerY - (6 * scale), 1 * scale, 0, Math.PI * 2);
    ctx.fill();
    
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
        
        // Если выбрана новая локация, обновляем фон на канвасе
        if (currentTab === 'backgrounds') {
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
window.addEventListener('load', initGame);