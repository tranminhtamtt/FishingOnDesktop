const PIXI = require('pixi.js');

class BoidsSystem {
    constructor(app) {
        this.app = app;
        this.boids = [];
        this.perceptionRadius = 350; // Tầm nhìn xa hơn rấy nhiều vì biển rộng full màn hình
        this.maxForce = 0.05;
        this.maxSpeed = 2;
        this.baitDistance = 13;

        // ===== CẤU HÌNH ĐỘ KHÓ VÀ ẢNH CÁ =====
        const fishTypes = [
            // 1. CÁ BƠI ĐÀN (SCHOOL FISH)
            { char: "🐟", type: "school", size: 14, speed: 0.15, force: 0.002, img: "assets/fish_school_normal.png", diff: 0.4, tensionUp: 0.15, stru: 2500, tire: 2800, biteWait: 20000, tier: "COMMON", color: "#bdc3c7" }, // Normal (Bạc)
            { char: "🐟", type: "school", size: 16, speed: 0.17, force: 0.0025, img: "assets/fish_school_mutant.png", diff: 0.5, tensionUp: 0.18, stru: 3000, tire: 2500, biteWait: 18000, tier: "RARE", color: "#3498db" }, // Mutant (Xanh lam)

            // 2. CÁ NHIỆT ĐỚI (TROPICAL FISH)
            { char: "🐠", type: "solitary", size: 16, speed: 0.18, force: 0.003, img: "assets/fish_tropical_normal.png", diff: 0.5, tensionUp: 0.20, stru: 3000, tire: 2600, biteWait: 18000, tier: "COMMON", color: "#bdc3c7" }, // Normal (Bạc)
            { char: "🐠", type: "solitary", size: 18, speed: 0.21, force: 0.0035, img: "assets/fish_tropical_mutant.png", diff: 0.6, tensionUp: 0.25, stru: 3500, tire: 2200, biteWait: 16000, tier: "RARE", color: "#3498db" }, // Mutant (Xanh lam)

            // 3. TÔM (SHRIMP)
            { char: "🦐", type: "solitary", size: 12, speed: 0.12, force: 0.004, img: "assets/shrimp_normal.png", diff: 0.3, tensionUp: 0.10, stru: 2000, tire: 3000, biteWait: 22000, tier: "COMMON", color: "#bdc3c7" }, // Normal
            { char: "🦐", type: "solitary", size: 14, speed: 0.14, force: 0.004, img: "assets/shrimp_mutant.png", diff: 0.35, tensionUp: 0.12, stru: 2200, tire: 2800, biteWait: 21000, tier: "RARE", color: "#bdc3c7" }, // Mutant

            // 4. CUA (CRAB)
            { char: "🦀", type: "solitary", size: 14, speed: 0.08, force: 0.001, img: "assets/crab_normal.png", diff: 0.45, tensionUp: 0.15, stru: 2800, tire: 2500, biteWait: 20000, tier: "COMMON", color: "#bdc3c7" }, // Normal
            { char: "🦀", type: "solitary", size: 16, speed: 0.10, force: 0.0015, img: "assets/crab_mutant.png", diff: 0.55, tensionUp: 0.20, stru: 3200, tire: 2200, biteWait: 19000, tier: "RARE", color: "#3498db" }, // Mutant

            // 5. CÁ NÓC (PUFFER)
            { char: "🐡", type: "solitary", size: 18, speed: 0.10, force: 0.001, img: "assets/puffer_normal.png", diff: 0.6, tensionUp: 0.25, stru: 3500, tire: 1800, biteWait: 16000, tier: "RARE", color: "#3498db" }, // Normal
            { char: "🐡", type: "solitary", size: 20, speed: 0.12, force: 0.0012, img: "assets/puffer_mutant.png", diff: 0.65, tensionUp: 0.27, stru: 3700, tire: 1600, biteWait: 15500, tier: "RARE", color: "#3498db" }, // Mutant

            // 6. SỨA (JELLYFISH)
            { char: "🪼", type: "solitary", size: 16, speed: 0.05, force: 0.0005, img: "assets/jellyfish_normal.png", diff: 0.5, tensionUp: 0.40, stru: 2500, tire: 2000, biteWait: 18000, tier: "RARE", color: "#3498db" }, // Normal
            { char: "🪼", type: "solitary", size: 18, speed: 0.07, force: 0.0008, img: "assets/jellyfish_mutant.png", diff: 0.6, tensionUp: 0.45, stru: 2800, tire: 1800, biteWait: 17000, tier: "EPIC", color: "#9b59b6" }, // Mutant

            // 7. MỰC (SQUID)
            { char: "🦑", type: "solitary", size: 18, speed: 0.16, force: 0.003, img: "assets/squid_normal.png", diff: 0.65, tensionUp: 0.25, stru: 3800, tire: 1500, biteWait: 16000, tier: "RARE", color: "#3498db" }, // Normal
            { char: "🦑", type: "solitary", size: 20, speed: 0.18, force: 0.0035, img: "assets/squid_mutant.png", diff: 0.75, tensionUp: 0.30, stru: 4200, tire: 1300, biteWait: 15000, tier: "EPIC", color: "#9b59b6" }, // Mutant

            // 8. RÙA (TURTLE)
            { char: "🐢", type: "solitary", size: 28, speed: 0.15, force: 0.0015, img: "assets/turtle_normal.png", diff: 0.7, tensionUp: 0.30, stru: 4000, tire: 1300, biteWait: 15000, tier: "EPIC", color: "#9b59b6" }, // Normal
            { char: "🐢", type: "solitary", size: 30, speed: 0.18, force: 0.0018, img: "assets/turtle_mutant.png", diff: 0.75, tensionUp: 0.35, stru: 4200, tire: 1200, biteWait: 14000, tier: "EPIC", color: "#9b59b6" }, // Mutant

            // 9. CÁ HEO (DOLPHIN)
            { char: "🐬", type: "school", size: 35, speed: 0.22, force: 0.0025, img: "assets/dolphin_normal.png", diff: 0.75, tensionUp: 0.35, stru: 4500, tire: 1200, biteWait: 13000, tier: "EPIC", color: "#9b59b6" }, // Normal
            { char: "🐬", type: "school", size: 38, speed: 0.25, force: 0.003, img: "assets/dolphin_mutant.png", diff: 0.85, tensionUp: 0.40, stru: 5000, tire: 1000, biteWait: 12000, tier: "MYTHIC", color: "#e74c3c" }, // Mutant

            // 10. BẠCH TUỘC (OCTOPUS)
            { char: "🐙", type: "solitary", size: 22, speed: 0.08, force: 0.001, img: "assets/octopus_normal.png", diff: 0.6, tensionUp: 0.28, stru: 3500, tire: 1500, biteWait: 16000, tier: "EPIC", color: "#9b59b6" }, // Normal
            { char: "🐙", type: "solitary", size: 25, speed: 0.10, force: 0.0015, img: "assets/octopus_mutant.png", diff: 0.7, tensionUp: 0.32, stru: 3800, tire: 1300, biteWait: 14500, tier: "MYTHIC", color: "#e74c3c" }, // Mutant

            // 11. CÁ VOI (WHALE)
            { char: "🐋", type: "solitary", size: 50, speed: 0.12, force: 0.001, img: "assets/whale_normal.png", diff: 0.9, tensionUp: 0.55, stru: 6000, tire: 900, biteWait: 10000, tier: "MYTHIC", color: "#e74c3c" }, // Normal
            { char: "🐋", type: "solitary", size: 55, speed: 0.14, force: 0.0015, img: "assets/whale_mutant.png", diff: 0.95, tensionUp: 0.65, stru: 7000, tire: 700, biteWait: 8000, tier: "LEGENDARY", color: "#f1c40f" }, // Mutant

            // 12. CÁ MẬP (SHARK)
            { char: "🦈", type: "solitary", size: 40, speed: 0.20, force: 0.002, img: "assets/shark_normal.png", diff: 0.85, tensionUp: 0.50, stru: 5500, tire: 1000, biteWait: 10000, tier: "LEGENDARY", color: "#f1c40f" }, // Normal
            { char: "🦈", type: "solitary", size: 45, speed: 0.25, force: 0.003, img: "assets/shark_mutant.png", diff: 0.98, tensionUp: 0.70, stru: 6500, tire: 800, biteWait: 8000, tier: "LEGENDARY", color: "#e67e22" } // Mutant
        ];

        // ===== CƠ CHẾ ĐỘ HIẾM (CHILL MODE SPAWNING) =====
        // Mảng này hiện tại có ĐÚNG 24 con số, tương ứng với 24 cấu hình cá phía trên (12 loài x 2)
        const spawnCounts = [
            60, 10,   // Cá bơi đàn: Normal (8), Mutant (3)
            60, 5,   // Cá nhiệt đới: Normal (5), Mutant (2)
            20, 4,   // Tôm: Normal (6), Mutant (4)
            20, 2,   // Cua: Normal (4), Mutant (2)
            20, 2,   // Cá nóc: Normal (3), Mutant (2)
            10, 2,   // Sứa: Normal (2), Mutant (1)
            10, 2,   // Mực: Normal (2), Mutant (1)
            5, 2,   // Rùa: Normal (2), Mutant (1)
            2, 2,   // Cá heo: Normal (2), Mutant (1)
            1, 1,   // Bạch tuộc: Normal (2), Mutant (1)
            1, 1,   // Cá voi: Normal (1), Mutant (1)
            1, 1    // Cá mập: Normal (1), Mutant (1)
        ];

        for (let i = 0; i < fishTypes.length; i++) {
            for (let c = 0; c < spawnCounts[i]; c++) {
                this.boids.push(this.createBoid(fishTypes[i]));
            }
        }
    }
    createBoid(data) {
        let container = new PIXI.Container();

        const fallbackEmoji = () => {
            let txt = new PIXI.Text({ text: data.char, style: { fontSize: data.size } });
            txt.anchor.set(0.5);
            container.addChild(txt);
            let b = this.boids.find(b => b.sprite === container);
            if (b) b.isImg = false;
        };

        if (data.img) {
            let spr = new PIXI.Sprite();
            spr.anchor.set(0.5);

            // Nhuộm đen xì con cá để tạo bóng ma
            spr.tint = 0x000000;

            container.addChild(spr);

            // Tải ảnh phi đồng bộ
            PIXI.Assets.load(data.img).then((texture) => {
                spr.texture = texture;
                spr.height = data.size * 2;
                spr.width = (texture.width / texture.height) * spr.height;
            }).catch((err) => {
                console.warn("Không tìm thấy ảnh: " + data.img);
                container.removeChild(spr);
                fallbackEmoji();
            });
        } else {
            fallbackEmoji();
        }

        this.app.stage.addChild(container);

        // MẶC ĐỊNH SINH RA LÀ TÀNG HÌNH 100% (Mất tích hoàn toàn)
        container.visible = false;

        const screenW = window.innerWidth || 1920;
        const screenH = window.innerHeight || 1080;
        const px = -(Math.random() * screenW);
        const py = -(Math.random() * screenH);
        const a = Math.random() * Math.PI * 2;

        return {
            sprite: container,
            char: data.char,
            type: data.type,
            imgSrc: data.img,
            maxSpeed: data.speed,
            maxForce: data.force,
            tier: data.tier,
            tierColor: data.color,
            diff: data.diff,
            tensionUp: data.tensionUp,
            stru: data.stru,
            tire: data.tire,
            biteWait: data.biteWait,
            isImg: !!data.img,
            wanderAngle: Math.random() * Math.PI * 2,
            position: { x: px, y: py },
            velocity: { x: Math.cos(a) * data.speed, y: Math.sin(a) * data.speed },
            acceleration: { x: 0, y: 0 },

            // Bộ đếm thời gian nháy sẽ được tự động tính toán tùy theo độ hiếm ở hàm update()
            isBlinking: false,
            blinkTimer: undefined
        };
    }

