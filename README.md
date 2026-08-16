# SneakerHub - Hệ Thống Thương Mại Điện Tử Giày Sneaker Chuyên Sâu

SneakerHub là một ứng dụng Web thương mại điện tử Full-stack chuyên biệt cho các sản phẩm giày hiệu, được xây dựng trên nền tảng **MERN Stack** (React, Node.js, Express, MongoDB). Dự án được thiết kế với giao diện SPA hiện đại, mượt mà và tích hợp các giải pháp công nghệ tiên tiến như cổng thanh toán quốc gia **VNPay** và bảo mật **JWT + OTP**.

---

## 🌟 Tính Năng Nổi Bật

### 👟 Trải Nghiệm Khách Hàng (Client-Side)
- **Đăng ký & Đăng nhập:** Hệ thống kiểm tra trùng lặp email thời gian thực, cấp phát token JWT bảo mật.
- **Kính lúp sản phẩm (Image Magnifier):** Thấu kính zoom mượt mà phóng to 60 FPS xem rõ chi tiết chất liệu sản phẩm thực tế.
- **Bộ lọc thông minh:** Tìm kiếm nhanh và lọc sản phẩm linh hoạt theo thương hiệu (Nike, Adidas, Jordan, v.v.), size và mức giá.
- **Giỏ hàng & Khuyến mãi:** Đăng ký giỏ hàng động, tính toán chiết khấu và tự động áp mã coupon giảm giá.
- **Đánh giá sản phẩm (Feedback):** Người mua bình luận và đính kèm ảnh chụp thực tế tải thẳng lên đám mây Cloudinary.

### 💳 Tích Hợp Hệ Thống
- **Thanh toán tự động qua VNPay:** Giao dịch mã hóa chữ ký số **HMAC-SHA512** bảo mật cao, tự động đồng bộ trạng thái thanh toán qua endpoint IPN URL trên Server.
- **Lấy lại mật khẩu qua OTP:** Gửi mã xác nhận 6 số ngẫu nhiên có hiệu lực 5 phút tự động về Gmail qua SMTP Server.

### 📊 Quản Trị Hệ Thống (Admin Dashboard)
- **Thống kê tổng quan:** Theo dõi trực quan doanh thu, số đơn hàng và số thành viên mới đăng ký.
- **Quản lý CRUD:** Thêm mới, chỉnh sửa sản phẩm (thông số metadata, dải size giày, ảnh CDN Cloudinary) và hãng giày.
- **Xử lý đơn hàng:** Cập nhật quy trình giao hàng đa cấp độ (Chờ xác nhận ➔ Đang giao ➔ Đã giao ➔ Đã hủy).

---

## 💻 Công Nghệ Sử Dụng

- **Frontend:** ReactJS (Vite) | Ant Design | Axios | React Router Dom
- **Backend:** Node.js | Express.js | Mongoose ORM | JWT | bcrypt | Nodemailer
- **Database:** MongoDB (NoSQL)
- **Dịch vụ đám mây:** Cloudinary CDN

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
- Đã cài đặt **Node.js** (Phiên bản v16 trở lên).
- Đã cài đặt và đang chạy dịch vụ **MongoDB** (mặc định trên cổng `27017`).

### Các Bước Triển Khai

#### Bước 1: Khởi chạy Backend Server
1. Mở terminal và di chuyển vào thư mục server:
   ```bash
   cd server
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Tạo mặc định tài khoản Quản trị viên (Admin):
   ```bash
   node createAdmin.js
   ```
   *(Tài khoản mặc định: `thanhhuy123@gmail.com` | Mật khẩu: `123456`)*
4. Khởi chạy Server ở chế độ phát triển (Cổng chạy: `http://localhost:3000`):
   ```bash
   npm run dev
   ```

#### Bước 2: Khởi chạy Frontend Client
1. Mở một cửa sổ terminal mới và di chuyển vào thư mục client:
   ```bash
   cd ../client
   ```
2. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
3. Khởi chạy giao diện Client (Cổng chạy mặc định: `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## ⚙️ Cấu Hòn Môi Trường (.env)

Hệ thống sử dụng các file `.env` chứa cấu hình bảo mật. Vui lòng cấu hình các trường cần thiết:

- **Server (`server/.env`):**
  ```env
  PORT=3000
  MONGODB_URI=mongodb://127.0.0.1:27017/bookstore
  JWT_SECRET=your_jwt_secret_key_123456_change_me
  CLIENT_URL=http://localhost:5173
  # Cloudinary config (Optional)
  CLOUD_DINARY_NAME=your_cloudinary_name
  CLOUD_DINARY_KEY=your_cloudinary_key
  CLOUD_DINARY_SECRET=your_cloudinary_secret
  ```

- **Client (`client/.env`):**
  ```env
  VITE_API_URL=http://localhost:3000
  ```

---
*Dự án đã được dọn dẹp nhẹ tối ưu (~6MB) trước khi tải lên Github bằng cách loại bỏ thư mục node_modules. Chỉ cần chạy `npm install` ở mỗi thư mục là có thể tái sinh đầy đủ các thư viện phụ thuộc.*
