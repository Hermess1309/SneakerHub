# 👟 SneakerHub - Hệ Thống Thương Mại Điện Tử Giày Sneaker Chuyên Sâu

SneakerHub là một ứng dụng Web thương mại điện tử Full-stack chuyên biệt cho các sản phẩm giày hiệu, được xây dựng trên nền tảng **MERN Stack** (React 19, Node.js, Express 5, MongoDB). Dự án được thiết kế với giao diện SPA hiện đại, mượt mà và tích hợp các giải pháp công nghệ tiên tiến như cổng thanh toán quốc gia **VNPay** và bảo mật **JWT + OTP**.

---

## 🌟 Tính Năng Nổi Bật

### 👟 Trải Nghiệm Khách Hàng (Client-Side)
- **Đăng ký & Đăng nhập:** Hệ thống kiểm tra trùng lặp email thời gian thực, cấp phát token JWT bảo mật và lưu trữ Cookie an toàn.
- **Kính lúp sản phẩm (Image Magnifier):** Thấu kính zoom mượt mà phóng to 60 FPS xem rõ chi tiết chất liệu sản phẩm thực tế.
- **Bộ lọc thông minh:** Tìm kiếm nhanh và lọc sản phẩm linh hoạt theo thương hiệu (Nike, Adidas, Jordan, New Balance, Asics), size và mức giá.
- **Giỏ hàng & Khuyến mãi:** Đăng ký giỏ hàng động, tính toán chiết khấu và tự động áp mã coupon giảm giá.
- **Đánh giá sản phẩm (Feedback):** Người mua bình luận và đính kèm ảnh chụp thực tế tải thẳng lên đám mây Cloudinary.

### 💳 Tích Hợp Hệ Thống & Bảo Mật
- **Thanh toán tự động qua VNPay:** Giao dịch mã hóa chữ ký số **HMAC-SHA512** bảo mật cao, tự động đồng bộ trạng thái thanh toán qua endpoint IPN URL trên Server.
- **Lấy lại mật khẩu qua OTP:** Gửi mã xác nhận 6 số ngẫu nhiên có hiệu lực 5 phút tự động về Gmail qua SMTP Server của Google.

### 📊 Quản Trị Hệ Thống (Admin Dashboard)
- **Thống kê tổng quan:** Theo dõi trực quan doanh thu, số đơn hàng và số thành viên mới đăng ký sử dụng biểu đồ (Recharts).
- **Quản lý CRUD:** Thêm mới, chỉnh sửa sản phẩm (thông số metadata, dải size giày, ảnh CDN Cloudinary) và danh mục hãng giày.
- **Xử lý đơn hàng:** Cập nhật quy trình giao hàng đa cấp độ (Chờ xác nhận ➔ Đang giao ➔ Đã giao ➔ Đã hủy).

---

## 💻 Công Nghệ Sử Dụng

### Frontend
- **Framework:** React 19 (Vite)
- **UI Component Library:** Ant Design
- **Styling:** Tailwind CSS v4 & CSS Modules
- **State Management & Network:** Axios, React Router Dom, Recharts, React Slick

### Backend & Database
- **Core Engine:** Node.js & Express.js (v5)
- **Database:** MongoDB & Mongoose ORM
- **Authentication & Security:** JSON Web Token (JWT), bcrypt (băm mật khẩu), OTP Generator
- **Services:** Cloudinary API (Lưu trữ ảnh), Google SMTP API (Gửi mail OTP), VNPay SDK (Thanh toán)

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
SneakerHub/
├── client/                 # Mã nguồn Frontend (ReactJS)
│   ├── public/             # Tài nguyên tĩnh công cộng
│   └── src/
│       ├── assets/         # Hình ảnh, icon tĩnh
│       ├── components/     # Các Component tái sử dụng (Header, Footer, ProductCard,...)
│       ├── config/         # Cấu hình API, Axios client
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Các trang (Home, Cart, AdminDashboard, Detail,...)
│       ├── routes/         # Cấu hình định tuyến (AppRoutes)
│       └── store/          # Quản lý trạng thái chung
├── server/                 # Mã nguồn Backend (Express.js)
│   ├── src/
│   │   ├── auth/           # Module phân quyền, đăng nhập
│   │   ├── config/         # Cấu hình kết nối DB, Cloudinary, VNPay, Mailer
│   │   ├── controllers/    # Controller xử lý logic nghiệp vụ
│   │   ├── middleware/     # Các bộ lọc trung gian (authMiddleware, uploadMiddleware)
│   │   ├── models/         # Khai báo schema MongoDB
│   │   ├── routes/         # Cấu hình API endpoints
│   │   └── utils/          # Hàm tiện ích (gửi OTP, tạo chữ ký số)
│   ├── createAdmin.js      # Script khởi tạo tài khoản Admin mặc định
│   └── seedShoes.js        # Script nạp dữ liệu giày mẫu ban đầu
└── README.md
```

---

## ⚙️ Cấu Hình Môi Trường (.env)

Hệ thống sử dụng các file `.env` chứa cấu hình bảo mật. Vui lòng tạo và cấu hình các trường cần thiết ở từng thư mục:

### 1. Cấu hình Server (`server/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/bookstore
JWT_SECRET=your_jwt_secret_key_123456_change_me
CLIENT_URL=http://localhost:5173

