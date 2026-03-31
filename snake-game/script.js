// 游戏常量
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const GRID_SIZE = 20;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;

// 游戏变量
let canvas;
let ctx;
let snake;
let food;
let direction;
let score;
let highScore;
let gameInterval;
let isGameRunning;

// 初始化游戏
function init() {
    // 获取画布和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 加载最高分
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    document.getElementById('high-score').textContent = highScore;
    
    // 重置游戏状态
    resetGame();
    
    // 绑定事件
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('resetButton').addEventListener('click', resetGame);
    document.addEventListener('keydown', handleKeyPress);
}

// 重置游戏
function resetGame() {
    // 停止游戏
    clearInterval(gameInterval);
    isGameRunning = false;
    
    // 初始化蛇
    snake = [
        { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) }
    ];
    
    // 初始化食物
    generateFood();
    
    // 初始化方向
    direction = { x: 0, y: 0 };
    
    // 初始化分数
    score = 0;
    document.getElementById('score').textContent = score;
    
    // 绘制初始状态
    drawGame();
}

// 开始游戏
function startGame() {
    if (!isGameRunning) {
        // 如果还没有设置方向，默认向右
        if (direction.x === 0 && direction.y === 0) {
            direction = { x: 1, y: 0 };
        }
        
        isGameRunning = true;
        gameInterval = setInterval(gameLoop, 100);
    }
}

// 游戏主循环
function gameLoop() {
    moveSnake();
    if (checkCollision()) {
        endGame();
        return;
    }
    checkFood();
    drawGame();
}

// 移动蛇
function moveSnake() {
    // 创建新的蛇头
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // 将新头部添加到蛇的前面
    snake.unshift(head);
    
    // 移除蛇尾
    snake.pop();
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查边界碰撞
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        return true;
    }
    
    // 检查自身碰撞
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查食物
function checkFood() {
    const head = snake[0];
    
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        document.getElementById('score').textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            document.getElementById('high-score').textContent = highScore;
        }
        
        // 生成新食物
        generateFood();
        
        // 增加蛇的长度
        const tail = { ...snake[snake.length - 1] };
        snake.push(tail);
    }
}

// 生成食物
function generateFood() {
    let newFood;
    let isFoodOnSnake;
    
    do {
        isFoodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
        
        // 检查食物是否在蛇身上
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isFoodOnSnake = true;
                break;
            }
        }
    } while (isFoodOnSnake);
    
    food = newFood;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制蛇
    ctx.fillStyle = '#4CAF50';
    for (let segment of snake) {
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    }
    
    // 绘制食物
    ctx.fillStyle = '#f44336';
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
}

// 处理键盘输入
function handleKeyPress(event) {
    // 防止蛇直接反向移动
    const key = event.key;
    
    if (key === 'ArrowUp' && direction.y !== 1) {
        direction = { x: 0, y: -1 };
        if (!isGameRunning) {
            startGame();
        }
    } else if (key === 'ArrowDown' && direction.y !== -1) {
        direction = { x: 0, y: 1 };
        if (!isGameRunning) {
            startGame();
        }
    } else if (key === 'ArrowLeft' && direction.x !== 1) {
        direction = { x: -1, y: 0 };
        if (!isGameRunning) {
            startGame();
        }
    } else if (key === 'ArrowRight' && direction.x !== -1) {
        direction = { x: 1, y: 0 };
        if (!isGameRunning) {
            startGame();
        }
    }
}

// 结束游戏
function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;
    alert(`游戏结束！你的分数是: ${score}`);
}

// 页面加载完成后初始化游戏
window.addEventListener('load', init);