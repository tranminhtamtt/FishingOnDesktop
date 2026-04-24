# 🎣 Crypto Fishing Game (Desktop App)

**Crypto Fishing Game** is a smooth and visually engaging mini fishing game for Desktop, built using modern Web Technologies and packaged with Electron. It brings a relaxing ocean environment directly to your screen, featuring intelligent fish behavior powered by AI flocking systems. 🌊

---

## ✨ Key Features

The game stands out with its **AI Flocking System (Boids Algorithm)**, where fish do not move randomly but instead simulate realistic group behavior:

* **Cohesion** – moving together as a group
* **Alignment** – matching direction with nearby fish
* **Separation** – avoiding collisions

In addition, the game includes a **Tier System** with multiple rarity levels:
`COMMON`, `RARE`, `EPIC`, `MYTHIC`, and `LEGENDARY`.
Rarer fish are larger, move more gracefully, and appear less frequently, enhancing the sense of discovery.

The game also features **smooth fade-in and fade-out effects**, powered by an independent physics-based frame counter (not tied to PixiJS Delta), ensuring fluid transitions without lag.

Finally, the application is **professionally packaged** using Electron, allowing users to run it instantly via a `.exe` file. Both Setup and Portable versions are supported.

---

## 🛠️ Technologies Used

This project is built with modern technologies:

* Electron – Cross-platform Desktop application framework
* PixiJS – High-performance 2D rendering engine using WebGL (~60 FPS)
* Node.js – Runtime environment and package manager
* HTML5 / CSS3 / JavaScript (Vanilla) – User interface and core logic

---

## 🚀 Installation Guide (For Developers)

To run the project in development mode, follow these steps:

Step 1: Clone the repository

```bash
git clone https://github.com/tranminhtamtt/FishingOnDesktop.git
```

Step 2: Navigate to the project directory

```bash
cd FishingOnDesktop
```

Step 3: Install dependencies

```bash
npm install
```

Step 4: Run in development mode

```bash
npm start
```

---

## 📦 Build Installer (.exe)

The project is pre-configured with electron-builder for optimized packaging.

Run the following command to build the installer:

```bash
npm run build
```

After completion, the output will be located in the `dist/` folder, for example:
**Crypto Fishing Setup 1.0.0.exe**

---

## 📜 License & Copyright

© 2026 Tran Minh Tam (tranminhtamtt). All Rights Reserved.

All source code, algorithms, assets, and data structures in this project are the exclusive property of the author.

You are allowed to download and use this project for learning, research, and personal experience purposes only.
You are NOT allowed to copy, redistribute, modify, create derivative works, or use any part of this project for commercial purposes without explicit written permission from the author.
