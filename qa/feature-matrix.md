# Ma Trận Chức Năng Website SneakerHub (Feature Matrix)

> **Môi trường:** Development (`http://localhost:5173` - Client UI | `http://localhost:3000` - API Server)  
> **Database:** MongoDB (`mongodb://127.0.0.1:27017/sneaker`)  
> **Vai trò:**
> - **Guest:** Khách vãng lai chưa đăng nhập
> - **User:** Khách hàng đã đăng nhập tài khoản thường (`levannghia@gmail.com`)
> - **Staff:** Nhân viên CSKH (`QA_User_2` sau khi set role `staff`)
> - **Admin:** Quản trị viên cấp cao (`thanhhuy123@gmail.com`)

---

## 1. Bảng Ma Trận Phân Quyền & Chức Năng

| Mã Matrix | Phân Hệ / Chức Năng | Guest | User | Staff | Admin | Ghi Chú & Kỳ Vọng |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **PUB-01** | Xem Trang chủ (`/`), Slider Banner, Flash Deal, New Balance, Jordan | Cho phép | Cho phép | Cho phép | Cho phép | Hiển thị đầy đủ sản phẩm, ảnh mượt, không lỗi console |
| **PUB-02** | Xem Chi tiết sản phẩm (`/product/:id`) | Cho phép | Cho phép | Cho phép | Cho phép | Hiển thị ảnh, giá, mô tả, chọn size, tồn kho |
| **PUB-03** | Lọc sản phẩm (Thương hiệu, Giá, Size) & Sắp xếp | Cho phép | Cho phép | Cho phép | Cho phép | Kết quả lọc chính xác, không reload toàn trang |
| **PUB-04** | Tìm kiếm sản phẩm theo từ khóa | Cho phép | Cho phép | Cho phép | Cho phép | Gợi ý đúng sản phẩm theo tên, chống XSS |
| **PUB-05** | Chatbot tư vấn tự động (Gemini AI) | Cho phép | Cho phép | Cho phép | Cho phép | Phản hồi thông tin sản phẩm và tư vấn size |
| **AUTH-01**| Đăng ký tài khoản mới (`/register`) | Cho phép | Chặn | Chặn | Chặn | Validation form: email trùng, pass yếu, ký tự đặc biệt |
| **AUTH-02**| Đăng nhập tài khoản (`/login`) | Cho phép | Chặn | Chặn | Chặn | Đúng email/pass cấp JWT cookie `accessToken`, `logged=1` |
| **AUTH-03**| Quên mật khẩu & Gửi mã OTP xác thực | Cho phép | Chặn | Chặn | Chặn | Gửi mã về email (BLOCKED nếu không có SMTP thực) |
| **AUTH-04**| Xem & Chỉnh sửa hồ sơ cá nhân (`/profile`) | Chặn | Cho phép | Cho phép | Cho phép | Guest bị chuyển hướng `/login` |
| **AUTH-05**| Đổi mật khẩu trong Profile | Chặn | Cho phép | Cho phép | Cho phép | Kiểm tra mật khẩu cũ, mã hóa bcrypt (Test trên QA_User_1) |
| **AUTH-06**| Đăng xuất | Chặn | Cho phép | Cho phép | Cho phép | Xóa sạch cookie token, chuyển hướng về trang chủ |
| **CART-01**| Thêm sản phẩm vào giỏ hàng | Cho phép | Cho phép | Cho phép | Cho phép | Guest lưu qua `guestId` cookie, User lưu vào DB User |
| **CART-02**| Quản lý giỏ hàng & Gộp giỏ khi đăng nhập | Cho phép | Cho phép | Cho phép | Cho phép | Cập nhật số lượng, xóa sản phẩm, tính tổng tiền |
| **CART-03**| Áp dụng mã giảm giá (Coupon) | Cho phép | Cho phép | Cho phép | Cho phép | Kiểm tra mã đúng/sai/hết hạn/hết lượt, không âm tiền |
| **ORDER-01**| Đặt hàng COD, trừ kho & chặn vượt tồn kho | Cho phép | Cho phép | Cho phép | Cho phép | Tạo đơn hàng, trừ kho chuẩn, chặn đặt vượt tồn |
| **ORDER-02**| Thanh toán MoMo / VNPay Sandbox | Cho phép | Cho phép | Cho phép | Cho phép | Chuyển hướng cổng thanh toán, hủy thanh toán, callback |
| **ORDER-03**| Xem lịch sử đơn hàng (`/orders`) | Chặn | Cho phép | Cho phép | Cho phép | Chỉ xem đơn của chính mình (chặn IDOR) |
| **ORDER-04**| Gửi khiếu nại đơn hàng (Complaint) | Chặn | Cho phép | Cho phép | Cho phép | Điền lý do, gửi lên hệ thống quản trị |
| **ORDER-05**| Đánh giá sản phẩm (Review/Feedback) | Chặn | Cho phép | Cho phép | Cho phép | Chặn đánh giá SP chưa mua; cho phép khi đã mua |
| **ADM-01** | Truy cập `/admin` (Admin Dashboard) | Chặn | Chặn | Cho phép | Cho phép | Guest/User bị chặn và điều hướng về trang chủ |
| **ADM-02** | Xem tổng quan báo cáo (Dashboard KPI & Charts) | Chặn | Chặn | Cho phép | Cho phép | Doanh thu, số đơn, biểu đồ tăng trưởng |
| **ADM-03** | Quản lý Sản phẩm (Upload ảnh >5MB, file không phải ảnh) | Chặn | Chặn | Cho phép | Cho phép | Form validation, upload ảnh < 5MB |
| **ADM-04** | Quản lý Sản phẩm: Sửa & Xóa sản phẩm | Chặn | Chặn | Cho phép | Cho phép | Cập nhật giá, tồn kho (Staff không được xóa SP) |
| **ADM-05** | Quản lý Danh mục (Chặn xóa danh mục có SP) | Chặn | Chặn | Chặn | Cho phép | Không cho xóa danh mục đang có sản phẩm liên kết |
| **ADM-06** | Quản lý Đơn hàng: Đổi trạng thái, In hóa đơn | Chặn | Chặn | Cho phép | Cho phép | Duyệt đơn, hoàn thành đơn, in hóa đơn PDF/print |
| **ADM-07** | Quản lý Người dùng: Phân quyền & Khóa/Xóa | Chặn | Chặn | Chặn | Cho phép | Đổi role User <-> Staff <-> Admin (Test trên QA_User_2) |
| **ADM-08** | Quản lý Mã giảm giá: CRUD Coupon | Chặn | Chặn | Chặn | Cho phép | Tạo mã code, đặt ngày hiệu lực, % chiết khấu |
| **ADM-09** | Quản lý Flash Sale: Bật/Tắt, Đặt giờ | Chặn | Chặn | Chặn | Cho phép | Đồng bộ thời gian đếm ngược ra trang chủ |
| **ADM-10** | Quản lý Hỗ trợ & Live Chat 2 chiều realtime | Chặn | Chặn | Cho phép | Cho phép | Tiếp nhận phiên chat, gửi nhận tin nhắn realtime |
| **ADM-11** | Quản lý Khiếu nại: Phản hồi khách hàng | Chặn | Chặn | Cho phép | Cho phép | Cập nhật tình trạng giải quyết khiếu nại |
| **ADM-12** | Quản lý Kho hàng (Inventory) & Tồn kho | Chặn | Chặn | Cho phép | Cho phép | Cảnh báo hết hàng, điều chỉnh số lượng |
| **SEC-01** | Chặn User thường/Guest truy cập `/admin` UI | Chặn | Chặn | Cho phép | Cho phép | Kỳ vọng phản hồi chặn và điều hướng về trang chủ `/` |
| **SEC-02** | Phòng chống IDOR (Xem/Sửa đơn/Payment User khác) | Chặn | Chặn | Chặn | Cho phép | User không thể xem/sửa dữ liệu đơn hàng của User khác |
| **SEC-03** | Quét 26 Admin Endpoint & 18 User Endpoint (3 context) | Chặn | Chặn | Phân quyền | Cho phép | Unauthenticated và User thường bị chặn 401/403 |
| **SEC-04** | Kiểm tra ma trận phân quyền Role Staff | Chặn | Chặn | Cho phép | Cho phép | Staff chỉ vào module được phép, ẩn/chặn module nhạy cảm |
| **CROSS-01**| Dữ liệu tạo bởi Admin hiển thị đúng phía User | - | - | - | - | Thêm sản phẩm/danh mục/coupon phải hiện ngay ngoài Web |
| **CROSS-02**| Dữ liệu User tạo hiển thị đúng phía Admin | - | - | - | - | User đặt hàng, gửi khiếu nại, chat phải hiện ngay trong Admin |
