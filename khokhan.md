# Khó khăn và Công nghệ dự án Music_11

Dưới đây là tổng hợp về các công nghệ đã sử dụng, những khó khăn gặp phải trong quá trình phát triển và các định hướng cải tiến cho dự án.

## 🛠 Công nghệ sử dụng

### Frontend
- **Framework**: React 19 (phiên bản mới nhất).
- **Routing**: React Router DOM 7.
- **Styling**: Tailwind CSS 4 & CSS Variables.
- **State Management**: Zustand (nhẹ nhàng, hiệu quả cho việc quản lý trạng thái Player và Auth).
- **Data Fetching**: TanStack Query (React Query) giúp cache và quản lý trạng thái API.
- **Animations**: Framer Motion (Motion) cho các hiệu ứng chuyển cảnh mượt mà.
- **Icons**: Lucide React.

### Backend
- **Runtime**: Node.js & TypeScript.
- **Framework**: Express.
- **Database**: Microsoft SQL Server (MSSQL).
- **Authentication**: JWT (JSON Web Token) & Bcrypt để mã hóa mật khẩu.
- **File Upload**: Multer (xử lý upload ảnh đại diện, bìa nhạc và file mp3).
- **Validation**: Zod (đảm bảo dữ liệu đầu vào luôn đúng cấu trúc).


---

## 🚧 Những khó khăn khi thực hiện

1. **Quản lý trạng thái Player**:
   - Việc giữ cho nhạc phát liên tục khi chuyển trang mà không bị ngắt quãng yêu cầu cấu trúc Zustand rất chặt chẽ.
   - Xử lý đồng bộ giữa thanh tiến trình (progress bar), thời gian thực tế của audio và giao diện người dùng.

2. **Xử lý file nhạc cục bộ**:
   - Viết script `scan-local` để quét hàng loạt file từ thư mục `nhac/` vào Database mà không bị trùng lặp.
   - Xử lý các lỗi liên quan đến đường dẫn tệp tin trên Windows (backslashes vs slashes).

3. **Cấu trúc Database**:
   - Việc thiết kế các bảng (Tracks, Users, Comments, Likes) sao cho tối ưu truy vấn.
   - Gặp khó khăn khi đồng bộ schema giữa code (Repository) và SQL Server (như thiếu cột `status` trong bảng Comments).

4. **Hiệu năng**:
   - Xử lý việc tải các file nhạc dung lượng lớn và hiển thị danh sách nhạc dài mà không làm lag giao diện.

---

## 🚀 Các cải tiến dự kiến (Next Steps)

1. **AI Recommendation**:
   - Sử dụng Gemini API để phân tích gu âm nhạc của người dùng và gợi ý các bài hát tương tự.
   - Tự động tạo mô tả hoặc tag cho bài hát dựa trên giai điệu.

2. **Tính năng Playlist nâng cao**:
   - Cho phép người dùng tạo, chỉnh sửa và chia sẻ Playlist công khai.
   - Thêm tính năng kéo thả (Drag & Drop) để sắp xếp thứ tự bài hát.

3. **Lời bài hát (Lyrics Sync)**:
   - Tích hợp hiển thị lời bài hát chạy theo thời gian thực (LRC format).

4. **WebSockets (Socket.io)**:
   - Triển khai bình luận thời gian thực (Real-time comments).
   - Tính năng "Nghe chung" (Listen together) với bạn bè.

5. **Chế độ Offline (PWA)**:
   - Biến ứng dụng thành Progressive Web App để có thể cài đặt trên điện thoại và nghe nhạc đã cache khi không có mạng.

6. **Tối ưu hóa UI/UX**:
   - Thêm chế độ Light/Dark mode linh hoạt.
   - Cải thiện trình tải lên (Upload) với thanh tiến trình trực quan hơn.
