# Tài Liệu Kỹ Thuật Music App - Backend & API Detailed

Tài liệu này cung cấp cái nhìn chi tiết nhất về hệ thống Backend của Music App, bao gồm cơ chế kết nối cơ sở dữ liệu, chi tiết toàn bộ các API Endpoints, và giải đáp các thắc mắc về User/Nghệ sĩ.

---

## 1. Cơ chế Kết nối Database (SQL Server)

Hệ thống sử dụng **Microsoft SQL Server** làm cơ sở dữ liệu chính. Việc kết nối được tối ưu hóa thông qua thư viện `mssql` và mô hình **Connection Pooling**.

### 1.1. Cấu hình Kết nối (`src/backend/config/db.ts`)
Thông tin kết nối được quản lý qua biến môi trường (`.env`) để đảm bảo bảo mật:
- **Server/Host**: Địa chỉ máy chủ SQL.
- **Database Name**: Tên cơ sở dữ liệu (mặc định: `musicdb`).
- **User/Password**: Thông tin xác thực.
- **Encrypt**: Tắt ở local (`false`), bật khi deploy Cloud.
- **TrustServerCertificate**: `true` để bỏ qua lỗi chứng chỉ ở môi trường phát triển.

### 1.2. Connection Pooling (Hồ chứa kết nối)
Tại sao dùng Pool?
- **Tiết kiệm tài nguyên**: Việc tạo một kết nối mới tới SQL Server rất tốn kém. Pool giữ một số lượng kết nối luôn mở (mặc định `min: 0, max: 10`).
- **Tốc độ**: Khi có request, hệ thống lấy ngay 1 kết nối từ Pool thay vì khởi tạo lại từ đầu.
- **Singleton Pattern**: Hàm `getConnection()` đảm bảo chỉ có duy nhất một đối tượng Pool được tạo ra và dùng chung cho toàn bộ ứng dụng.

---

## 2. Chi tiết Toàn bộ API Endpoints

Hệ thống API được chia thành các nhóm chức năng chính. Tiền tố mặc định là `/api`.

### 2.1. Xác thực (Auth) - `/api/auth`
| Phương thức | Endpoint | Mô tả | Yêu cầu |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Đăng ký tài khoản mới | Username, Email, Password |
| `POST` | `/login` | Đăng nhập hệ thống | Email, Password |
| `POST` | `/logout` | Đăng xuất, xóa Cookie JWT | Đã đăng nhập |
| `GET` | `/me` | Lấy thông tin phiên làm việc hiện tại | Tự động (qua Cookie) |

### 2.2. Người dùng (User) - `/api/users`
| Phương thức | Endpoint | Mô tả | Yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/:id/profile` | Xem profile công khai của người dùng khác | Public |
| `GET` | `/:id/tracks` | Lấy danh sách bài hát của 1 user (nếu là Artist) | Public |
| `GET` | `/me/library` | Lấy thư viện cá nhân (Liked, Playlists, v.v.) | Token |
| `GET` | `/me/playlists` | Danh sách playlist cá nhân | Token |
| `GET` | `/me/liked-tracks` | Danh sách bài hát đã thích | Token |
| `GET` | `/me/history` | Lịch sử nghe nhạc | Token |
| `PATCH` | `/me` | Cập nhật thông tin cá nhân (Display Name, Bio...) | Token |
| `POST` | `/:id/follow` | Theo dõi người dùng/nghệ sĩ | Token |
| `POST` | `/:id/unfollow` | Bỏ theo dõi | Token |

### 2.3. Bài hát (Tracks) - `/api/tracks`
| Phương thức | Endpoint | Mô tả | Yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lấy danh sách bài hát phổ biến | Public |
| `GET` | `/search` | Tìm kiếm bài hát (theo tên, nghệ sĩ, thể loại) | Public |
| `GET` | `/:id` | Chi tiết 1 bài hát (Metadata, Lượt nghe, Likes) | Public |
| `POST` | `/` | **Upload nhạc mới** | Token + Role ARTIST |
| `POST` | `/:id/play` | Ghi nhận 1 lượt nghe | Public/Token |
| `POST` | `/ai-generate-description` | Dùng AI gợi ý mô tả bài hát | Token |
| `DELETE` | `/:id` | Xóa bài hát | Token (Owner/Admin) |

### 2.4. Danh sách phát (Playlist) - `/api/playlists`
| Phương thức | Endpoint | Mô tả | Yêu cầu |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Tạo playlist mới | Token |
| `PATCH` | `/:id` | Cập nhật tên/ảnh/chế độ công khai | Token (Owner) |
| `DELETE` | `/:id` | Xóa playlist | Token (Owner) |
| `GET` | `/:id` | Chi tiết playlist và các bài hát bên trong | Public |
| `POST` | `/:id/tracks` | Thêm bài hát vào playlist | Token |
| `DELETE` | `/:id/tracks/:trackId` | Xóa bài hát khỏi playlist | Token |
| `POST` | `/track/:id/toggle-like` | Thích/Bỏ thích nhanh 1 bài hát | Token |

### 2.5. Nghệ sĩ (Artist) - `/api/artists`
| Phương thức | Endpoint | Mô tả | Yêu cầu |
| :--- | :--- | :--- | :--- |
| `GET` | `/:id` | Lấy thông tin chi tiết nghệ sĩ | Public |
| `POST` | `/request` | Gửi yêu cầu trở thành Nghệ sĩ | Token (User) |

### 2.6. Quản trị (Admin) - `/api/admin` (Yêu cầu Role ADMIN)
| Phương thức | Endpoint | Mô tả | Chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/tracks/pending` | Danh sách bài hát chờ duyệt | Kiểm duyệt |
| `PATCH` | `/tracks/:id/approve`| Duyệt bài hát lên hệ thống | Kiểm duyệt |
| `GET` | `/artists/requests` | Danh sách yêu cầu lên Nghệ sĩ | Quản lý User |
| `POST` | `/artists/:id/approve`| Duyệt người dùng thành Nghệ sĩ | Quản lý User |
| `GET` | `/users` | Danh sách tất cả người dùng | Quản lý User |
| `GET` | `/stats` | Thống kê hệ thống (User, Tracks, Plays) | Dashboard |

