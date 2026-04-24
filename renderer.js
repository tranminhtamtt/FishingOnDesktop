'use strict';

const { ipcRenderer } = require('electron');

let isExpanded = false;

// DOM Elements
const fishingDock = document.getElementById('fishing-dock');
const btnExpand = document.getElementById('btn-expand');
const btnShrink = document.getElementById('btn-shrink');
const shopBtn = document.getElementById('shop-btn');
const shopSidebar = document.getElementById('shop-sidebar');
const waterArea = document.getElementById('water-area');
const aquariumContainer = document.getElementById('aquarium-container');
const interactiveElements = document.querySelectorAll('.interactive-ui');

// ─── Constants ──────────────────────────────────────────────────────────────
// Đã đồng bộ mốc pixel khớp 100% với bán kính sóng nước (ring) của CSS
const STAGE_SIZES = [260, 300, 500, 700, 900]; // 0 = ẩn, 1 = nhỏ, 2 = bình thường, 3 = to, 4 = cực to
const SHOP_MIN_SIZE = 550; // Kích thước sàn tối thiểu khi mở Shop đã tăng lên để nóc Panel không đâm trần
let currentLevel = 0;

// --- LOGIC KINH TẾ ---
let userGold = 0;
const TIER_PRICES = {
    "COMMON": 2,
    "RARE": 10,
    "EPIC": 50,
    "MYTHIC": 150,
    "LEGENDARY": 500
};

// --- AUDIO FX (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSoundFX(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'COMMON') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'RARE') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(900, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'EPIC') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'MYTHIC') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 10;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start(now);
        lfo.stop(now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
    } else if (type === 'LEGENDARY') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + 1.0);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(50, now);
        osc2.frequency.exponentialRampToValueAtTime(10, now + 1.5);
        const gain2 = audioCtx.createGain();
        gain2.gain.setValueAtTime(0.6, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 1.5);
        
        osc.start(now);
        osc.stop(now + 1.5);
    } else if (type === 'HOOK') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// Hàm cập nhật hiển thị tiền trên UI
function updateGoldUI() {
    const goldSpan = document.getElementById('user-gold');
    if (goldSpan) goldSpan.innerText = userGold.toLocaleString();
}

// Hàm bán cá
window.sellFish = function (tier, char) {
    const price = TIER_PRICES[tier] || 2;
    userGold += price;

    // Cập nhật lại số lượng trong Inventory DOM
    let existingItem = document.getElementById('inv-' + char);
    if (existingItem) {
        let count = parseInt(existingItem.getAttribute('data-count')) - 1;
        if (count <= 0) {
            existingItem.remove();
            // Nếu giỏ trống thì hiện lại thông báo
            let list = document.getElementById('inventory-list');
            if (list && list.children.length === 0) {
                list.innerHTML = '<span style="font-size: 0.8rem; color: #7f8fa6;">(Giỏ cá đang trống)</span>';
            }
        } else {
            existingItem.setAttribute('data-count', count);
            existingItem.querySelector('.item-info').innerHTML = `<span>${char} Cá</span> <span>x${count}</span>`;
        }
    }

    updateGoldUI();
};
function updateWindowSize() {
    let requiredSize = STAGE_SIZES[currentLevel];
    // Nếu mở Shop, luôn ép khung câu to tối thiểu 500px để không bị xén (nhưng không hiện sóng nước vượt cấp)
    if (isShopOpen && requiredSize < SHOP_MIN_SIZE) {
        requiredSize = SHOP_MIN_SIZE;
    }
    ipcRenderer.send('set-window-size', requiredSize);
}

function updateLevelVisuals() {
    updateWindowSize();

    // Cập nhật class CSS để hiển thị đúng số "sóng nước" trên UI
    waterArea.className = ''; // Xóa sạch state cũ
    if (currentLevel > 0) {
        waterArea.classList.add('level-' + currentLevel);
    }
    // Ghi chú: Chuyển hoàn toàn việc ẩn/hiện bầy cá bằng cờ b.sprite.visible thay vì tắt cả DOM
    // Tắt DOM bằng display: none sẽ làm hỏng hoàn toàn thuật toán dò kích thước của PixiJS.
}

// ─── 1. Xử lý Mở Rộng 4 Mức Độ Cửa Sổ (Phạm vi câu cá) qua 2 nút ➕ ➖ ───────────────
fishingDock.addEventListener('click', (e) => {
    // Nếu click trực tiếp vào người câu cá (không phải 2 nút +-), reset về level 0 (đóng)
    if (e.target.id === 'fishing-dock' || e.target.id === 'dock-icon') {
        currentLevel = 0;
        updateLevelVisuals();
    }
});

