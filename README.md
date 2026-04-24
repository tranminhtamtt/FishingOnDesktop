🎣 Crypto Fishing Game (Desktop App)

Crypto Fishing Game là một tựa game câu cá mini trên Desktop được thiết kế sinh động, mượt mà, xây dựng bằng hệ sinh thái Web Technologies và đóng gói bằng Electron. Mang đến trải nghiệm thư giãn với một đại dương sống động ngay trên màn hình của bạn, nơi các đàn cá được mô phỏng bằng trí tuệ nhân tạo (AI Flocking) hoạt động chân thực và tự nhiên. 🌊

✨ Tính Năng Nổi Bật

Ứng dụng nổi bật với hệ thống AI bầy đàn (Boids Algorithm), cho phép các sinh vật trong game không chỉ di chuyển ngẫu nhiên mà còn thể hiện hành vi sinh học thực tế như di chuyển theo nhóm (Cohesion), căn chỉnh hướng bơi (Alignment) và tránh va chạm (Separation).

Bên cạnh đó là hệ thống phân cấp (Tiers) đa dạng với các cấp độ hiếm: COMMON, RARE, EPIC, MYTHIC, và LEGENDARY. Những loài cá càng hiếm sẽ có kích thước lớn hơn, chuyển động mượt hơn và xuất hiện với tần suất thấp hơn, tạo cảm giác khám phá và sưu tầm.

Game còn tích hợp hiệu ứng tàng hình mượt mà, sử dụng bộ đếm frame vật lý độc lập (không phụ thuộc PixiJS Delta), giúp hiệu ứng fade-in và fade-out diễn ra trơn tru, không giật lag.

Cuối cùng, ứng dụng được đóng gói chuyên nghiệp bằng Electron, cho phép người dùng chỉ cần tải và chạy file .exe mà không cần cài đặt thêm môi trường. Hỗ trợ cả bản Setup và Portable.

🛠️ Công Nghệ Sử Dụng

Dự án được xây dựng trên các công nghệ hiện đại:

Electron – Framework phát triển ứng dụng Desktop đa nền tảng
PixiJS – Engine render 2D sử dụng WebGL, đảm bảo hiệu năng cao (~60 FPS)
Node.js – Môi trường xử lý và quản lý package
HTML5 / CSS3 / JavaScript (Vanilla) – Xây dựng giao diện người dùng
🚀 Hướng Dẫn Cài Đặt (Dành cho Developer)

Để chạy project ở chế độ phát triển, thực hiện các bước sau:

Bước 1: Clone repository về máy

git clone https://github.com/tranminhtamtt/FishingOnDesktop.git

Bước 2: Di chuyển vào thư mục dự án

cd FishingOnDesktop

Bước 3: Cài đặt các thư viện cần thiết

npm install

Bước 4: Chạy game ở chế độ Developer

npm start
📦 Build File Cài Đặt (.exe)

Dự án đã được cấu hình sẵn bằng electron-builder để build file cài đặt một cách tối ưu.

Chạy lệnh sau để build:

npm run build

Sau khi hoàn tất, file cài đặt sẽ được tạo trong thư mục dist/ với tên ví dụ:
Crypto Fishing Setup 1.0.0.exe

📜 Bản Quyền & Giấy Phép

© 2026 Trần Minh Tâm (tranminhtamtt). All Rights Reserved.

Toàn bộ mã nguồn, thuật toán, hình ảnh và cấu trúc dữ liệu trong dự án này thuộc quyền sở hữu độc quyền của tác giả.

Bạn được phép tải về để học tập, nghiên cứu và trải nghiệm. Tuy nhiên, bạn không được phép sao chép, phát hành lại, chỉnh sửa để tạo sản phẩm phái sinh hoặc sử dụng cho mục đích thương mại khi chưa có sự cho phép bằng văn bản từ tác giả.
