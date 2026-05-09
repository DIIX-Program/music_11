# Tài Liệu Thiết Kế Music App (design.md)

Tài liệu này trình bày tổng quan về ý tưởng thiết kế giao diện (UI/UX) và cách các thành phần trên giao diện tương tác với hệ thống API Backend.

---

## 1. Tổng quan Ý tưởng Thiết kế

Hệ thống được thiết kế với phong cách **Cinematic & Modern Dark Mode**, tập trung vào trải nghiệm thị giác mạnh mẽ và sự mượt mà trong tương tác.

### 1.1. Thẩm mỹ Cao cấp (Rich Aesthetics)
- **Bảng màu (Color Palette):** Sử dụng tông màu chủ đạo là `Zinc-950` kết hợp với xanh `Spotify Green (#1ed760)` và các dải màu Gradient (Indigo, Violet, Blue) để tạo chiều sâu.
- **Glassmorphism:** Các thành phần như thanh điều khiển nhạc (Player Bar), Modal, và Sidebar sử dụng hiệu ứng kính mờ (backdrop-blur) tạo cảm giác hiện đại và lớp lang.
- **Cinematic Hero:** Trang chủ có phần Banner cực lớn với Typography mạnh mẽ, sử dụng hình ảnh chất lượng cao để gây ấn tượng ngay từ cái nhìn đầu tiên.

### 1.2. Tương tác Động (Dynamic Interaction)
- **Micro-animations:** Sử dụng `motion/react` (Framer Motion) cho các hiệu ứng hover, chuyển trang, và hiển thị danh sách bài hát.
- **Visualizer:** Các bài hát đang phát có bộ chỉ báo sóng âm (Waveform) động, giúp giao diện trở nên "sống" hơn.
- **Trạng thái Loading:** Sử dụng Skeleton screen (Pulse effect) để giảm cảm giác chờ đợi khi tải dữ liệu từ API.

---

## 2. Mapping Giao diện & API

Dưới đây là bảng tra cứu nhanh: các nút bấm/thành phần trên giao diện gọi đến API nào ở Backend.

### 2.1. Trang chủ (Home Page)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Hero Banner** | Nhấn "Phát ngay" | `GET /api/home` (Lấy danh sách trending/local) |
| **Danh sách @nhac** | Tải trang | `GET /api/home` (Phần `localNhac`) |
| **Card Bài hát** | Nhấn nút Play | `POST /api/tracks/:id/play` (Tăng lượt nghe) |
| **Card Bài hát** | Nhấn nút Trái tim (Like) | `POST/DELETE /api/likes/:id` |
| **Card Bài hát** | Nhấn "Thêm vào Playlist" | `GET /api/users/me/playlists` (Hiện danh sách) |
| **Mục "Mới ra mắt"** | Tải trang | `GET /api/home` (Phần `newReleases`) |

### 2.2. Tìm kiếm (Search Page)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Thanh tìm kiếm** | Nhập từ khóa | `GET /api/tracks/search?q=...` |
| **Thể loại (Category)** | Nhấn vào một thể loại | `GET /api/tracks/search?genre=...` |

### 2.3. Quản lý Nhạc (Upload & Library)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Trang Upload** | Nhấn "Tải lên" sau khi chọn file | `POST /api/tracks` (Multipart/form-data) |
| **Mô tả AI** | Nhấn "Gợi ý bằng AI" | `POST /api/tracks/ai-generate-description` |
| **Trang Library** | Tải trang | `GET /api/users/me/library` |
| **Nút Follow** | Nhấn Theo dõi Nghệ sĩ | `POST /api/users/:id/follow` |

### 2.4. Trình phát nhạc (Player Bar - Cố định bên dưới)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Thanh tiến trình** | Kéo/Tua nhạc | `/api/stream?path=...` (Sử dụng Header Range) |
| **Nút Like** | Nhấn Trái tim | `POST/DELETE /api/likes/:id` |
| **Nút Lyrics** | Nhấn hiện lời bài hát | Dữ liệu `lyrics_lrc` từ `GET /api/tracks/:id` |

### 2.5. Xác thực (Auth Page)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Form Đăng nhập** | Nhấn "Đăng nhập" | `POST /api/auth/login` |
| **Form Đăng ký** | Nhấn "Tạo tài khoản" | `POST /api/auth/register` |
| **Nút Đăng xuất** | Nhấn "Logout" | `POST /api/auth/logout` |

### 2.6. Quản trị (Admin Dashboard)

| Thành phần trên UI | Hành động của người dùng | API tương ứng |
| :--- | :--- | :--- |
| **Duyệt bài hát** | Nhấn "Approve" | `PATCH /api/admin/tracks/:id/approve` |
| **Duyệt nghệ sĩ** | Nhấn "Verify" | `POST /api/admin/artists/:id/approve` |
| **Thống kê** | Tải trang Admin | `GET /api/admin/stats` |

---

## 3. Quy trình Xử lý Dữ liệu (Data Flow)

1. **Frontend (React):** Sử dụng `React Query` để quản lý trạng thái Server-state, đảm bảo dữ liệu luôn được cache và làm mới tự động.
2. **State Management:** `Zustand` quản lý trạng thái Global như: Bài hát hiện tại, Danh sách chờ (Queue), Thông tin User.
3. **Backend (Node.js/TS):** Tiếp nhận request, kiểm tra Middleware (JWT/Role), truy vấn SQL Server và trả về định dạng JSON chuẩn.

---
*Biên soạn bởi: Antigravity AI*
*Cập nhật lần cuối: 09/05/2026*