btnExpand.addEventListener('click', (e) => {
    e.stopPropagation(); // Ngăn click nhầm vào dock
    if (currentLevel < 4) {
        currentLevel++;
        updateLevelVisuals();
    }
});

btnShrink.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLevel > 0) {
        currentLevel--;
        updateLevelVisuals();
    }
});

// ─── Xử lý Bật/Tắt Sidebar Shop ──────────────────────────────────────────────
let isShopOpen = false;
shopBtn.addEventListener('click', () => {
    isShopOpen = !isShopOpen;

    if (isShopOpen) {
        shopSidebar.classList.add('expanded');
        // Đổi nút thành X (chứ không phải chữ dài)
        shopBtn.innerText = '❌';
    } else {
        shopSidebar.classList.remove('expanded');
        shopBtn.innerText = '🏕️';
    }
    updateWindowSize();
});

// --- TAB & THEME LOGIC ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if(targetContent) targetContent.classList.add('active');
    });
});

const selFisherman = document.getElementById('sel-fisherman');
const selDock = document.getElementById('sel-dock');
const selSea = document.getElementById('sel-sea');
const fishermanImg = document.getElementById('fisherman-img');

function loadSettings() {
    let savedFisherman = localStorage.getItem('theme_fisherman') || '1';
    let savedDock = localStorage.getItem('theme_dock') || '1';
    let savedSea = localStorage.getItem('theme_sea') || '1';

    if (selFisherman) selFisherman.value = savedFisherman;
    if (selDock) selDock.value = savedDock;
    if (selSea) selSea.value = savedSea;

    applyTheme();
}

function applyTheme() {
    let fVal = selFisherman ? selFisherman.value : '1';
    let dVal = selDock ? selDock.value : '1';
    let sVal = selSea ? selSea.value : '1';

    // Update Fisherman
    if (fishermanImg) {
        let suffix = fVal === '1' ? '' : fVal;
        fishermanImg.src = `assets/fisherman${suffix}.png`;
    }

    // Update Dock
    let dockSuffix = dVal === '1' ? '' : dVal;
    document.documentElement.style.setProperty('--dock-bg', `url('assets/vach-da${dockSuffix}.png')`);

    // Update Sea
    let seaPrefix = sVal === '1' ? 'bien' : `bien-t${sVal}`;
    document.documentElement.style.setProperty('--sea-lvl-1', `url('assets/${seaPrefix}-1.png')`);
    document.documentElement.style.setProperty('--sea-lvl-2', `url('assets/${seaPrefix}-2.png')`);
    document.documentElement.style.setProperty('--sea-lvl-3', `url('assets/${seaPrefix}-3.png')`);
    document.documentElement.style.setProperty('--sea-lvl-4', `url('assets/${seaPrefix}-4.png')`);
}

if (selFisherman) {
    selFisherman.addEventListener('change', () => {
        localStorage.setItem('theme_fisherman', selFisherman.value);
        applyTheme();
    });
}
if (selDock) {
    selDock.addEventListener('change', () => {
        localStorage.setItem('theme_dock', selDock.value);
        applyTheme();
    });
}
if (selSea) {
    selSea.addEventListener('change', () => {
        localStorage.setItem('theme_sea', selSea.value);
        applyTheme();
    });
}

// Gọi hàm nạp cài đặt ngay khi khởi động
loadSettings();


// Trạng thái Focus (Bắt Key Windows) cực hay dành cho sếp
const focusBtn = document.getElementById('focus-btn');
focusBtn.addEventListener('click', () => {
    // Chỉ cần click vào nó thì Cửa Sổ Overlay TỰ ĐỘNG dành quyền Focus từ OS, bắt được mọi phím cứng!
});

// Khi cửa sổ có quyền nhận phím
window.addEventListener('focus', () => {
    focusBtn.innerText = '🟢';
    focusBtn.style.borderColor = '#2ecc71';
});

// Khi sếp qua chát hoặc lướt web (mất quyền nhận phím WASD cấn)
window.addEventListener('blur', () => {
    focusBtn.innerText = '🔴';
    focusBtn.style.borderColor = '#e74c3c';

    // Tự thả lỏng tất cả nút khi nhảy tab để cá tự do trôi dạt chứ ko bị Đứt Dây oan uổng
    for (let k in keysDown) keysDown[k] = false;
});

// ─── 2. Quản lý Click-through (Pointer Events Cấp Hệ Điều Hành) ───────────────
// Lắng nghe sự kiện di chuột (mouseenter/mouseleave) trên các thành phần UI
// để báo cho Main Process biết có nên cho phép click xuyên qua hay không.

interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        // Khi chuột nằm TRÊN các phần tử UI của ta (Button, Sidebar)
        // Báo cho Main Process TẮT tính năng ignoreMouseEvents
        // => Cửa sổ Desktop Overlay sẽ BẮT LẤY click chuột.
        ipcRenderer.send('set-ignore-mouse-events', false);
    });

    el.addEventListener('mouseleave', () => {
        // Khi chuột RỜI KHỎI UI, trở về bơi lội với cá
        // Báo cho Main Process BẬT LẠI tính năng ignoreMouseEvents
        // => Click chuột sẽ được ĐẨY XUYÊN XUỐNG ứng dụng bên dưới (VS Code, Chrome...)
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
    });
});

// ─── 3. Khởi tạo Kích thước ban đầu ──────────────────────────────────────────
// Đảm bảo trạng thái render đúng với Compact Mode ngay từ đầu
updateWindowSize();

// ─── 4. Tích hợp PixiJS và Thuật toán Boids ──────────────────────────────────
const PIXI = require('pixi.js');
const { BoidsSystem } = require('./boids.js');

(async () => {
    const aquariumContainer = document.getElementById('aquarium-container');
    const app = new PIXI.Application();

    // Khởi tạo app PixiJS trong suốt
    await app.init({
        backgroundAlpha: 0,
        resizeTo: aquariumContainer,
    });
    aquariumContainer.appendChild(app.canvas);

    const boidsSys = new BoidsSystem(app); // Số lượng và chuẩn loại cố định từ thuật toán Boids

    // Dây câu / cần câu
    const fishingLine = new PIXI.Graphics();
    app.stage.addChild(fishingLine);

    let mousePos = { x: -1, y: -1 };

    // --- STATE MACHINE CÂU CÁ ---
    let fishingState = 'IDLE'; // IDLE | FISHING | BITING | REELING
    let bobberPos = { x: -1, y: -1 };
    let hookedBoid = null; // Cá đang cắn câu

    // Đối tượng Text báo phím cho Minigame
    const promptText = new PIXI.Text({ text: '', style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold', dropShadow: true, dropShadowColor: 0x000000, dropShadowDistance: 2 } });
    promptText.anchor.set(0.5);
    app.stage.addChild(promptText);

    // --- STRUGGLE MINIGAME ---
    let fishPhase = 'STRUGGLING'; // 'STRUGGLING' | 'TIRED'
    let lineTension = 0; // 0 -> 100
    let struggleDir = null;
    let phaseTimer = 0;
    let bitingEscapeTimer = 0; // Thời gian cá bỏ mồi nếu sếp bận ko kéo
    let outOfBoundsTimer = 0; // Bộ đếm lùi khi cá chạy ra ngoài màn hình
    let reelProgress = 0;
    let lastSpamKey = null; // Tránh giữ 1 nút chết tay

    // Track phím đang giữ
    let keysDown = {};

    window.addEventListener('mousemove', (e) => {
        if (fishingState === 'IDLE') {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        }
    });

    window.addEventListener('keyup', (e) => {
        keysDown[e.key.toLowerCase()] = false;
    });

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keysDown[key] = true;

        // 1. Quăng câu (Space / Enter)
        if ((e.code === 'Space' || e.code === 'Enter') && fishingState === 'IDLE' && currentLevel > 0) {
            let distFromDock = Math.hypot(window.innerWidth - mousePos.x, window.innerHeight - mousePos.y);
            if (distFromDock > STAGE_SIZES[currentLevel]) {
                // Chỉ cho quăng câu trong vùng nước mở
                return;
            }

            fishingState = 'FISHING';
            bobberPos = { x: mousePos.x, y: mousePos.y }; // Chốt vị trí phao rơi

            // Kích hoạt mồi trong boidsSys
            boidsSys.targetBait = { x: bobberPos.x, y: bobberPos.y, active: true };
            return;
        }

        // 2. Lure mồi (W, A, S, D) di chuyển nhẹ cái phao lúc FISHING
        if (fishingState === 'FISHING') {
            const lureSpeed = 15;
            if (key === 'w') bobberPos.y -= lureSpeed;
            if (key === 's') bobberPos.y += lureSpeed;
            if (key === 'a') bobberPos.x -= lureSpeed;
            if (key === 'd') bobberPos.x += lureSpeed;

            boidsSys.targetBait.x = bobberPos.x;
            boidsSys.targetBait.y = bobberPos.y;
        }

        // 3. Mini-game Bắt đầu Khởi động kéo (Nhấn 1 phím bất kì để đánh thức cá)
        if (fishingState === 'BITING' && ['w', 'a', 's', 'd'].includes(key)) {
            fishingState = 'REELING';
            fishPhase = 'STRUGGLING';
            outOfBoundsTimer = 0; // Khởi tạo an toàn
            return;
        }

        // 4. Mini-game Spam phím
        if (fishingState === 'REELING') {
            if (fishPhase === 'STRUGGLING' && ['w', 'a', 's', 'd'].includes(key)) {
                // Sếp phải bóp WASD LUÂN PHIÊN liên tục, KHÔNG được đè 1 nút!
                if (key !== lastSpamKey) {
                    let points = typeof hookedBoid !== 'undefined' ? (4 / (hookedBoid.diff || 1.0)) : 10;
                    lineTension += points;
                    lastSpamKey = key; // Lưu lại để bắt nhịp bấm đổi phím

                    if (lineTension >= 100) {
                        // Thanh gồng đã đầy, cá mệt xỉu
                        fishPhase = 'TIRED';
                        lineTension = 0; // Xả thanh
                        phaseTimer = typeof hookedBoid !== 'undefined' ? (hookedBoid.tire || 4000) : 4000;
                        lastSpamKey = null; // Reset spam
                    }
                }
            } else if (fishPhase === 'TIRED' && (key === 'w' || key === 's')) {
                reelProgress += 4; // Bóp nặng tay hơn, kéo siêu lâu!
            }
        }
    });

    app.ticker.add((ticker) => {
        // Ghi chú: Cá được bơi tự do vô tận full toàn màn hình để tạo cảm giác Đại dương chân thực.
        // NHƯNG chúng chỉ "hiện hình" khi đi vào phạm vi chiếu sáng của Sóng nước (currentWaterRadius).

        // Truyền delta time
        boidsSys.update(ticker.deltaTime);

        // Tọa độ đầu cần câu (Căn chỉnh để dây cước bắt vít chính xác vào chóp ngọn cần câu trong ảnh mớI)
        const dockX = window.innerWidth - 115;
        const dockY = window.innerHeight - 105;

        // Vẽ diễn biến câu cá theo State
        fishingLine.clear();

        if (currentLevel > 0) {
            if (fishingState === 'IDLE' && mousePos.x !== -1 && mousePos.y !== -1) {
                // AIMING: Vẽ tia nét đứt mờ
                fishingLine.moveTo(dockX, dockY);
                // Tạo một quadratic nhẹ để biết đường quăng
                // Pixi v8 dash không hỗ trợ sẵn dễ dàng, ta dùng vòng lặp chấm mờ
                let steps = 10;
                for (let i = 0; i <= steps; i++) {
                    let t = i / steps;
                    let pX = (1 - t) * (1 - t) * dockX + 2 * (1 - t) * t * ((dockX + mousePos.x) / 2) + t * t * mousePos.x;
                    let pY = (1 - t) * (1 - t) * dockY + 2 * (1 - t) * t * (Math.max(dockY, mousePos.y) + 30) + t * t * mousePos.y;
                    fishingLine.circle(pX, pY, 2).fill({ color: 0xffffff, alpha: 0.4 });
                }
            }
            else if (fishingState !== 'IDLE') {
                // Kiểm tra xem có cá nào cắn câu không (khi đang FISHING)
                if (fishingState === 'FISHING' && boidsSys.targetBait && boidsSys.targetBait.active) {
                    for (let b of boidsSys.boids) {
                        if (b.sprite.visible) {
                            // Dùng tọa độ sprite hiển thị thật của cá trên màn
                            let dToBobber = Math.hypot(b.sprite.x - bobberPos.x, b.sprite.y - bobberPos.y);
                            if (dToBobber < 5) { // Sát vào mỏ mới cắn! < 5px
                                fishingState = 'BITING';
                                hookedBoid = b;
                                playSoundFX('HOOK');
                                // Tắt ngay sóng mồi để các con cá khác lơ đi
                                boidsSys.targetBait.active = false;

                                // Khởi tạo minigame (Đợi người dùng ấn WASD thì mới vào STRUGGLING)
                                fishPhase = 'IDLE'; // Chưa dẫy cho đến lúc người chơI giật need
                                lineTension = 0;
                                bitingEscapeTimer = hookedBoid.biteWait || 20000; // Thời gian cá ngậm chờ kéo (max 20s)
                                break;
                            }
                        }
                    }
                }

                // Kéo cá rít vào ngọn cần (Giằng co)
                let targetX = bobberPos.x;
                let targetY = bobberPos.y;
                let curveDepth = 30;

                // CĂN CHỈNH THỜI GIAN CHỜ SẾP
                if (fishingState === 'BITING') {
                    bitingEscapeTimer -= ticker.deltaTime * 16.66;

                    if (bitingEscapeTimer <= 0) {
                        // CHỜ LÂU QUÁ CÁ NÓ NHẢ NHẢ! (ESCAPE)
                        fishingState = 'IDLE'; // Reset
                        if (hookedBoid) {
                            hookedBoid.sprite.visible = true; // Thả cá về sông
                            hookedBoid = null;
                        }
                        promptText.visible = false;
                        return; // Thoát vẽ dây frame này
                    }

                    targetX += (Math.random() - 0.5) * 15; // Giật nhẹ nhàng tinh tế như sếp muốn
                    targetY += (Math.random() - 0.5) * 15;
                    curveDepth = Math.random() * 80;

                    promptText.visible = true;
                    promptText.text = "A/S/W/D";
                    promptText.x = targetX;
                    promptText.y = targetY - 60;
                    promptText.style.fill = 0xe74c3c; // Chữ Đỏ
                    promptText.alpha = (Math.sin(ticker.lastTime / 150) + 1) / 2; // Nhấp nháy chớp tắt
                }

                // Kéo cá rít vào ngọn cần (Giằng co)
                if (fishingState === 'REELING') {
                    const diffScale = hookedBoid.diff || 1.5;
                    const tensionUpScale = hookedBoid.tensionUp || 0.5;
                    let dx = dockX - bobberPos.x;
                    let dy = dockY - bobberPos.y;
                    let dist = Math.hypot(dx, dy);

                    // Chuyển phase TIRED -> STRUGGLING khi hết giờ mệt
                    if (fishPhase === 'TIRED') {
                        let dtMs = ticker.deltaTime * 16.66;
                        phaseTimer -= dtMs;
                        if (phaseTimer <= 0) {
                            fishPhase = 'STRUGGLING';
                        }
                    }

                    if (fishPhase === 'STRUGGLING') {
                        // Trừ điểm lineTension dần dần nếu sếp ngừng bấm!
                        lineTension = Math.max(0, lineTension - ticker.deltaTime * 0.5);

                        // Giảm tốc độ cá bơi khi đang quẫy cước như sếp dặn
                        let pullForce = diffScale * 0.4;

                        // Tính góc khiến cá luôn có xu hướng bơi RA XA khỏI bến
                        if (dist > 1) {
                            bobberPos.x -= (dx / dist) * pullForce;
                            bobberPos.y -= (dy / dist) * pullForce;
                        } else {
                            bobberPos.x -= pullForce;
                            bobberPos.y -= pullForce;
                        }

                        // Hiệu ứng cá vật lộn dữ dội rung tại chỗ
                        targetX += (Math.random() - 0.5) * 20;
                        targetY += (Math.random() - 0.5) * 20;

                        // Chữ nhắc trên phao
                        promptText.visible = true;
                        promptText.text = "SPAM W/A/S/D";
                        promptText.x = targetX;
                        promptText.y = targetY - 60;
                        promptText.style.fill = 0xe74c3c;
                        promptText.alpha = 1;

                    } else if (fishPhase === 'TIRED') {
                        // Cá mệt nằm im, nhưng VẪN rung dẫy cho cảm giác nhịp đập (Yêu cầu user)
                        targetX += (Math.random() - 0.5) * 8;
                        targetY += (Math.random() - 0.5) * 8;

                        // Lực kéo của người chơi thu về
                        if (reelProgress > 0 && dist > 10) {
                            bobberPos.x += (dx / dist) * reelProgress;
                            bobberPos.y += (dy / dist) * reelProgress;
                            reelProgress *= 0.85; // Ma sát
                        }
                        promptText.visible = true;
                        promptText.text = "SPAM W+S";
                        promptText.x = targetX;
                        promptText.y = targetY - 60;
                        promptText.style.fill = 0x2ecc71;
                        promptText.alpha = 1;
                    }

                    // Kiểm tra Đứt dây do trôi ra quá xa rìa màn hình HOẶC trôi ra khỏi vùng nước giới hạn
                    const currentWaterRadius = currentLevel > 0 ? STAGE_SIZES[currentLevel] : 0;
                    let distanceFromDock = Math.hypot(window.innerWidth - bobberPos.x, window.innerHeight - bobberPos.y);
                    let outOfBounds = bobberPos.x < 0 || bobberPos.x > window.innerWidth || bobberPos.y < 0 || bobberPos.y > window.innerHeight || (currentWaterRadius > 0 && distanceFromDock > currentWaterRadius);

                    if (outOfBounds) {
                        outOfBoundsTimer += ticker.deltaTime * 16.66;

                        // Đè chữ nháy đỏ cảnh báo đứt dây
                        promptText.visible = true;
                        promptText.text = "KÉO LẠI!!!";
                        promptText.style.fill = 0xe74c3c;
                        promptText.alpha = (Math.sin(ticker.lastTime / 100) + 1) / 2;

                        // Chờ 2.5 giây ân hạn rồi mới cắt đứt
                        if (outOfBoundsTimer > 2500) {
                            // ĐỨT DÂY MẤT CÁ
                            fishingState = 'IDLE'; // Reset
                            if (hookedBoid) {
                                hookedBoid.sprite.visible = true; // Thả cá về sông
                                hookedBoid = null;
                            }
                            promptText.visible = false;
                            return; // Bỏ qua đoạn Render bên dưới
                        }
                    } else {
                        // Kéo được trở vào trong thì reset
                        outOfBoundsTimer = 0;
                    }

                    // Tính khoảng cách cước đến cần câu
                    let distToDock = Math.hypot(dockX - bobberPos.x, dockY - bobberPos.y);

                    // ===== HỢP NHẤT KHỐI LOGIC CÂU CÁ (Xóa bỏ dải lỗi và popup tàng hình) =====
                    if (distToDock < 70 && hookedBoid) {
                        try {
                            // Cập nhật Inventory (Kho Đồ Shop)
                            let list = document.getElementById('inventory-list');
                            let itemChar = hookedBoid.char || '🐟';
                            let itemTier = hookedBoid.tier || "COMMON";
                            let existingItem = document.getElementById('inv-' + itemChar);

                            if (existingItem) {
                                let count = parseInt(existingItem.getAttribute('data-count')) + 1;
                                existingItem.setAttribute('data-count', count);
                                existingItem.querySelector('.item-info').innerHTML = `<span>${itemChar} Cá</span> <span>x${count}</span>`;
                            } else if (list) {
                                // Xóa dòng chữ trống giỏ khi bắt được con đầu tiên
                                if (list.innerText.includes('(Giỏ cá đang trống)') || list.innerText.includes('(Chưa có con nào)')) {
                                    list.innerHTML = '';
                                }

                                list.innerHTML += `
                                    <div class="shop-item" id="inv-${itemChar}" data-count="1" style="flex-direction: column; align-items: stretch; gap: 8px;">
                                        <div class="item-info" style="display: flex; justify-content: space-between;">
                                            <span>${itemChar} Cá</span> <span>x1</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-size: 0.7rem; color: ${hookedBoid.tierColor || '#bdc3c7'}">${itemTier}</span>
                                            <button class="btn-sell" onclick="sellFish('${itemTier}', '${itemChar}')">BÁN (${TIER_PRICES[itemTier] || 2}🪙)</button>
                                        </div>
                                    </div>`;
                            }


                            // Kích hoạt giao diện UI V3 (Gacha Cinematic)
                            let catchOverlay = document.getElementById('catch-overlay');
                            if (catchOverlay) {
                                // 1. CHUẨN BỊ UI: Hiện màn đen, giấu cá, bật chữ Suspense
                                catchOverlay.style.display = 'flex';
                                catchOverlay.className = '';

                                // Ép buộc nhận click cho toàn bộ khối Overlay
                                catchOverlay.style.pointerEvents = 'auto';
                                ipcRenderer.send('set-ignore-mouse-events', false);

                                let catchContent = document.getElementById('catch-content');
                                let catchSuspense = document.getElementById('catch-suspense');
                                catchContent.style.display = 'none';
                                catchSuspense.style.display = 'block';

                                let catchRays = document.getElementById('catch-rays');
                                if (catchRays) {
                                    catchRays.style.opacity = '0';
                                    catchRays.style.animation = 'none';
                                }

                                let itemTierClass = (itemTier || "COMMON").toLowerCase();
                                let tierColor = hookedBoid.tierColor || "#bdc3c7";
                                let fishIsImg = hookedBoid.isImg;
                                let fishImgSrc = hookedBoid.imgSrc;

                                catchSuspense.style.textShadow = `0 0 30px ${tierColor}, 0 0 10px ${tierColor}`;
                                catchSuspense.style.animation = 'suspenseShake 0.15s infinite';

                                // 2. TÍNH TOÁN THỜI GIAN NÍN THỞ
                                let suspenseDelay = 500;
                                if (itemTier === "RARE") suspenseDelay = 1000;
                                if (itemTier === "EPIC") suspenseDelay = 2000;
                                if (itemTier === "MYTHIC") suspenseDelay = 3000;
                                if (itemTier === "LEGENDARY") suspenseDelay = 4000;

                                // --- FIX LỖI CLICK: BẤM BẤT KỲ ĐÂU TRÊN MÀN HÌNH ĐỂ TẮT ---
                                catchOverlay.onclick = () => {
                                    // Chỉ cho phép tắt khi đã qua thời gian "nín thở" (chữ suspense đã bị giấu đi)
                                    if (catchSuspense.style.display === 'none') {
                                        catchOverlay.style.display = 'none';
                                        catchOverlay.className = '';
                                        catchOverlay.style.pointerEvents = 'none'; // Trả lại click xuyên thấu
                                        if (catchRays) {
                                            catchRays.style.opacity = '0';
                                            catchRays.style.animation = 'none';
                                        }
                                        let particleContainer = document.getElementById('catch-particles');
                                        if (particleContainer) particleContainer.innerHTML = ''; // Clear particles
                                        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
                                    }
                                };

                                // 3. PHA VỠ ÒA (BÙM!!!)
                                setTimeout(() => {
                                    playSoundFX(itemTier);
                                    
                                    catchSuspense.style.display = 'none';
                                    catchOverlay.classList.add(`bg-${itemTierClass}`);
                                    catchContent.style.display = 'flex';

                                    let catchTierDom = document.getElementById('catch-tier');
                                    catchTierDom.innerText = itemTier;
                                    catchTierDom.style.color = tierColor;
                                    catchTierDom.style.animation = 'none';
                                    catchTierDom.offsetHeight;
                                    catchTierDom.style.animation = 'pulseTierText 2s infinite';

                                    let catchEmoji = document.getElementById('catch-emoji');
                                    catchEmoji.style.animation = 'none';
                                    catchEmoji.offsetHeight;

                                    if (fishIsImg && fishImgSrc) {
                                        catchEmoji.innerHTML = `<img src="${fishImgSrc}" style="height: 200px; transform: scaleX(-1); object-fit: contain;">`;
                                    } else {
                                        catchEmoji.innerText = itemChar;
                                        catchEmoji.style.fontSize = "180px";
                                    }
                                    catchEmoji.style.animation = 'gachaRevealFish 1.5s cubic-bezier(0.25, 1, 0.25, 1) forwards';

                                    let catchFlash = document.getElementById('catch-flash');
                                    catchFlash.style.animation = 'none';
                                    catchFlash.offsetHeight;

                                    // HIỆU ỨNG NÂNG CAO TÙY THEO ĐỘ HIẾM
                                    if (itemTier === "EPIC" || itemTier === "MYTHIC" || itemTier === "LEGENDARY") {
                                        let particleContainer = document.getElementById('catch-particles');
                                        if (particleContainer) {
                                            particleContainer.innerHTML = '';
                                            let count = itemTier === "EPIC" ? 40 : (itemTier === "MYTHIC" ? 80 : 150);
                                            for(let i = 0; i < count; i++) {
                                                let p = document.createElement('div');
                                                p.className = 'particle';
                                                p.style.left = '50%';
                                                p.style.top = '50%';
                                                let angle = Math.random() * Math.PI * 2;
                                                let velocity = 100 + Math.random() * (itemTier === "LEGENDARY" ? 600 : 300);
                                                let tx = Math.cos(angle) * velocity;
                                                let ty = Math.sin(angle) * velocity;
                                                p.style.setProperty('--tx', `${tx}px`);
                                                p.style.setProperty('--ty', `${ty}px`);
                                                p.style.background = Math.random() > 0.5 ? tierColor : '#ffffff';
                                                let size = 4 + Math.random() * (itemTier === "LEGENDARY" ? 16 : 8);
                                                p.style.width = `${size}px`;
                                                p.style.height = `${size}px`;
                                                p.style.boxShadow = `0 0 ${size}px ${tierColor}`;
                                                p.style.animation = `particleExplode ${0.8 + Math.random() * 1.5}s cubic-bezier(0.25, 1, 0.25, 1) forwards`;
                                                particleContainer.appendChild(p);
                                            }
                                        }
                                    }

                                    if (itemTier === "EPIC") {
                                        catchOverlay.style.animation = 'screenQuake 0.4s ease-in-out';
                                        catchFlash.style.animation = 'flashBangEffect 0.6s ease-out forwards';
                                    } else if (itemTier === "MYTHIC") {
                                        catchOverlay.style.animation = 'intenseQuake 0.8s ease-in-out';
                                        catchFlash.style.animation = 'flashBangEffect 1s ease-out forwards';
                                        catchRays.style.opacity = '0.7';
                                        catchRays.style.background = `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, ${tierColor}60 15deg 30deg)`;
                                        catchRays.style.animation = 'spinRaysVortex 10s linear infinite';
                                    } else if (itemTier === "LEGENDARY") {
                                        catchOverlay.style.animation = 'intenseQuake 1.5s ease-in-out';
                                        catchFlash.style.animation = 'flashBangEffect 1.5s ease-out forwards';
                                        catchRays.style.opacity = '1';
                                        catchRays.style.background = `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, ${tierColor}90 15deg 30deg)`;
                                        catchRays.style.animation = 'spinRaysVortex 6s linear infinite';
                                        
                                        // Ghi đè text và animation của cá cho Legendary
                                        catchTierDom.style.animation = 'pulseLegendaryText 1s infinite';
                                        catchEmoji.style.animation = 'legendaryFishReveal 2.5s cubic-bezier(0.25, 1, 0.25, 1) forwards';
                                    }

                                }, suspenseDelay);
                            }
                        } catch (e) {
                            console.error("Catch UI Error: ", e);
                        }

                        // Xử lý logic boid biến mất & respawn (Sống còn)
                        hookedBoid.respawnTimer = 120000 + Math.random() * 60000;
                        hookedBoid.sprite.visible = false;
                        hookedBoid.position.x = -9999; // Đẩy ra khỏi màn hình ngay lập tức để né lỗi render
                        hookedBoid = null;

                        fishingState = 'IDLE';
                        boidsSys.targetBait.active = false;
                        promptText.visible = false;
                    }

                    // Update vị trí con cá bị bắt bơi theo phao, giãy giụa ngang dọc
                    if (hookedBoid) {
                        if (fishPhase === 'STRUGGLING') hookedBoid.sprite.rotation += (Math.random() - 0.5) * 2; // Quẫy điên loạn
                        else hookedBoid.sprite.rotation = 0; // Đuối xụi lơ

                        // Lôi ngược trục internal position về theo màn hình vật lý thực (Trừ đi window)
                        hookedBoid.position.x = bobberPos.x - window.innerWidth;
                        hookedBoid.position.y = bobberPos.y + 10 - window.innerHeight;
                    }

                    targetX = bobberPos.x;
                    targetY = bobberPos.y;

                    // Vẽ Progress Bar sức chịu đựng của cá (Đầy thì nó mới Mệt - Xanh là tốt)
                    fishingLine.rect(targetX - 25, targetY - 40, 50, 6).fill({ color: 0x333333 });
                    let progColor = lineTension > 75 ? 0x2ecc71 : (lineTension > 40 ? 0xf1c40f : 0xe74c3c);
                    fishingLine.rect(targetX - 25, targetY - 40, 50 * (Math.min(100, lineTension) / 100), 6).fill({ color: progColor });
                    curveDepth = 10; // Căng dây cước cứng ngắc khi lôi
                }

                // Vẽ dây câu thực nguyên bản từ mũi cần
                fishingLine.moveTo(dockX, dockY);
                fishingLine.quadraticCurveTo(
                    (dockX + targetX) / 2, Math.max(dockY, targetY) + curveDepth,
                    targetX, targetY
                );
                fishingLine.stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });

                // Vẽ Phao nổi
                fishingLine.circle(targetX, targetY, 4).fill({ color: 0xe74c3c });
                fishingLine.circle(targetX, targetY - 4, 3).fill({ color: 0xffffff });
            }
        } else {
            // Khi IDLE hoặc không có level, ẩn bảng nhắc
            if (typeof promptText !== 'undefined') promptText.visible = false;
        }

        // CÁ CHỈ HIỂN THỊ TRONG VÙNG NƯỚC XANH
        // Tính toán bán kính vùng nước xanh theo level hiện tại
        const currentWaterRadius = currentLevel > 0 ? STAGE_SIZES[currentLevel] : 0;

        // Tự động thu hồi cần câu nếu Vùng Nước bị đóng lại hụt diện tích phao
        if (fishingState !== 'IDLE') {
            let distFromDock = Math.hypot(window.innerWidth - bobberPos.x, window.innerHeight - bobberPos.y);
            if (distFromDock > currentWaterRadius) {
                // Chỉ thu lập tức nếu phao đang thả thính (Chưa cắn câu). 
                // Khi đang lôi cá (REELING) thì hệ thống trên sẽ có độ trễ 2.5s để ngườI chơi giật vào!
                if (fishingState === 'FISHING') {
                    fishingState = 'IDLE';
                    if (hookedBoid) {
                        hookedBoid.sprite.visible = true; // Thả cá
                        hookedBoid = null;
                    }
                    boidsSys.targetBait.active = false;
                    if (typeof promptText !== 'undefined') promptText.visible = false;
                }
            }
        }

        for (let b of boidsSys.boids) {
            let d = Math.hypot(b.position.x, b.position.y);
            // Dùng alpha mờ dần ở ven rìa để cá bơi thoắt ẩn thoắt hiện cực đẹp
            if (currentLevel === 0 || d > currentWaterRadius) {
                b.sprite.alpha = 0;
                b.sprite.visible = false; // Xóa dứt điểm khỏi GPU khi trôi ra ngoài bìa biển
            } else {
                // Fade mượt mà khi tới cách mép nước 40px kết hợp với alpha tự nhiên của cá
                let edgeAlpha = Math.max(0, Math.min(1, (currentWaterRadius - d) / 40));
                let naturalAlpha = b.currentAlpha !== undefined ? b.currentAlpha : 1;
                b.sprite.alpha = naturalAlpha * edgeAlpha;
                b.sprite.visible = b.sprite.alpha > 0;
            }
        }
    });

    console.log('PixiJS & Boids initialized. 🐟');
})();
