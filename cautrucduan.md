# Cấu trúc thư mục dự án Music_11

Dưới đây là chi tiết về cấu trúc thư mục và chức năng của từng thành phần trong dự án.

## 📁 Thư mục gốc (Root)

- `api/`: Điểm khởi đầu cho việc deploy lên Vercel (Serverless Functions).
- `dist/`: Thư mục chứa mã nguồn đã được biên dịch (build) để triển khai.
- `nhac/`: Chứa các file nhạc mp3 cục bộ được quét vào hệ thống.
- `public/`: Chứa các tài nguyên tĩnh công khai (audio mẫu, manifest, service worker).
- `src/`: Thư mục chính chứa mã nguồn của cả Frontend và Backend.
- `uploads/`: Chứa các file do người dùng tải lên (avatar, cover, nhạc).
- `server.ts`: Entry point của ứng dụng, kết hợp giữa Express (API) và Vite (Frontend Dev Server).
- `package.json`: Quản lý dependencies và các script chạy dự án.
- `tsconfig.json`: Cấu hình cho TypeScript.
- `vite.config.ts`: Cấu hình cho Vite build tool.
- `.env`: Lưu trữ các biến môi trường (Database, Secret Keys).

---

## 📁 Thư mục `src/`

### 🔹 `backend/` (Mã nguồn phía máy chủ)

- `config/`: Cấu hình hệ thống (Ví dụ: `db.ts` cấu hình kết nối SQL Server).
- `controllers/`: Xử lý logic yêu cầu từ client và trả về dữ liệu (Ví dụ: `authController.ts`).
- `db/`: Chứa các file liên quan đến cơ sở dữ liệu (SQL Schema, Seed data, Initialization).
- `middleware/`: Các hàm trung gian xử lý Auth, kiểm tra lỗi, Rate Limiting.
- `repositories/`: Lớp tương tác trực tiếp với Database (Tách biệt logic truy vấn SQL).
- `routes/`: Định nghĩa các API Endpoints (Ví dụ: `/api/auth`, `/api/tracks`).
- `schemas/`: Định nghĩa kiểu dữ liệu và kiểm tra tính hợp lệ của dữ liệu (Zod schemas).
- `scripts/`: Các script bảo trì, quét file nhạc cục bộ, hoặc thao tác dữ liệu một lần.
- `services/`: Chứa logic nghiệp vụ (Business Logic) phức tạp dùng chung giữa các controller.

### 🔹 `frontend` (Mã nguồn phía giao diện)

- `components/`: Các thành phần giao diện dùng chung (Player, Sidebar, Modals, TopBar).
- `hooks/`: Các custom React hooks (Ví dụ: `useLibrarySync` để đồng bộ dữ liệu).
- `pages/`: Các trang chính của ứng dụng (Home, Library, Profile, Admin, Upload).
- `services/`: Các hàm gọi API từ Frontend đến Backend.
- `store/`: Quản lý trạng thái toàn cục của ứng dụng bằng Zustand (Auth, Player, Layout).
- `App.tsx`: Thành phần chính định nghĩa Router và bố cục tổng thể.
- `main.tsx`: File khởi tạo React app.
- `index.css`: Style chính của ứng dụng (sử dụng Tailwind CSS).

---

## 🛠 Các thành phần quan trọng khác

- `cautrucduan.md`: (File này) Mô tả cấu trúc dự án.
- `flow.md`: Mô tả chi tiết luồng hoạt động của ứng dụng.
- `.gitignore`: Danh sách các file/thư mục không đưa lên Git (node_modules, .env).

npm run scan-local