---

## 3. Về Hệ thống User & Phân quyền

Hệ thống phân chia User theo 3 cấp độ (Roles):
1.  **USER (Người dùng thường)**: Có thể nghe nhạc, thích bài hát, tạo playlist, follow người khác.
2.  **ARTIST (Nghệ sĩ)**: Bao gồm quyền của USER + được phép Upload bài hát và có trang Profile nghệ sĩ riêng.
3.  **ADMIN (Quản trị viên)**: Có quyền tối cao, duyệt bài hát, quản lý người dùng và xem thống kê.

**Cơ chế bảo mật**: 
- Sử dụng **JWT (JSON Web Token)** đính kèm trong Cookie hoặc Header.
- Middleware `authenticate` kiểm tra token.
- Middleware `requireRole('ADMIN')` kiểm tra quyền hạn trước khi cho phép vào các API nhạy cảm.

---

## 4. Tại sao API "không có" Nghệ sĩ? (Giải đáp thắc mắc)

Thực tế, hệ thống **CÓ** API dành cho nghệ sĩ, nhưng nó hoạt động dựa trên logic sau:

1.  **Nghệ sĩ cũng là User**: Một Artist về bản chất là một tài khoản User được nâng cấp Role lên `ARTIST`.
2.  **Bảng `artists`**: Khi một user được duyệt làm nghệ sĩ, một bản ghi sẽ được tạo trong bảng `artists` để lưu Bio, số followers, và trạng thái Verified.
3.  **Liên kết bài hát**: Mỗi bài hát trong bảng `tracks` có trường `artist_id` nối tới bảng `artists`.
4.  **Các API hiện có**:
    - `GET /api/artists/:id`: Trả về profile nghệ sĩ (đã có).
    - `GET /api/users/:id/tracks`: Trả về danh sách nhạc của nghệ sĩ đó (thực chất nghệ sĩ là một user).
5.  **Tại sao chưa thấy danh sách nghệ sĩ?**: Hiện tại hệ thống ưu tiên tìm kiếm nghệ sĩ thông qua bài hát hoặc trang Profile trực tiếp. Nếu cần danh sách "Top Nghệ sĩ", ta có thể bổ sung API `GET /api/artists` lấy từ bảng `artists` sắp xếp theo lượt nghe hoặc followers.

---

## 5. Quy trình Stream nhạc (Streaming)

API `/api/stream` (hoặc `/nhac/` tĩnh) không chỉ gửi file đơn thuần mà hỗ trợ **Partial Content (206)**:
- Khi client yêu cầu, server đọc file theo từng chunk (đoạn nhỏ).
- Hỗ trợ header `Range` giúp người dùng có thể tua nhạc ngay lập tức mà không cần tải hết cả file bài hát dung lượng lớn.
- Giúp giảm tải RAM cho server vì không phải load toàn bộ file vào bộ nhớ.

---
*Tài liệu được biên soạn bởi: Antigravity AI*
*Phiên bản: 2.5 (Cập nhật ngày 09/05/2026)*
