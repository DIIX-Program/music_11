# Tài Liệu Kỹ Thuật Music App - Phần 2: Bảo mật & Xác thực

Tài liệu này tập trung giải thích cơ chế bảo mật thông tin người dùng, cụ thể là cách mã hóa mật khẩu và xác thực qua JWT (JSON Web Token).

---

## 1. Mã hóa Mật khẩu (Password Hashing)

Hệ thống không bao giờ lưu mật khẩu dưới dạng văn bản thuần túy (plain text) để đảm bảo an toàn tuyệt đối. Chúng ta sử dụng thư viện **bcrypt** để băm (hash) mật khẩu.

### 1.1. Vị trí xử lý: `src/backend/services/authService.ts`

- **Khi Đăng ký (`register`):**
    - Mật khẩu người dùng nhập vào (`password_raw`) được đưa qua hàm `bcrypt.hash(password_raw, 10)`.
    - Con số `10` là "salt rounds", giúp tăng độ phức tạp và chống lại các cuộc tấn công Brute-force hoặc Rainbow Tables.
    - Kết quả là một chuỗi mã hóa (ví dụ: `$2b$10$...`) sẽ được lưu vào cột `password_hash` trong bảng `users`.

- **Khi Đăng nhập (`login`):**
    - Hệ thống lấy `password_hash` từ database dựa trên Email/Username.
    - Sử dụng hàm `bcrypt.compare(password_raw, user.password_hash)` để kiểm tra tính hợp lệ. Hàm này sẽ tự động giải mã salt và so khớp mà không cần biết mật khẩu gốc.

---

## 2. Xác thực JWT (JSON Web Token)

Sau khi đăng nhập thành công, hệ thống sử dụng JWT để duy trì phiên làm việc (session) mà không cần lưu trữ trạng thái trên server (Stateless).

### 2.1. Cấu hình Bí mật (`JWT_SECRET`)
Chuỗi bí mật dùng để ký và xác thực token được quản lý trong file `.env`:
- Biến: `JWT_SECRET`
- Nếu không có trong `.env`, hệ thống sử dụng một chuỗi mặc định (không khuyến khích khi deploy).

### 2.2. Vị trí Tạo Token: `src/backend/controllers/authController.ts`
- Khi `login` hoặc `register` thành công, server tạo một token chứa thông tin `userId`.
- Thời gian hết hạn: `7d` (7 ngày).
- Token được gửi về trình duyệt và lưu trữ trong **HTTP-Only Cookie** (tên: `auth_token`). Việc dùng Cookie giúp chống tấn công XSS hiệu quả hơn so với LocalStorage.

### 2.3. Vị trí Xác thực Token: `src/backend/middleware/auth.ts`
Đây là lớp bảo vệ (middleware) đứng trước các API yêu cầu đăng nhập.
- **Middleware `authenticate`:**
    1. Đọc token từ `req.cookies.auth_token`.
    2. Dùng `jwt.verify(token, JWT_SECRET)` để giải mã lấy `userId`.
    3. Truy vấn database để đảm bảo User đó vẫn tồn tại.
    4. Gán `userId` vào request (`req.userId`) để các controller phía sau sử dụng.
- **Middleware `requireRole`:**
    - Kiểm tra xem User có quyền tương ứng (ví dụ: `ADMIN`) trong bảng `user_roles` hay không.

---

## 3. Tóm tắt luồng bảo mật

1.  **Client:** Gửi Email + Password qua HTTPS.
2.  **Server (`authService`):** Dùng `bcrypt` so khớp mật khẩu.
3.  **Server (`authController`):** Tạo JWT, gắn vào Cookie `auth_token`.
4.  **Client:** Các request tiếp theo tự động gửi kèm Cookie.
5.  **Server (`authMiddleware`):** Kiểm tra JWT, lấy ra `userId` và cho phép truy cập tài nguyên.

---
*Tài liệu bổ sung về bảo mật hệ thống Music App.*
*Biên soạn: Antigravity AI - 09/05/2026*
