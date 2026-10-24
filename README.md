# 👟 SneakerHub - Hệ Thống Thương Mại Điện Tử Giày Sneaker Chuyên Sâu

> **Đồ án tốt nghiệp / Báo cáo chuyên đề:** Xây dựng website thương mại điện tử kinh doanh giày thể thao chính hãng tích hợp Trí tuệ Nhân tạo (Google Gemini AI), Cổng thanh toán trực tuyến (VNPay & MoMo), và Phân quyền doanh nghiệp đa cấp (RBAC).

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6%2B-green.svg)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-v6-1890ff.svg)](https://ant.design/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-blueviolet.svg)](https://cloudinary.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Assistant-orange.svg)](https://ai.google.dev/)

---

## 🌟 1. Tính Năng Nổi Bật Của Hệ Thống

### 🛍️ Phân Hệ Khách Hàng (Storefront Client)
* **Trang chủ hiện đại:** Slider banner chuẩn tỉ lệ điện ảnh, đồng hồ đếm ngược Flash Deal theo thời gian thực, danh mục thương hiệu nổi bật (Nike, Adidas, Jordan, New Balance, Asics).
* **Bộ lọc & Tìm kiếm thông minh:** Lọc tức thì theo Thương hiệu, Khoảng giá, Kích thước (Size 37 - 44) và sắp xếp mà không cần tải lại trang.
* **Chi tiết sản phẩm & Kính lúp (Magnifier):** Xem ảnh chi tiết với thấu kính zoom mượt mà 60 FPS, chọn kích cỡ trực quan, kiểm tra trạng thái tồn kho thực tế.
* **Giỏ hàng thông minh (Smart Cart):** Hỗ trợ khách vãng lai (Guest) thêm giỏ hàng qua cookie `guestId`. Khi khách đăng nhập, hệ thống **tự động gộp giỏ hàng cũ** vào tài khoản mà không làm mất sản phẩm.
* **Mã giảm giá (Coupon Engine):** Kiểm tra tính hợp lệ của mã, giới hạn số lượt sử dụng, thời hạn áp dụng, tự động giảm trừ % và đảm bảo không âm tiền.
* **Thanh toán đa kênh linh hoạt:**
  * **COD:** Thanh toán khi nhận hàng.
  * **VNPay Sandbox:** Quét mã VNPAY-QR hoặc thẻ ATM/Quốc tế với chữ ký số bảo mật `HMAC-SHA512`.
  * **MoMo Sandbox:** Cổng thanh toán ví điện tử MoMo an toàn qua QR code.
* **Trợ lý ảo AI tư vấn (Google Gemini):** Chatbot thông minh tự động phân tích nhu cầu khách hàng, gợi ý chọn size giày và liên kết trực tiếp tới các sản phẩm thực tế trong cơ sở dữ liệu.
* **Hỗ trợ khách hàng trực tuyến (Live Chat):** Khách hàng có thể chuyển sang chế độ chat trực tiếp với nhân viên tư vấn người thật (2 chiều thời gian thực).
* **Lịch sử đơn hàng, Đánh giá & Khiếu nại:** Khách hàng theo dõi tiến trình đơn hàng, gửi khiếu nại kèm hình ảnh hoặc gửi đánh giá 1-5 sao khi đơn đã giao thành công.

### 🛡️ Phân Hệ Quản Trị Doanh Nghiệp (Admin & Staff Dashboard)
* **Bảo vệ phân quyền đa cấp (RBAC):**
  * **Admin (Quản trị viên tối cao):** Toàn quyền kiểm soát hệ thống, xem thống kê doanh thu, quản lý tài khoản, thay đổi quyền User/Staff/Admin, quản lý danh mục, tạo mã giảm giá, cấu hình Flash Sale.
  * **Staff (Nhân viên vận hành & CSKH):** Được phép duyệt đơn hàng, in phiếu hóa đơn, quản lý tồn kho, tiếp nhận Live Chat và giải quyết khiếu nại. Bị ẩn và chặn các khu vực nhạy cảm (Doanh thu, Quản lý tài khoản, Xóa sản phẩm, Cấu hình hệ thống).
* **Báo cáo thống kê Dashboard:** Biểu đồ doanh thu trực quan (Recharts), số đơn hàng hoàn thành, tỷ lệ chuyển đổi và tăng trưởng.
* **Quản lý kho hàng (Inventory Management):** Tự động phát hiện và cảnh báo sản phẩm sắp hết hàng (tồn kho $\le 5$), hỗ trợ điều chỉnh số lượng tồn kho nhanh.
* **Xử lý đơn hàng & In hóa đơn:** Cập nhật trạng thái đơn hàng theo máy trạng thái tuần tự (*Chờ xác nhận ➔ Đang chuẩn bị ➔ Đang vận chuyển ➔ Đã hoàn thành / Đã hủy*), tích hợp modal in phiếu hóa đơn bán lẻ chuyên nghiệp.
* **Quản lý truyền thông đám mây (Cloudinary):** Upload và tối ưu hóa hình ảnh tự động (`q_auto:best, f_auto, WebP/AVIF`), chống rò rỉ bộ nhớ local.
* **Cấu hình Flash Sale:** Tùy biến giờ bắt đầu, kết thúc chiến dịch khuyến mãi với đồng hồ đếm ngược tự động đồng bộ ra trang chủ.

---

## 💻 2. Công Nghệ Sử Dụng (Tech Stack)

| Tầng / Thành Phần | Công Nghệ & Thư Viện |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Ant Design v6, Lucide Icons, Axios, React Router DOM v7, React Slick, Recharts |
| **Backend** | Node.js, Express.js v5, Mongoose ORM, JSON Web Token (JWT), bcrypt, Express Rate Limit, Multer |
| **Database** | MongoDB (Cơ sở dữ liệu NoSQL lưu trữ 11 collections) |
| **Trí tuệ nhân tạo (AI)** | Google Gemini API (`@google/genai` - Model `gemini-2.5-flash`) |
| **Cổng thanh toán** | VNPay SDK (Mã hóa SHA512), MoMo Payment API |
| **Lưu trữ đám mây** | Cloudinary v2 SDK (Tự động nén và phân phối ảnh qua CDN) |

---

## 📂 3. Cấu Trúc Thư Mục Dự Án

```text
SneakerHub/
├── client/                     # Mã nguồn Frontend (React 19 + Vite)
│   ├── public/                 # Ảnh logo, icon, tài nguyên tĩnh
│   ├── src/
│   │   ├── components/         # Các khối UI: Header, Footer, Banner, CardBody, Chat...
│   │   │   └── admin/          # Component quản trị: OrderDetailView, OrderPrintModal...
│   │   ├── config/             # Axios client, cấu hình API endpoints
│   │   ├── pages/              # Trang chính: HomePage, AdminDashboard, Detail, Cart, Orders...
│   │   └── App.jsx             # Điều hướng router ứng dụng
│   └── package.json
│
├── server/                     # Mã nguồn Backend API (Node.js + Express 5)
│   ├── src/
│   │   ├── config/             # Kết nối MongoDB, Cloudinary, Gemini AI
│   │   ├── controllers/        # Logic nghiệp vụ: product, payment, user, cart, message...
│   │   ├── middleware/         # Xác thực JWT (authUser, authAdmin), rate limit, upload
│   │   ├── models/             # Schema MongoDB: User, Product, Category, Payment, Cart...
│   │   ├── routes/             # Định tuyến API
│   │   └── server.js           # File khởi chạy máy chủ Express
│   ├── .env.example            # Mẫu biến môi trường Backend chuẩn
│   ├── seedShoes.js            # Script nạp dữ liệu mẫu giày ban đầu
│   ├── createAdmin.js          # Script tạo tài khoản Admin mặc định
│   └── package.json
│
├── Hinh_anh/                   # 24 ảnh chụp màn hình minh họa hệ thống dùng trong báo cáo
├── docs/                       # Sơ đồ thiết kế hệ thống (Use case, Sequence, Activity diagrams)
├── qa/
│   └── backup/                 # Bản sao lưu toàn bộ 11 collections MongoDB (JSON format)
├── Bao_cao_SneakerHub.docx     # Báo cáo đồ án chính thức (Bản Word đầy đủ mục lục)
├── Bao_cao_SneakerHub.pdf      # Báo cáo đồ án chính thức (Bản PDF chuẩn in ấn/nộp bài)
├── SneakerHub.pptx             # Slide PowerPoint thuyết trình bảo vệ đồ án
└── README.md                   # Hướng dẫn chi tiết này
```

---

## ⚙️ 4. Yêu Cầu Môi Trường (Prerequisites)

Trước khi tiến hành cài đặt, đảm bảo máy tính của bạn đã cài sẵn:
1. **Node.js:** Phiên bản `v18.x` hoặc `v20.x LTS` trở lên ([Tải tại đây](https://nodejs.org/)).
2. **MongoDB:** Phiên bản `v6.x` hoặc `v7.x` ([Tải MongoDB Community Server](https://www.mongodb.com/try/download/community)). Đảm bảo dịch vụ MongoDB đang chạy tại cổng mặc định `mongodb://127.0.0.1:27017`.
3. **Git:** Đã cài đặt Git trên máy tính ([Tải tại đây](https://git-scm.com/)).
4. **Visual Studio Code (VS Code):** Trình soạn thảo khuyến nghị ([Tải tại đây](https://code.visualstudio.com/)).

---

## 🚀 5. Hướng Dẫn Cài Đặt & Khởi Chạy Chi Tiết (A - Z)

### Bước 1: Sao chép mã nguồn (Clone Repository)
Mở cửa sổ dòng lệnh (Terminal / Command Prompt / Git Bash) và chạy lệnh:

```bash
git clone https://github.com/Hermess1309/SneakerHub.git
cd SneakerHub
```

---

### Bước 2: Cài đặt & Cấu hình Backend Server

1. **Di chuyển vào thư mục server:**
   ```bash
   cd server
   ```

2. **Cài đặt các gói thư viện phụ thuộc:**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   Tạo một file `.env` bên trong thư mục `server/` (sao chép từ file mẫu `.env.example`):
   ```bash
   cp .env.example .env
   ```
   *Nội dung mẫu file `server/.env`:*
   ```env
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/sneaker
   JWT_SECRET=your_jwt_secret_key_123456_change_me
   CLIENT_URL=http://localhost:5173

   # Cloudinary (Ảnh sản phẩm & danh mục)
   CLOUD_DINARY_NAME=u1vmfjx6
   CLOUD_DINARY_KEY=125345532588746
   CLOUD_DINARY_SECRET=5-7T-Sp11pagcPhqKKUYJAyuBVY

   # Trợ lý ảo Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash

   # Cổng thanh toán VNPay Sandbox
   VNPAY_TMN_CODE=64DFOLZV
   VNPAY_SECURE_SECRET=O6J4Z89F24EL7WDPFXJEJBX47AGBLQVO
   VNPAY_HOST=https://sandbox.vnpayment.vn
   VNPAY_RETURN_URL=http://localhost:3000/api/payment/vnpay-callback

   # Cổng thanh toán MoMo Sandbox
   MOMO_PARTNER_CODE=MOMO
   MOMO_ACCESS_KEY=F8BBA842ECF85
   MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
   MOMO_HOST=test-payment.momo.vn
   MOMO_RETURN_URL=http://localhost:3000/api/payment/momo-callback
   ```

4. **Nạp dữ liệu mẫu ban đầu vào MongoDB (Nếu cần):**
   * *Cách 1: Chạy script nạp giày mẫu có sẵn:*
     ```bash
     node seedShoes.js
     node createAdmin.js
     ```
   * *Cách 2: Khôi phục toàn bộ 100% dữ liệu gốc hoàn chỉnh từ bản sao lưu `qa/backup/` bằng script khôi phục hoặc mongoimport.*

5. **Khởi chạy Backend Server:**
   ```bash
   npm run dev
   ```
   > Server sẽ chạy tại: **`http://localhost:3000`** và thông báo `Kết nối thành công đến MongoDB`.

---

### Bước 3: Cài đặt & Khởi chạy Frontend Client

1. **Mở một cửa sổ Terminal mới và di chuyển vào thư mục `client`:**
   ```bash
   cd client
   ```

2. **Cài đặt các gói thư viện phụ thuộc:**
   ```bash
   npm install
   ```

3. **Kiểm tra file cấu hình môi trường `client/.env`:**
   Đảm bảo nội dung trỏ đến đúng máy chủ backend:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Khởi chạy giao diện Frontend:**
   ```bash
   npm run dev
   ```
   > Giao diện web sẽ sẵn sàng tại: **`http://localhost:5173`**.

---

## 🖥️ 6. Hướng Dẫn Thao Tác Chạy Nhanh Trên VS Code

Để thuận tiện nhất khi chấm bài hoặc thuyết trình, bạn có thể chạy song song cả 2 phần trong cùng một cửa sổ VS Code:

1. Mở thư mục gốc `SneakerHub` bằng VS Code (`File` ➔ `Open Folder...`).
2. Mở Terminal tích hợp bằng phím tắt **`Ctrl + \``** (hoặc `Terminal` ➔ `New Terminal`).
3. **Terminal 1 (Backend):**
   ```bash
   cd server
   npm run dev
   ```
4. Bấm vào nút chia đôi màn hình terminal **`Split Terminal`** (biểu tượng `|` ở góc phải khung terminal) hoặc bấm nút `+` để tạo **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm run dev
   ```
5. Mở trình duyệt web truy cập: **`http://localhost:5173`**.

---

## 🔑 7. Tài Khoản Kiểm Thử Mặc Định (Seed Credentials)

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn Trong Hệ Thống |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (Admin)** | `thanhhuy123@gmail.com` | `123456` | Toàn quyền kiểm soát, cấu hình hệ thống, xem doanh thu |
| **Khách hàng (User)** | `levannghia@gmail.com` | `123456` | Mua sắm, thanh toán, đánh giá, theo dõi đơn, chat CSKH |

> **Ghi chú:** Bạn có thể dùng tài khoản Admin vào mục **Quản lý tài khoản** để cấp quyền **Nhân viên (Staff)** cho bất kỳ tài khoản User nào để kiểm thử giao diện phân quyền Staff.

---

## 🌐 8. Các Địa Chỉ Truy Cập Chính

* **Cửa hàng cho khách hàng (Storefront):** `http://localhost:5173`
* **Trang quản trị (Admin Dashboard):** `http://localhost:5173/admin`
* **Máy chủ Backend API:** `http://localhost:3000`
* **Kiểm tra tình trạng API:** `http://localhost:3000/api/product/list`

---

## 📄 9. Hồ Sơ Báo Cáo Đồ Án Đính Kèm

Dự án đã được đóng gói đầy đủ các hồ sơ phục vụ chấm điểm và bảo vệ đồ án:
1. **`Bao_cao_SneakerHub.docx`**: Tài liệu báo cáo thuyết minh đồ án bản Word chuẩn quy cách trình bày (gồm đầy đủ trang bìa, mục lục tự động, danh mục bảng biểu, danh mục hình ảnh, tài liệu tham khảo APA 7).
2. **`Bao_cao_SneakerHub.pdf`**: Bản PDF xuất bản chính thức, sẵn sàng để in ấn hoặc nộp cho hội đồng.
3. **`SneakerHub.pptx`**: Bản trình chiếu PowerPoint chuyên nghiệp với bố cục mạch lạc phục vụ phần thuyết trình 15 - 20 phút.
4. **Thư mục `Hinh_anh/`**: Lưu trữ toàn bộ 24 hình ảnh chụp giao diện chất lượng cao được trích dẫn trong báo cáo.

---

## 👥 10. Bản Quyền & Tác Giả

* **Đề tài:** Hệ thống thương mại điện tử chuyên biệt giày SneakerHub.
* **Người thực hiện:** Sinh viên thực hiện đồ án tốt nghiệp chuyên ngành Công nghệ Thông tin / Kỹ thuật Phần mềm.
* **Giấy phép:** Phục vụ mục đích học tập, nghiên cứu và bảo vệ đồ án tốt nghiệp.
