'use strict';

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────
const COMPACT_SIZE    = 150; 
const WINDOW_MARGIN   = 0; // Đặt về 0 để cửa sổ dính sát rạt vào mép màn hình, không bị hở viền

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;

// ─── Helper: tính toán vị trí góc phải dưới ──────────────────────────────────
function getBottomRightPosition(winWidth, winHeight) {
  const { workArea } = screen.getPrimaryDisplay();
  const x = workArea.x + workArea.width  - winWidth  - WINDOW_MARGIN;
  const y = workArea.y + workArea.height - winHeight - WINDOW_MARGIN;
  return { x, y };
}

// ─── Tạo cửa sổ chính ────────────────────────────────────────────────────────
function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  mainWindow = new BrowserWindow({
    // ── Xuyên thấu toàn bộ không gian Desktop (Màn chiếu ảo) ────────
    width:  workArea.width,
    height: workArea.height,
    x: workArea.x,
    y: workArea.y,

    // ── Overlay properties ─────────────────────────────────────────
    frame:       false,       // Không có thanh tiêu đề / viền cửa sổ
    transparent: true,        // Nền cửa sổ hoàn toàn trong suốt
    alwaysOnTop: true,        // Luôn nổi trên mọi cửa sổ khác
    skipTaskbar: true,        // Ẩn khỏi thanh Taskbar

    // ── Resizable / Movable ────────────────────────────────────────
    resizable:  false,
    movable:    false,        // Không cho kéo cửa sổ (overlay cố định)

    // ── Renderer settings ──────────────────────────────────────────
    webPreferences: {
      nodeIntegration:   true,   // Cho phép dùng require() trong renderer
      contextIsolation:  false,  // Tắt context isolation (dev phase)
      preload: undefined,        // Không cần preload script ở giai đoạn này
    },
  });

  // ── Tắt default menu bar ──────────────────────────────────────────────────
  mainWindow.setMenuBarVisibility(false);

  // ── Click-through mặc định: bật ngay khi cửa sổ được tạo ─────────────────
  // forward: true đảm bảo sự kiện chuột vẫn được forward xuống cửa sổ bên dưới
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // ── Load UI ───────────────────────────────────────────────────────────────
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // ── (Dev) Mở DevTools riêng, không gắn vào cửa sổ overlay ───────────────
  // Bỏ comment dòng dưới khi cần debug:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Trên macOS, app thường không quit khi tất cả cửa sổ đóng
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS: tạo lại cửa sổ khi click icon trên dock
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ─── IPC: Điều khiển Mouse Click-through ─────────────────────────────────────
// Renderer gửi event này để bật/tắt ignore mouse events
// Ví dụ: khi chuột hover **vào** vùng UI thật (nút, sidebar),
//   renderer gọi: ipcRenderer.send('set-ignore-mouse-events', false)
// Khi chuột **rời** vùng UI thật:
//   renderer gọi: ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  if (!mainWindow) return;
  if (ignore) {
    // Bật click-through, vẫn forward event xuống app phía dưới
    mainWindow.setIgnoreMouseEvents(true, options || { forward: true });
  } else {
    // Tắt click-through: cửa sổ nhận toàn bộ sự kiện chuột
    mainWindow.setIgnoreMouseEvents(false);
  }
});

// ─── IPC: Thay đổi mức độ lớn của khung câu ─────────────────────────────────
// Renderer gửi: ipcRenderer.send('set-window-size', size)
ipcMain.on('set-window-size', (event, size) => {
  // --- TẮT TOÀN DIỆN TÍNH NĂNG RESIZE MÀN HÌNH TỪ HỆ ĐIỀU HÀNH ---
  // Window nay đã bọc toàn bộ Desktop ở chế độ bóng ma tàng hình (Full Workspace).
  // Việc co giãn khung hình độc quyền do CSS Animations định đoạt để mượt chuẩn 60FPS.
});