    update(delta) {
        // Fix cứng thời gian delta để bộ đếm nháy luôn chuẩn, chống lỗi NaN
        let dt = (typeof delta === 'number') ? delta : (delta && delta.deltaTime ? delta.deltaTime : 1);

        // Hồi sinh lũ cá đã bị bắt
        for (let b of this.boids) {
            if (b.respawnTimer && b.respawnTimer > 0) {
                b.respawnTimer -= dt * 16.66;
                if (b.respawnTimer <= 0) {
                    b.respawnTimer = 0;
                    const screenW = window.innerWidth;
                    const screenH = window.innerHeight;
                    b.position.x = -(Math.random() * screenW);
                    b.position.y = -(Math.random() * screenH);

                    // Phục sinh xong vẫn phải bắt tụi nó tàng hình vật lý
                    b.sprite.visible = false;
                    b.sprite.renderable = false;
                    b.sprite.alpha = 0;
                }
                continue;
            }
        }

        // 1. Cập nhật lực đàn theo thuật toán Boids
        for (let b of this.boids) {
            if (b.respawnTimer > 0) continue;
            this.flock(b);
            this.boundaries(b);
        }

        // 2. Chuyển động vật lý
        for (let b of this.boids) {
            if (b.respawnTimer > 0) continue;

            b.position.x += b.velocity.x * dt;
            b.position.y += b.velocity.y * dt;
            b.velocity.x += b.acceleration.x * dt;
            b.velocity.y += b.acceleration.y * dt;

            const speed = Math.hypot(b.velocity.x, b.velocity.y);
            const minSpeed = b.maxSpeed * 0.35;

            if (speed > b.maxSpeed) {
                b.velocity.x = (b.velocity.x / speed) * b.maxSpeed;
                b.velocity.y = (b.velocity.y / speed) * b.maxSpeed;
            } else if (speed < minSpeed && speed > 0.001) {
                b.velocity.x = (b.velocity.x / speed) * minSpeed;
                b.velocity.y = (b.velocity.y / speed) * minSpeed;
            } else if (speed <= 0.001) {
                b.velocity.x = Math.cos(b.wanderAngle) * minSpeed;
                b.velocity.y = Math.sin(b.wanderAngle) * minSpeed;
            }

            b.acceleration.x = 0;
            b.acceleration.y = 0;

            // 3. Render Sprite 
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            b.sprite.x = screenW + b.position.x;
            b.sprite.y = screenH + b.position.y;

            // ===== LOGIC CHÍNH: PHÂN CẤP XUẤT HIỆN & FADE-OUT ÊM ÁI =====

            // 3.1. Khởi tạo bộ nhớ đệm nếu chưa có
            if (b.blinkTimer === undefined) {
                b.isBlinking = false;
                b.targetAlpha = 0;
                b.currentAlpha = 0; // Thêm currentAlpha
                b.sprite.alpha = 0;
                b.sprite.visible = false;
                // Phát đầu tiên: Cá nhỏ hiện ngay, cá xịn chờ lâu theo đúng chu kỳ lặn
                if (b.tier === "MYTHIC" || b.tier === "LEGENDARY") {
                    b.blinkTimer = 60000 + Math.random() * 60000; // 1-2 phút
                } else if (b.tier === "EPIC") {
                    b.blinkTimer = 30000 + Math.random() * 15000; // 30-45s
                } else {
                    b.blinkTimer = 500 + Math.random() * 1500; // Common & Rare hiện sau 0.5-2s
                }
            }

            // 3.2. Đếm lùi thời gian chuyển trạng thái
            b.blinkTimer -= dt * 16.66;

            if (b.blinkTimer <= 0) {
                b.isBlinking = !b.isBlinking;

                if (b.isBlinking) {
                    // ---- PHA TỤ SÁNG (BẮT ĐẦU HIỆN DẦN LÊN) ----
                    if (b.tier === "MYTHIC" || b.tier === "LEGENDARY") {
                        b.targetAlpha = 0.95;
                        b.blinkTimer = 6000 + Math.random() * 4000; // Cá xịn bơi lâu (6-10s)
                    } else if (b.tier === "EPIC") {
                        b.targetAlpha = 0.75;
                        b.blinkTimer = 5000 + Math.random() * 3000; // Epic bơi 5-8s
                    } else {
                        // CÁ COMMON & RARE: Hiện thường xuyên
                        b.targetAlpha = 0.55;
                        b.blinkTimer = 3000 + Math.random() * 3000; // Bơi lăn tăn 3-6s
                    }
                } else {
                    // ---- PHA TAN BIẾN (BẮT ĐẦU MỜ DẦN) ----
                    b.targetAlpha = 0;

                    if (b.tier === "MYTHIC" || b.tier === "LEGENDARY") {
                        b.blinkTimer = 60000 + Math.random() * 60000; // Trùm cuối lặn 1-2 phút
                    } else if (b.tier === "EPIC") {
                        b.blinkTimer = 30000 + Math.random() * 15000; // Epic lặn 30-45s
                    } else {
                        b.blinkTimer = 2000 + Math.random() * 3000; // Common lặn 2-5s lại trồi lên
                    }
                }
            }

            // 3.3. XỬ LÝ LÀM MỜ DẦN (FADE-IN / FADE-OUT) CỰC CHẬM
            let fadeSpeed = 0.005; // Tốc độ siêu chậm
            if (b.tier !== "COMMON") {
                fadeSpeed = 0.008;
            }

            if (b.currentAlpha === undefined) b.currentAlpha = 0;

            if (b.currentAlpha < b.targetAlpha) {
                b.currentAlpha += fadeSpeed;
                if (b.currentAlpha > b.targetAlpha) b.currentAlpha = b.targetAlpha;
            } else if (b.currentAlpha > b.targetAlpha) {
                b.currentAlpha -= fadeSpeed;
                if (b.currentAlpha <= 0) {
                    b.currentAlpha = 0;
                }
            }

            // Xoay đầu hướng cá theo vector di chuyển
            let speedSq = b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y;
            if (speedSq > 0.01) {
                let targetRotation = 0;

                if (b.isImg) {
                    targetRotation = Math.atan2(b.velocity.y, b.velocity.x);
                    if (b.velocity.x < -0.05) b.sprite.scale.y = -1;
                    else if (b.velocity.x > 0.05) b.sprite.scale.y = 1;
                } else {
                    targetRotation = Math.atan2(b.velocity.y, b.velocity.x) - Math.PI;
                    if (b.velocity.x > 0.05) b.sprite.scale.y = -1;
                    else if (b.velocity.x < -0.05) b.sprite.scale.y = 1;
                }

                let diff = targetRotation - b.sprite.rotation;

                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                b.sprite.rotation += diff * 0.08;
            }
        }
    }