# Cấu hình Cloudinary (Quản lý hình ảnh sản phẩm)
CLOUD_DINARY_NAME=your_cloudinary_name
CLOUD_DINARY_KEY=your_cloudinary_key
CLOUD_DINARY_SECRET=your_cloudinary_secret

# Cấu hình Email gửi OTP qua SMTP Google
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# Cấu hình cổng thanh toán VNPay
VNP_TMNCODE=your_vnpay_tmncode
VNP_HASHSECRET=your_vnpay_hashsecret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURNURL=http://localhost:3000/api/vnpay/vnpay_return
```

> [!NOTE]
> **Giải thích kỹ thuật về Database:**
> Bản chất dự án được phát triển kế thừa từ cấu trúc cơ sở dữ liệu Bookstore, vì vậy trong cơ sở dữ liệu MongoDB sẽ sử dụng tên database mặc định là `bookstore`. Đồng thời các trường trong Schema giày cũng được ánh xạ tương đương:
> - `author` (Tác giả) ➔ Ánh xạ thành **Màu sắc giày (Color)**
> - `publisher` (Nhà xuất bản) ➔ Ánh xạ thành **Chất liệu giày (Material)**
> - `publishingHouse` (Nơi xuất bản) ➔ Ánh xạ thành **Giới tính (Gender/Unisex)**
> - `translator` (Dịch giả) ➔ Ánh xạ thành **Xuất xứ (Origin)**
> - `size` ➔ **Kích thước giày (Sizes)**
> - `coverType` (Loại bìa) ➔ Ánh xạ thành **Tình trạng sản phẩm (Condition - Fullbox/New)**

### 2. Cấu hình Client (`client/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống
- Đã cài đặt **Node.js** (Khuyên dùng v18 hoặc v20 LTS).
- Đã cài đặt và đang chạy dịch vụ **MongoDB** trên localhost (mặc định cổng `27017`).

### Các Bước Triển Khai

#### Bước 1: Khởi chạy Backend Server
1. Mở terminal và di chuyển vào thư mục `server`:
   ```bash
   cd server
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Nạp dữ liệu mẫu giày vào MongoDB:
   ```bash
   node seedShoes.js
   ```
4. Khởi tạo tài khoản Quản trị viên (Admin):
   ```bash
   node createAdmin.js
   ```
   *(Thông tin tài khoản mặc định: Email: `thanhhuy123@gmail.com` | Mật khẩu: `123456`)*
5. Khởi chạy Server ở chế độ phát triển (Cổng mặc định: `http://localhost:3000`):
   ```bash
   npm run dev
   ```

#### Bước 2: Khởi chạy Frontend Client
1. Mở một cửa sổ terminal mới và di chuyển vào thư mục `client`:
   ```bash
   cd client
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy giao diện Client (Cổng mặc định: `http://localhost:5173`):
   ```bash
   npm run dev
   ```

---

## 👥 Nhóm Tác Giả & Đóng Góp
- Dự án được xây dựng và tối ưu bởi các lập trình viên của đội ngũ SneakerHub.
- Mọi đóng góp xin gửi về hòm thư hỗ trợ hoặc mở Issue/Pull Request trực tiếp trên repo này.

---
*Dự án đã loại bỏ thư mục `node_modules` trước khi tải lên Github nhằm tối ưu dung lượng (~6MB). Vui lòng chạy `npm install` ở từng thư mục để cài đặt lại các thư viện phụ thuộc.*
