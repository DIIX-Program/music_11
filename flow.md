# Luồng hoạt động của dự án Music_11

Tài liệu này mô tả chi tiết các bước vận hành của hệ thống từ lúc khởi chạy đến các tính năng chính.

---

## 1. Khởi động hệ thống (System Startup)
1. **Server Bootstrapping**: File `server.ts` được thực thi.
2. **Database Initialization**: 
   - Hệ thống kết nối tới SQL Server.
   - Chạy các script trong `src/backend/db/index.ts` để kiểm tra và khởi tạo bảng nếu cần.
3. **Hybrid Serving**:
   - Express thiết lập các API Routes (`/api/*`).
   - Thiết lập thư mục tĩnh (`uploads/`, `nhac/`).
   - Khởi tạo Vite Dev Server (trong môi trường development) hoặc phục vụ file tĩnh `dist/index.html` (trong production).

---

## 2. Luồng Người dùng (User Flow)

### 2.1. Đăng ký & Đăng nhập
1. Người dùng truy cập trang `/auth`.
2. Gửi thông tin tới `/api/auth/register` hoặc `/api/auth/login`.
3. Backend kiểm tra tính hợp lệ (Zod Schema), mã hóa mật khẩu (Bcrypt) và lưu vào Database.
4. Trả về thông tin User và lưu trạng thái đăng nhập qua Cookies (HTTP-only).
5. Frontend cập nhật `authStore` để quản lý quyền truy cập toàn cục.

### 2.2. Khám phá & Phát nhạc
1. **Home Page**: Frontend gọi `/api/home` để lấy danh sách bài hát mới nhất, nghệ sĩ nổi bật.
2. **Player Interaction**:
   - Khi nhấn "Play", `playerStore` cập nhật bài hát hiện tại.
   - Frontend gửi yêu cầu tới `/api/tracks/:id/play` để ghi nhận lượt phát (Play count).
   - Audio được stream trực tiếp từ URL `/uploads/audio/...` hoặc `/nhac/...`.
3. **Search**: Người dùng nhập từ khóa -> Gọi `/api/search` -> Tìm kiếm trong Database bằng SQL `LIKE` hoặc Full-text search (nếu có).

### 2.3. Tải lên bài hát (Upload Flow)
1. Người dùng (có quyền ARTIST) truy cập `/upload`.
2. Chọn file nhạc (mp3) và ảnh bìa.
3. Nhấn "Tải lên":
   - **Frontend**: Gửi `FormData` chứa file qua API POST `/api/tracks`.
   - **Backend**: 
     - `multer` nhận file và lưu vào thư mục `uploads/audio` và `uploads/images`.
     - Tạo bản ghi trong bảng `storage_objects`.
     - Tạo bản ghi bài hát trong bảng `tracks` với trạng thái mặc định là `PENDING`.

### 2.4. Quản lý Thư viện & Playlist
1. **Like bài hát**: Nhấn Tim -> Gọi `/api/likes/:id` -> Cập nhật bảng `track_likes`.
2. **Playlist**: 
   - Tạo Playlist -> Gọi POST `/api/playlists`.
   - Thêm bài hát vào Playlist -> Gọi POST `/api/playlists/:id/tracks`.
3. **Đồng bộ**: `useLibrarySync` hook đảm bảo dữ liệu (Liked songs, My playlists) luôn khớp với server mỗi khi ứng dụng khởi chạy hoặc user thay đổi.

---

## 3. Luồng Quản trị (Admin Flow)
1. Admin truy cập `/admin` (Hệ thống kiểm tra `isAdmin` flag trong `authStore` và token).
2. **Kiểm duyệt bài hát**:
   - Lấy danh sách bài hát `PENDING` từ `/api/admin/tracks/pending`.
   - Duyệt hoặc từ chối -> Gọi `/api/admin/tracks/:id/status`.
3. **Quản lý Nghệ sĩ**: Phê duyệt yêu cầu nâng cấp tài khoản lên ARTIST.

---

## 4. Quét nhạc cục bộ (Local Music Scanning)
1. Script `src/backend/scripts/scan_local.ts` được chạy thủ công hoặc theo lịch.
2. Script quét thư mục `nhac/` ở máy chủ.
3. Với mỗi file mp3 mới:
   - Tạo ID duy nhất.
   - Thêm thông tin vào Database (`storage_objects` và `tracks`).
   - Tự động đánh dấu là `APPROVED` vì đây là nhạc do Admin quản lý cục bộ.