    flock(b) {
        let align = { x: 0, y: 0 };
        let cohesion = { x: 0, y: 0 };
        let separation = { x: 0, y: 0 };
        let flockTotal = 0;
        let sepTotal = 0;

        for (let other of this.boids) {
            if (other === b) continue;
            let d = Math.hypot(b.position.x - other.position.x, b.position.y - other.position.y);

            if (d > 0 && d < this.perceptionRadius) {
                // Separation (Tách rẽ tránh va chạm áp dụng cho TOÀN BỘ CÁ)
                let diff = { x: b.position.x - other.position.x, y: b.position.y - other.position.y };
                diff.x /= d * d; // Trọng số ngược
                diff.y /= d * d;
                separation.x += diff.x;
                separation.y += diff.y;
                sepTotal++;

                // Alignment & Cohesion (CHỈ áp dụng cho loài bơi đàn và PHẢI CÙNG LOẠI CÁ)
                if (b.type === 'school' && other.char === b.char) {
                    align.x += other.velocity.x;
                    align.y += other.velocity.y;
                    cohesion.x += other.position.x;
                    cohesion.y += other.position.y;
                    flockTotal++;
                }
            }
        }

        if (flockTotal > 0) {
            align.x = (align.x / flockTotal) - b.velocity.x;
            align.y = (align.y / flockTotal) - b.velocity.y;
            this.limit(align, b.maxForce);

            cohesion.x = (cohesion.x / flockTotal) - b.position.x;
            cohesion.y = (cohesion.y / flockTotal) - b.position.y;
            this.limit(cohesion, b.maxForce);
        }

        if (sepTotal > 0) {
            separation.x /= sepTotal;
            separation.y /= sepTotal;
            this.limit(separation, b.maxForce);
        }

        // Điểm thu hút (Mồi câu / Bait) khi sếp Lure (Dùng tọa độ màn hình thực để tránh lỗi vector ngược)
        if (this.targetBait && this.targetBait.active) {
            let screenX = window.innerWidth + b.position.x;
            let screenY = window.innerHeight + b.position.y;
            let dToBait = Math.hypot(screenX - this.targetBait.x, screenY - this.targetBait.y);

            if (dToBait < 13) { // CẢI TIẾN: Cá mờ ảo làm giá khủng khiếp, phải lao thẳng vào mõm mồi (< 13px) mới cắn!
                let steerToBait = {
                    x: (this.targetBait.x - screenX) / dToBait,
                    y: (this.targetBait.y - screenY) / dToBait
                };
                // Ghi đè lực cực mạnh để rẽ nhánh tức thời
                b.acceleration.x += steerToBait.x * b.maxForce * 8; // Tăng x2 lực lao vào mồi cho gấu
                b.acceleration.y += steerToBait.y * b.maxForce * 8;
            }
        }

        // Tích hợp các lực vector tùy loài với biên độ siêu nhỏ để bơi êm
        if (b.type === 'school') {
            b.acceleration.x += align.x * 0.25; // Tăng mạnh bơi song song
            b.acceleration.y += align.y * 0.25;
            b.acceleration.x += cohesion.x * 0.15; // Tăng lực rủ rê tụ lại làm một
            b.acceleration.y += cohesion.y * 0.15;
        }

        // Mọi loài đều phải có ý thức né tránh nhau và lách êm
        b.acceleration.x += separation.x * 0.15;
        b.acceleration.y += separation.y * 0.15;

        // ---> THÊM LOGIC WANDER (Lượn lờ) ĐỂ CÁ LUÔN TÌM ĐƯỜNG BƠI
        b.wanderAngle += (Math.random() - 0.5) * 0.15; // Đổi góc nhìn từ từ
        b.acceleration.x += Math.cos(b.wanderAngle) * b.maxForce * 0.3;
        b.acceleration.y += Math.sin(b.wanderAngle) * b.maxForce * 0.3;
    }

    boundaries(b) {
        let desired = null;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Vành đai giới hạn theo Màn Hình và Vách Đá
        const minR = 250; // Tránh vách đá (rock) một cách dứt khoát! Vách đá rộng cỡ 240px.
        let d = Math.hypot(b.position.x, b.position.y);

        // 1. Né Vách đá (Bottom Right = origin 0,0)
        if (d < minR && d !== 0) {
            desired = { x: (b.position.x / d) * b.maxSpeed, y: (b.position.y / d) * b.maxSpeed };
        }

        // 2. Chạm biên viền bao quanh Màn Hình Desktop
        // Left Edge
        if (b.position.x < -screenW + 50) desired = { x: b.maxSpeed, y: b.velocity.y };
        // Top Edge
        if (b.position.y < -screenH + 50) desired = { x: b.velocity.x, y: b.maxSpeed };
        // Bottom Edge (near rock but extending left)
        if (b.position.y > -80) desired = { x: b.velocity.x, y: -b.maxSpeed };
        // Right Edge (near rock but extending up)
        if (b.position.x > -80) desired = { x: -b.maxSpeed, y: b.velocity.y };

        if (desired) {
            let errorX = desired.x - b.velocity.x;
            let errorY = desired.y - b.velocity.y;
            // Áp dụng bẻ lái khi ở gờ vực tà tà (không còn quay ngắt vội vàng x3 nữa)
            let lim = this.limit(errorX, errorY, b.maxForce);
            b.acceleration.x += lim.x || errorX;
            b.acceleration.y += lim.y || errorY;
        }
    }

    limit(vec, max) {
        // handle signature override or object
        if (arguments.length === 3) {
            let dx = arguments[0];
            let dy = arguments[1];
            let mx = arguments[2];
            let mag = Math.hypot(dx, dy);
            if (mag > mx) {
                return { x: dx / mag * mx, y: dy / mag * mx };
            }
            return { x: dx, y: dy };
        }

        let mag = Math.hypot(vec.x, vec.y);
        if (mag > max) {
            vec.x = (vec.x / mag) * max;
            vec.y = (vec.y / mag) * max;
        }
    }
}

module.exports = { BoidsSystem };
