# Kế Hoạch Kiểm Thử Chi Tiết (E2E Test Plan) - SneakerHub

> **Môi trường:** Development  
> - **Giao diện Client (Vite/React):** `http://localhost:5173`  
> - **Máy chủ Backend API (Express):** `http://localhost:3000`  
> - **Cơ sở dữ liệu:** MongoDB `mongodb://127.0.0.1:27017/sneaker`  
> **Tài khoản kiểm thử cố định (Seed Accounts - BẤT KHẢ XÂM PHẠM):**  
> - **User:** `levannghia@gmail.com` / `123456`  
> - **Admin:** `thanhhuy123@gmail.com` / `123456`  
> *(Tuyệt đối không đổi role, không khóa, không xóa, không đổi mật khẩu của 2 tài khoản seed này)*  
> **Tài khoản phụ tạo động qua `/register` cho các test phá hủy/đổi quyền:**  
> - `QA_User_1`: `qa_test_user1@sneakerhub.test` / `123456` (Dùng cho Profile, Cart, IDOR)  
> - `QA_User_2`: `qa_test_user2@sneakerhub.test` / `123456` (Dùng làm Staff xuyên suốt Giai đoạn 3 đến 5)  
> - `QA_User_3`: `qa_test_user3@sneakerhub.test` / `123456` (Dùng cho test Khóa/Xóa tài khoản, Update-role, Revoked JWT)  
> **Quy ước dữ liệu test:** Toàn bộ bản ghi tạo mới đều có tiền tố `QA_` và được ghi lại ID vào `qa/created-data.md` ngay lúc tạo.

---

## BẢNG MA TRẬN ĐỘ PHỦ CHỨC NĂNG (FEATURE MATRIX MAPPING)

| Mã Matrix | Tên Chức Năng | Mã Test Case (TC) | Trọng Tâm & Yêu Cầu An Toàn |
| :--- | :--- | :--- | :--- |
| **PUB-01** | Xem Trang chủ, Slider Banner, Flash Deal, New Balance, Jordan | `TC-PUB-01` | Header, slider, 2 hàng New Balance & Jordan, footer sạch |
| **PUB-02** | Xem Chi tiết sản phẩm, Chọn size, Xem tồn kho | `TC-PUB-02` | Size đổi màu, tồn kho hiển thị đúng 5 chiếc |
| **PUB-03** | Lọc sản phẩm (Thương hiệu, Giá, Size) & Sắp xếp | `TC-PUB-03` | Lọc New Balance, giá 2-4tr, size 42 không reload trang |
| **PUB-04** | Tìm kiếm sản phẩm theo từ khóa (Normal, Edge, XSS) | `TC-PUB-04` | Tìm đúng `QA_Sneaker`, từ khóa rỗng, chuỗi XSS `<script>` |
| **PUB-05** | Chatbot tư vấn tự động (Gemini AI) | `TC-PUB-05` | Hỏi đáp gợi ý sản phẩm, tư vấn size giày |
| **AUTH-01**| Đăng ký tài khoản mới & Validation | `TC-AUTH-01` | Tạo `QA_User_1`, `2`, `3`; chặn email trùng; chặn Mass Assignment `"role":"admin"` |
| **AUTH-02**| Đăng nhập tài khoản & Chống NoSQL Injection | `TC-AUTH-02` | Đăng nhập đúng `levannghia`; thử NoSQL Injection `{"$ne":""}` -> thất bại |
| **AUTH-03**| Quên mật khẩu & Xác thực OTP | `TC-AUTH-03` | Đọc OTP từ MongoDB `otps`; test sai OTP, OTP hết hạn, OTP dùng lại, đúng OTP |
| **AUTH-04**| Xem & Chỉnh sửa hồ sơ cá nhân (`/profile`) | `TC-AUTH-04` | Test trên `QA_User_1`; chặn Mass Assignment `"role":"admin"` |
| **AUTH-05**| Đổi mật khẩu trong Profile | `TC-AUTH-05` | Test trên `QA_User_1`: sai pass cũ, pass yếu, đổi và hoàn trả về `123456` |
| **AUTH-06**| Đăng xuất | `TC-AUTH-06` | Xóa sạch cookie token, bấm Back không xem lại được trang Profile |
| **CART-01**| Thêm sản phẩm vào giỏ hàng (Guest & User) | `TC-CART-01` | Guest thêm giỏ qua cookie `guestId`, User lưu DB |
| **CART-02**| Quản lý giỏ hàng & Gộp giỏ Guest khi đăng nhập | `TC-CART-02` | Test trên `QA_User_1`: Guest thêm giỏ -> login -> kiểm tra giỏ được giữ/gộp |
| **CART-03**| Áp dụng mã giảm giá (Coupon Validation) | `TC-CART-03` | Test: sai mã, hết hạn, hết lượt, đúng mã 10%; trừ lượt 100->99 sau khi đặt; không âm tiền |
| **ORDER-01**| Đặt hàng COD, trừ kho & chặn đặt vượt tồn kho | `TC-ORDER-01` | Dùng `QA_Sneaker_Stock`: chặn đặt >5; đặt 2 SP; tồn kho giảm 5->3; đối chiếu tiền DB |
| **ORDER-02**| Thanh toán MoMo / VNPay Sandbox | `TC-ORDER-02` | Tới cổng thanh toán, bấm hủy quay lại, callback, trạng thái đơn |
| **ORDER-03**| Xem lịch sử đơn hàng & Chi tiết đơn | `TC-ORDER-03` | Xem đơn vừa đặt, trạng thái "Chờ xác nhận", chi tiết đơn |
| **ORDER-04**| Gửi khiếu nại đơn hàng (Complaint) | `TC-ORDER-04` | User gửi khiếu nại; Admin phản hồi -> User thấy phản hồi |
| **ORDER-05**| Đánh giá sản phẩm (Review/Feedback) | `TC-ORDER-05A`, `05B` | Tách 2 phần: (A) Chặn SP chưa mua; (B) Đánh giá sau khi Admin duyệt `completed` |
| **ADM-01** | Truy cập `/admin` (Bảo vệ PrivateAdminRoute) | `TC-ADM-01` | Admin vào thành công; Guest/User bị chặn và điều hướng về `/` |
| **ADM-02** | Xem tổng quan báo cáo Dashboard | `TC-ADM-02` | Đối chiếu KPI trước & sau khi hoàn thành đơn: chênh lệch đúng bằng tổng đơn |
| **ADM-03** | Quản lý Sản phẩm: Upload ảnh giới hạn | `TC-ADM-03` | Upload file không phải ảnh (chặn), file > 5MB (chặn) |
| **ADM-04** | Chỉnh sửa & Xóa sản phẩm | `TC-ADM-04` | Sửa giá SP; validation tên/giá/tồn kho âm; xóa SP bằng Popconfirm |
| **ADM-05** | Quản lý Danh mục: Ràng buộc toàn vẹn | `TC-ADM-05` | KHÔNG xóa Nike; gán SP vào `QA_Brand_Test`, xóa bị chặn; xóa SP rồi xóa DM thành công |
| **ADM-06** | Quản lý Đơn hàng: Đổi trạng thái, In phiếu | `TC-ADM-06` | Chuyển đơn sang "Đã giao hàng" (`completed`), in hóa đơn |
| **ADM-07** | Quản lý Người dùng: Đổi Role, Khóa/Xóa | `TC-ADM-07` | Đổi `QA_User_2` thành Staff; Dùng `QA_User_3` test khóa/xóa user và revoked JWT |
| **ADM-08** | Quản lý Mã giảm giá: CRUD Coupon | `TC-ADM-08` | Tạo, sửa, xóa mã coupon test |
| **ADM-09** | Quản lý Flash Sale: Bật/Tắt, Đặt giờ | `TC-ADM-09` | Lưu cấu hình gốc, sửa test, hoàn trả lại cấu hình cũ nguyên vẹn |
| **ADM-10** | Live Chat 2 chiều realtime | `TC-ADM-10` | User Tab 1 mở chat <-> Admin Tab 2 tiếp nhận & phản hồi realtime |
| **ADM-11** | Quản lý & Phản hồi Khiếu nại | `TC-ADM-11` | Admin phản hồi khiếu nại của User -> User thấy phản hồi |
| **ADM-12** | Quản lý Kho hàng (Inventory) | `TC-ADM-12` | Cảnh báo hết hàng (stock <= 5), điều chỉnh số lượng tồn |
| **SEC-01** | Chặn User thường/Guest vào `/admin` UI | `TC-SEC-01` | Thử gõ trực tiếp URL `/admin` khi chưa đăng nhập và với User |
| **SEC-02** | Phòng chống IDOR mở rộng | `TC-SEC-02` | `QA_User_1` thử xem/sửa/hủy đơn, xem giỏ hàng, xem khiếu nại của `levannghia` |
| **SEC-03** | Quét toàn bộ 26 Admin & 18 User Endpoints | `TC-SEC-03` | Quét 4 ngữ cảnh (Không cookie, User, Staff, Admin) với ID `QA_`, bảng kỳ vọng chi tiết |
| **SEC-04** | Kiểm thử phân quyền Role Staff | `TC-SEC-04` | Staff được vào SP/Đơn/Kho/Chat/Khiếu nại; bị ẩn & chặn Category/User/Coupon/Doanh thu |
| **CROSS-01**| Admin tạo SP & Danh mục QA_ mới | `TC-CROSS-01` | Storefront hiển thị ngay SP và Danh mục mới không cần restart server |
| **CROSS-02**| Dữ liệu User tạo hiển thị ngay phía Admin | `TC-CROSS-02` | Đơn hàng, khiếu nại, tin nhắn chat hiện ngay phía Admin |
| **CROSS-03**| Admin đổi đơn sang "Đã giao" -> User thấy đúng | `TC-CROSS-03` | User tải lại `/orders` thấy trạng thái cập nhật tức thì |

---

## KỊCH BẢN CHI TIẾT TỪNG BƯỚC

### GIAI ĐOẠN 0: SAO LƯU DB & KHỞI TẠO DỮ LIỆU MẪU (BACKUP & ADMIN SEEDING)
*Chạy đầu tiên để bảo vệ dữ liệu và chuẩn bị dữ liệu test phục vụ toàn bộ các giai đoạn sau.*

#### TC-BACKUP-01: Sao lưu toàn bộ Database
- **Mục tiêu:** Tạo bản sao lưu dự phòng cho 11 collections trước khi thực thi bất kỳ thao tác nào.
- **Các bước:**
  1. Chạy script backup trích xuất toàn bộ collection của database `sneaker` sang thư mục `qa/backup/*.json`.
  2. Kiểm tra đủ 11 file json (products, categories, users, carts, payments, coupons, feedbacks, complaints, messages, otps, flashsales).
- **Kỳ vọng:** Sao lưu 100% dữ liệu an toàn.

#### TC-SETUP-01: Admin tạo dữ liệu mẫu cho bài test
- **Mã Matrix:** `ADM-03`, `ADM-05`, `ADM-08`, `ADM-09`
- **Các bước:**
  1. Đăng nhập Admin (`thanhhuy123@gmail.com` / `123456`).
  2. Lưu lại cấu hình Flash Sale hiện tại vào `qa/created-data.md` (để hoàn trả ở Giai đoạn 7).
  3. Tạo danh mục test: `QA_Brand_Test` -> Ghi ID vào `qa/created-data.md`.
  4. Tạo sản phẩm test 1: `QA_Sneaker_Limited` (gán vào `QA_Brand_Test`), giá `1,000,000đ`, tồn kho `10`, size `41, 42` -> Ghi ID vào `qa/created-data.md`.
  5. Tạo sản phẩm test 2: `QA_Sneaker_Stock` (dùng riêng cho test tồn kho `TC-ORDER-01`), giá `1,500,000đ`, tồn kho đúng `5`, size `41, 42` -> Ghi ID vào `qa/created-data.md`.
  6. Tạo 3 mã Coupon test:
     - `QA_COUPON_10`: Giảm 10%, số lượng `100`, hạn dùng 30 ngày tới.
     - `QA_COUPON_EXPIRED`: Giảm 20%, số lượng `100`, hạn dùng trong quá khứ.
     - `QA_COUPON_EMPTY`: Giảm 15%, số lượng `0`, hạn dùng còn hiệu lực.
     - Ghi toàn bộ ID mã giảm giá vào `qa/created-data.md`.
- **Kỳ vọng:** Dữ liệu tạo thành công, có ID lưu trữ phục vụ cleanup.

---

### GIAI ĐOẠN 1: KIỂM THỬ KHÁCH VÃNG LAI (GUEST FLOW) & CHẶN TRUY CẬP

#### TC-PUB-01: Kiểm tra Trang chủ & Khối nội dung
- **Mã Matrix:** `PUB-01`
- **Các bước:** Truy cập `http://localhost:5173/`, kiểm tra Header, Banner slider (Slide 1 Nike, Slide 2 Adidas F1, Slide 3), thanh thương hiệu, Flash Deal, New Balance (10 SP), Promo Duo Banner, Air Jordan 1 (10 SP), Footer sạch (không còn địa chỉ & huy hiệu BCT).
- **Kỳ vọng:** Trang tải mượt, hình ảnh Cloudinary HTTPS, 0 lỗi console.

#### TC-PUB-02: Xem chi tiết sản phẩm, chọn size, tồn kho
- **Mã Matrix:** `PUB-02`
- **Các bước:** Bấm vào sản phẩm `QA_Sneaker_Limited`. Kiểm tra ảnh, giá, mô tả, chọn size 41. Kiểm tra số lượng tồn kho hiển thị.
- **Kỳ vọng:** Chọn size mượt mà, đổi màu active, số lượng tồn kho đúng là `10`.

#### TC-PUB-03: Bộ lọc sản phẩm (Brand, Giá, Size)
- **Mã Matrix:** `PUB-03`
- **Các bước:** Lọc theo thương hiệu New Balance, theo khoảng giá 2-4 triệu, theo size 42.
- **Kỳ vọng:** Danh sách lọc chính xác, không giật lag hay reload trang.

#### TC-PUB-04: Tìm kiếm sản phẩm & XSS Sanitize
- **Mã Matrix:** `PUB-04`
- **Các bước:**
  1. Tìm từ khóa `QA_Sneaker` -> Trả về đúng sản phẩm test.
  2. Tìm từ khóa không có `QA_NON_EXISTENT_XYZ` -> Báo "Không tìm thấy sản phẩm phù hợp".
  3. Tìm chuỗi `<script>alert(1)</script>` -> Hệ thống hiển thị an toàn, không thực thi mã độc.
- **Kỳ vọng:** Sanitize tốt, không lỗi XSS.

#### TC-CART-01 & TC-CART-02: Thêm giỏ hàng Guest & Đăng nhập gộp giỏ
- **Mã Matrix:** `CART-01`, `CART-02`
- **LƯU Ý:** Dùng tài khoản `QA_User_1` (`qa_test_user1@sneakerhub.test`), KHÔNG dùng tài khoản seed `levannghia`.
- **Các bước:**
  1. Guest thêm `QA_Sneaker_Limited` (size 41, số lượng 1) vào giỏ hàng.
  2. Vào `/cart`, kiểm tra sản phẩm có trong giỏ, tổng tiền = 1,000,000đ.
  3. Bấm đăng nhập tài khoản `QA_User_1`.
  4. Quay lại `/cart`: Kiểm tra sản phẩm vừa thêm lúc làm Guest có còn được giữ lại/gộp vào giỏ của `QA_User_1` không.
- **Kỳ vọng:** Ghi nhận thực tế hành vi giỏ hàng Guest -> User (PASS/FAIL hoặc Design Note).

#### TC-GUEST-ORDER: Guest Checkout COD trực tiếp
- **Mã Matrix:** `ORDER-01`, `CART-01`
- **Các bước:**
  1. Mở cửa sổ ẩn danh mới (Guest hoàn toàn).
  2. Thêm 1 sản phẩm `QA_Sneaker_Limited` vào giỏ, bấm "Thanh toán".
  3. Điền Họ tên `QA_Guest_Order`, SĐT `0912345678`, Địa chỉ `QA_Address_Guest`.
  4. Chọn COD -> Bấm Đặt hàng.
- **Kỳ vọng:** Đặt hàng thành công, hiển thị trang hoàn tất thanh toán `/payment-success/:orderId`. Lưu `orderId` vào `created-data.md`.

#### TC-AUTH-01: Đăng ký tài khoản mới & Chặn Mass Assignment
- **Mã Matrix:** `AUTH-01`
- **Các bước:**
  1. Đăng ký tài khoản `QA_User_1` (`qa_test_user1@sneakerhub.test` / `123456`).
  2. Đăng ký tài khoản `QA_User_2` (`qa_test_user2@sneakerhub.test` / `123456`).
  3. Đăng ký tài khoản `QA_User_3` (`qa_test_user3@sneakerhub.test` / `123456`).
  4. Thử đăng ký lại với email `qa_test_user1@sneakerhub.test` -> Báo lỗi "Email đã tồn tại".
  5. Thử đăng ký email sai định dạng `abc@@test`, mật khẩu < 6 ký tự -> Form báo lỗi validation đỏ.
  6. **Chặn Mass Assignment:** Gửi request đăng ký với payload chứa `"role":"admin"`, `"isAdmin":true` -> Kiểm tra bản ghi trong DB: `role` phải là `'user'` và `isAdmin` phải là `false`.
- **Kỳ vọng:** Tạo thành công 3 tài khoản phụ, chặn email trùng và chặn mass assignment leo quyền.

#### TC-AUTH-02: Đăng nhập tài khoản & Chống NoSQL Injection
- **Mã Matrix:** `AUTH-02`
- **Các bước:**
  1. Đăng nhập sai mật khẩu -> Báo lỗi "Tài khoản hoặc mật khẩu không chính xác".
  2. Đăng nhập đúng `levannghia@gmail.com` / `123456` -> Thành công, chuyển hướng trang chủ, cookie `accessToken` và `logged=1` được thiết lập.
  3. **NoSQL Injection Test:** Gửi request login với body `{"email": {"$ne": ""}, "password": {"$ne": ""}}` -> Kỳ vọng: Thất bại, trả về lỗi, không bypass được đăng nhập.
- **Kỳ vọng:** Đăng nhập chuẩn, chống NoSQL injection an toàn.

#### TC-AUTH-03: Quên mật khẩu & Kiểm thử OTP toàn diện
- **Mã Matrix:** `AUTH-03`
- **Các bước:**
  1. Tại màn hình đăng nhập, bấm "Quên mật khẩu", nhập `qa_test_user1@sneakerhub.test`.
  2. Bấm gửi yêu cầu OTP -> Backend tạo OTP lưu vào MongoDB `otps` collection.
  3. Trích xuất mã OTP vừa tạo trực tiếp từ collection `otps`.
  4. Test OTP sai (`000000`) -> Báo lỗi "Mã OTP không hợp lệ".
  5. Test OTP đúng -> Đổi mật khẩu thành công.
  6. Test Replay Attack: Gửi lại request với chính OTP vừa dùng -> Phải bị chặn (vì OTP đã bị xóa).
- **Kỳ vọng:** Quy trình OTP hoạt động chuẩn xác, bảo mật.

#### TC-BLOCK-GUEST: Kiểm tra Guest bị chặn truy cập các trang riêng tư
- **Các bước:**
  1. Khi chưa đăng nhập (Guest), thử truy cập:
     - `/profile` -> Bị điều hướng về `/login`.
     - `/orders` -> Bị điều hướng về `/login`.
     - `/admin` -> Bị điều hướng về `/`.
- **Kỳ vọng:** Toàn bộ trang private đều bảo vệ nghiêm ngặt.

---

## GIAI ĐOẠN 2: KIỂM THỬ KHÁCH HÀNG (USER FLOW) & AN TOÀN ĐƠN HÀNG

#### TC-BLOCK-USER: User đã đăng nhập bị chặn vào trang auth
- **Các bước:** Đăng nhập `levannghia@gmail.com`, cố tình gõ URL `/login` hoặc `/register` -> Bị chặn và điều hướng về trang chủ `/`.
- **Kỳ vọng:** Không cho phép vào lại form đăng nhập/đăng ký khi đã có session.

#### TC-AUTH-04: Xem & Sửa hồ sơ cá nhân (`/profile`)
- **Mã Matrix:** `AUTH-04`
- **LƯU Ý:** Thực hiện trên tài khoản `QA_User_1`.
- **Các bước:**
  1. Đăng nhập `QA_User_1`, vào `/profile`.
  2. Cập nhật Số điện thoại `0988776655`, địa chỉ `QA_Home_User` -> Bấm Lưu -> Thành công.
  3. **Mass Assignment Check:** Gửi request `PUT /api/user/update-profile` kèm `"role":"admin"`, `"isAdmin":true` -> Kiểm tra DB: Quyền của `QA_User_1` vẫn là `'user'`.
- **Kỳ vọng:** Cập nhật thông tin thành công, chặn leo quyền.

#### TC-AUTH-05: Đổi mật khẩu (Validation & Revert)
- **Mã Matrix:** `AUTH-05`
- **LƯU Ý:** Thực hiện trên tài khoản `QA_User_1`.
- **Các bước:**
  1. Nhập sai mật khẩu cũ -> Báo lỗi mật khẩu cũ không đúng.
  2. Nhập mật khẩu mới quá ngắn -> Báo lỗi độ dài mật khẩu.
  3. Đổi mật khẩu mới `654321` -> Thành công.
  4. Đổi lại về mật khẩu ban đầu `123456`.
- **Kỳ vọng:** Hoàn trả mật khẩu về `123456`.

#### TC-CART-03: Kiểm tra Mã giảm giá (Coupon Validation)
- **Mã Matrix:** `CART-03`
- **Các bước:**
  1. Thêm sản phẩm `QA_Sneaker_Limited` (1,000,000đ) vào giỏ hàng.
  2. Áp mã sai `QA_INVALID_CODE` -> Báo "Mã giảm giá không tồn tại".
  3. Áp mã hết hạn `QA_COUPON_EXPIRED` -> Báo "Mã giảm giá đã hết hạn".
  4. Áp mã hết lượt `QA_COUPON_EMPTY` -> Báo "Mã giảm giá đã hết số lượng".
  5. Áp mã hợp lệ `QA_COUPON_10` (10%) -> Giảm 100,000đ, còn lại 900,000đ (không âm tiền).
  6. Hủy mã giảm giá -> Tiền quay về 1,000,000đ.
- **Kỳ vọng:** Kiểm duyệt coupon chuẩn xác.

#### TC-ORDER-01: Kiểm tra Tồn kho, Chặn vượt tồn & Trừ lượt Coupon
- **Mã Matrix:** `ORDER-01`, `CART-03`
- **Sản phẩm kiểm thử riêng:** `QA_Sneaker_Stock` (Tồn kho ban đầu: `5`).
- **Các bước:**
  1. Ghi nhận tồn kho ban đầu: **5 chiếc**. Ghi nhận số lượt `QA_COUPON_10` ban đầu: **100 lượt**.
  2. Thêm vào giỏ hàng số lượng `6` -> Báo lỗi "Số lượng sản phẩm trong kho không đủ (chỉ còn 5 sản phẩm)" và chặn đặt hàng.
  3. **Kiểm tra can thiệp giá (Tampering Check):** Thử gửi request đặt hàng với `totalPrice: 1000` hoặc `finalPrice: 1000` -> Server phải tự động tính toán lại giá từ database hoặc từ chối đơn hàng.
  4. Đặt số lượng `2 chiếc`. Áp mã `QA_COUPON_10` (giảm 10% từ 3,000,000đ còn 2,700,000đ).
  5. Chọn COD -> Đặt hàng thành công -> Lưu `orderId` vào `qa/created-data.md`.
  6. **Đối chiếu số liệu sau đặt hàng:**
     - Tồn kho `QA_Sneaker_Stock`: Giảm từ **5 -> 3** (Ghi nhận Trước: 5, Sau: 3).
     - Số lượt `QA_COUPON_10`: Giảm từ **100 -> 99** (Ghi nhận Trước: 100, Sau: 99).
     - Đối chiếu tổng tiền trong DB: Khớp chính xác với số tiền hiển thị trên hóa đơn.
- **Kỳ vọng:** Toàn bộ logic tồn kho, coupon, tiền tệ khớp 100%.

#### TC-ORDER-02: Thanh toán MoMo / VNPay Sandbox
- **Mã Matrix:** `ORDER-02`
- **Các bước:**
  1. Thêm 1 sản phẩm `QA_Sneaker_Limited` vào giỏ, chọn thanh toán VNPay Sandbox.
  2. Kiểm tra chuyển hướng thành công đến cổng VNPay Sandbox.
  3. Bấm "Hủy thanh toán / Quay lại" trên cổng VNPay -> Quay về web, kiểm tra xử lý callback và trạng thái đơn.
  4. Thử nghiệm tương tự với MoMo Sandbox.
- **Kỳ vọng:** Điều hướng tới cổng thanh toán và xử lý callback an toàn.

#### TC-ORDER-03: Xem Lịch sử đơn hàng
- **Mã Matrix:** `ORDER-03`
- **Các bước:** Vào `/orders`, kiểm tra đơn hàng vừa đặt có mặt trong danh sách, trạng thái "Chờ xác nhận".
- **Kỳ vọng:** Hiển thị chính xác đơn hàng.

#### TC-ORDER-05A: Chặn Đánh giá Sản phẩm CHƯA MUA
- **Mã Matrix:** `ORDER-05`
- **Các bước:** Gửi request đánh giá cho một sản phẩm người dùng chưa từng mua hoặc đơn chưa hoàn thành.
- **Kỳ vọng:** Bị chặn với lỗi "Đơn hàng chưa hoàn thành" hoặc "Sản phẩm này không nằm trong đơn hàng đã mua".

#### TC-ORDER-04: Gửi khiếu nại đơn hàng (Complaint)
- **Mã Matrix:** `ORDER-04`
- **Các bước:** Chọn đơn hàng vừa đặt, bấm gửi khiếu nại với lý do `QA_Test_Complaint_Reason` -> Gửi thành công. Lưu ID khiếu nại vào `created-data.md`.
- **Kỳ vọng:** Khiếu nại được tạo và gửi lên hệ thống quản trị.

#### TC-PUB-05: Chatbot tư vấn AI (Gemini)
- **Mã Matrix:** `PUB-05`
- **Các bước:** Mở widget chat, gửi tin nhắn hỏi "Tư vấn cho tôi giày chạy bộ" -> AI phản hồi thông minh, có gợi ý sản phẩm.
- **Kỳ vọng:** Gemini API phản hồi tốt.

#### TC-AUTH-06: Đăng xuất tài khoản
- **Mã Matrix:** `AUTH-06`
- **Các bước:** Bấm Đăng xuất -> Cookie token bị xóa -> Bấm nút Back -> Chuyển hướng về login.
- **Kỳ vọng:** Đăng xuất an toàn.

---

### GIAI ĐOẠN 3: KIỂM THỬ QUẢN TRỊ VIÊN & NHÂN VIÊN (ADMIN & STAFF FLOW)

#### TC-ADM-01: Đăng nhập Admin & Bảo vệ phân quyền
- **Mã Matrix:** `ADM-01`
- **Các bước:** Đăng nhập `thanhhuy123@gmail.com` / `123456`, vào `/admin`.
- **Kỳ vọng:** Truy cập trang quản trị thành công.

#### TC-ADM-02: Đối chiếu số liệu KPI Dashboard
- **Mã Matrix:** `ADM-02`
- **Các bước:**
  1. Ghi nhận doanh thu và số đơn hàng hiện tại trên KPI cards: **Doanh thu trước: X**, **Số đơn trước: Y**.
  2. Tiến hành duyệt 1 đơn hàng test sang trạng thái "Đã giao hàng" (`completed`) với giá trị `Z`.
  3. Tải lại Dashboard: Doanh thu mới phải bằng **X + Z**, số đơn hoàn thành phải tăng thêm **1**.
- **Kỳ vọng:** Số liệu thống kê tăng trưởng chính xác từng đồng.

#### TC-ADM-03: Upload ảnh giới hạn & File không hợp lệ
- **Mã Matrix:** `ADM-03`
- **Các bước:**
  1. Vào tab Sản phẩm -> Thêm sản phẩm.
  2. Upload file không phải ảnh (file `.txt`, `.pdf`) -> Bị chặn: "Chỉ chấp nhận các tệp hình ảnh hợp lệ".
  3. Upload file ảnh > 5MB -> Bị chặn vượt quá kích thước.
- **Kỳ vọng:** Chặn tệp không hợp lệ.

#### TC-ADM-04: Sửa/Xóa sản phẩm, Validation & Phân quyền Staff
- **Mã Matrix:** `ADM-04`
- **Các bước:**
  1. Thêm/sửa sản phẩm: Thử để trống tên/giá -> Form báo lỗi bắt buộc.
  2. Thử nhập giá âm (`-500000`) hoặc tồn kho âm -> Chặn lưu.
  3. Sửa giá sản phẩm `QA_Sneaker_Limited` thành `1,200,000đ` -> Thành công.
  4. Test xóa sản phẩm: Bấm Xóa -> Modal Popconfirm hiện ra hỏi xác nhận -> Bấm Hủy (không xóa) -> Bấm Xóa lần 2 và xác nhận -> Sản phẩm được xóa.
  5. **Staff Check:** Đăng nhập Staff, vào mục Quản lý Giày -> Nút Xóa sản phẩm bị ẩn trên UI; gửi request `DELETE /api/product/delete/:id` bằng cookie Staff -> Bị chặn `403 Forbidden`.
- **Kỳ vọng:** Toàn vẹn dữ liệu và phân quyền xóa sản phẩm nghiêm ngặt.

#### TC-ADM-05: Ràng buộc toàn vẹn Danh mục & Chặn xóa
- **Mã Matrix:** `ADM-05`
- **QUY TẮC AN TOÀN:** *TUYỆT ĐỐI KHÔNG thử xóa danh mục Nike hay danh mục gốc.*
- **Các bước:**
  1. Danh mục `QA_Brand_Test` hiện đang chứa sản phẩm `QA_Sneaker_Limited`.
  2. Bấm xóa danh mục `QA_Brand_Test` -> Kỳ vọng: Hệ thống chặn và báo lỗi rõ ràng "Không thể xóa thương hiệu đang có X sản phẩm hoạt động".
  3. Xóa sản phẩm `QA_Sneaker_Limited` trước.
  4. Bấm xóa lại danh mục `QA_Brand_Test` -> Kỳ vọng: Xóa thành công.
- **Kỳ vọng:** Ràng buộc khóa ngoại logic hoạt động chuẩn xác, không sinh orphan data.

#### TC-ADM-06: Xử lý Đơn hàng & In hóa đơn
- **Mã Matrix:** `ADM-06`
- **Các bước:**
  1. Vào tab Đơn hàng, tìm đơn hàng do User đặt ở Giai đoạn 2.
  2. Bấm xem chi tiết đơn hàng (Modal OrderDetailView).
  3. Đổi trạng thái đơn hàng: Từ "Chờ xác nhận" -> "Đang giao hàng" -> "Đã giao hàng" (`completed`).
  4. Bấm "In hóa đơn" -> Mở phiếu in `OrderPrintModal` hiển thị thông tin sản phẩm, mã đơn, tiền thanh toán.
- **Kỳ vọng:** Cập nhật trạng thái thành công, phiếu in đẹp và chuẩn.

#### TC-ORDER-05B: Đánh giá sau khi mua & Admin duyệt hiển thị
- **Mã Matrix:** `ORDER-05`
- **Các bước:**
  1. Sau khi đơn hàng đã chuyển sang `completed`, User mở trang chi tiết đơn/sản phẩm.
  2. Gửi đánh giá 5 sao kèm nhận xét "Giày rất êm, giao hàng nhanh".
  3. Đánh giá thành công.
  4. Mở phía Admin: Admin thấy đánh giá mới của User xuất hiện trong hệ thống.
- **Kỳ vọng:** Đánh giá hợp lệ được chấp nhận và hiển thị đầy đủ.

#### TC-ADM-11: Quản lý & Phản hồi Khiếu nại (2 chiều)
- **Mã Matrix:** `ADM-11`, `ORDER-04`
- **Các bước:**
  1. Admin vào tab Quản lý khiếu nại, tìm khiếu nại do User gửi ở Giai đoạn 2.
  2. Nhập nội dung phản hồi `QA_Response_Approved` -> Bấm Gửi phản hồi.
  3. Mở tab User: User tải lại trang khiếu nại/đơn hàng -> Thấy phản hồi `QA_Response_Approved` của Admin.
- **Kỳ vọng:** Luồng khiếu nại 2 chiều thông suốt.

#### TC-ADM-12: Quản lý Kho hàng (Inventory)
- **Mã Matrix:** `ADM-12`
- **Các bước:** Vào tab Quản lý kho, kiểm tra danh sách sản phẩm cảnh báo sắp hết hàng (stock <= 5, ví dụ `QA_Sneaker_Stock` còn 3 chiếc). Thử điều chỉnh tồn kho.
- **Kỳ vọng:** Cảnh báo tồn kho hoạt động chính xác.

#### TC-ADM-09: Cấu hình Flash Sale & Hoàn trả dữ liệu gốc
- **Mã Matrix:** `ADM-09`
- **Các bước:**
  1. Vào tab Cấu hình Flash Sale, thử đổi tiêu đề thành `QA_Flash_Sale_Test` -> Lưu thành công.
  2. Kiểm tra ngoài trang chủ tiêu đề đổi thành `QA_Flash_Sale_Test`.
  3. **Hoàn trả giá trị cũ:** Lấy lại giá trị ban đầu từ `qa/created-data.md` và lưu lại -> Đánh dấu "Đã hoàn trả: Có" trong `created-data.md`.
- **Kỳ vọng:** Cập nhật thành công và hoàn trả nguyên vẹn cấu hình ban đầu.

#### TC-ADM-07 & TC-SEC-04: Quản lý Người dùng & Phân quyền Role Staff
- **Mã Matrix:** `ADM-07`, `SEC-04`
- **LƯU Ý:**
  - Dùng `QA_User_2` để đổi role thành `staff` và GIỮ NGUYÊN role staff đến hết Giai đoạn 5 để phục vụ quét API.
  - Dùng `QA_User_3` để test Khóa tài khoản / Xóa tài khoản.
- **Các bước:**
  1. Đổi role `QA_User_2` thành `staff` -> Thành công.
  2. Đăng nhập bằng `QA_User_2` (vai trò Staff):
     - Kiểm tra Menu ĐƯỢC PHÉP: Dashboard, Quản lý Giày, Quản lý kho, Quản lý đơn hàng, Hỗ trợ khách hàng, Quản lý khiếu nại.
     - Kiểm tra Menu BỊ ẨN/CHẶN: Quản lý Thương hiệu (categories), Quản lý tài khoản (users), Quản lý khuyến mãi (coupons), Thống kê doanh thu (revenue), Quản lý nhân viên (staff-mgmt), Cấu hình Flash Sale, Cấu hình hệ thống.
  3. **Test Khóa & Xóa User (trên `QA_User_3`):**
     - Đăng nhập `QA_User_3`, lấy token JWT.
     - Admin thực hiện khóa/xóa `QA_User_3`.
     - Thử đăng nhập lại `QA_User_3` -> Bị chặn.
     - Dùng token JWT cũ của `QA_User_3` gửi request API -> Bị từ chối (User không tồn tại).
- **Kỳ vọng:** Phân quyền role Staff và cơ chế khóa/xóa tài khoản an toàn tuyệt đối.

---

## GIAI ĐOẠN 4: KIỂM THỬ LIVE CHAT 2 CHIỀU REALTIME

#### TC-ADM-10: Live Chat Realtime (User Tab 1 <-> Admin Tab 2)
- **Mã Matrix:** `ADM-10`
- **Các bước:**
  1. Trình duyệt 1 (User `levannghia@gmail.com`): Mở widget chat, gửi: `"QA_Xin chào, tôi cần hỗ trợ size giày"`.
  2. Trình duyệt 2 (Admin `thanhhuy123@gmail.com`): Vào tab Hỗ trợ khách hàng, thấy phiên chat chờ. Bấm "Tiếp nhận chat".
  3. Admin gửi: `"QA_Chào bạn, shop có thể giúp gì cho bạn?"`.
  4. Kiểm tra Trình duyệt 1: Tin nhắn của Admin xuất hiện realtime tức thì.
  5. Admin bấm "Kết thúc cuộc trò chuyện".
- **Kỳ vọng:** Giao tiếp 2 chiều realtime mượt mà, lưu lịch sử trong DB.

---

## GIAI ĐOẠN 5: BẢO MẬT, IDOR & QUÉT MA TRẬN API (SECURITY & ACCESS CONTROL)

#### TC-SEC-01: Chặn truy cập UI `/admin` trái phép
- **Mã Matrix:** `SEC-01`
- **Các bước:** User thường và Guest truy cập `http://localhost:5173/admin` -> Bị chặn và điều hướng về trang chủ `/`.
- **Kỳ vọng:** Chặn 100% truy cập trái phép.

#### TC-SEC-02: Phòng chống IDOR mở rộng
- **Mã Matrix:** `SEC-02`
- **Các bước:**
  1. Dùng tài khoản `QA_User_1` cố tình can thiệp vào dữ liệu của `levannghia@gmail.com`:
     - Xem chi tiết đơn hàng của `levannghia`: `GET /api/payment/order/:id_levannghia` -> Kỳ vọng: `400/403`.
     - Xem giỏ hàng của `levannghia`: Request giỏ hàng kèm ID người khác -> Kỳ vọng: Chỉ lấy giỏ của chính mình.
     - Gửi đánh giá cho đơn hàng của `levannghia` -> Kỳ vọng: Bị chặn.
     - Xem khiếu nại của `levannghia` -> Kỳ vọng: Bị chặn.
- **Kỳ vọng:** Phòng chống IDOR toàn diện trên mọi phân hệ.

#### TC-SEC-03: Quét Ma Trận 26 Admin & 18 User Endpoints với 4 Ngữ Cảnh
- **Mã Matrix:** `SEC-03`
- **QUY TẮC AN TOÀN:** *Mọi request chỉ trỏ vào ID của bản ghi `QA_` (ví dụ `QA_User_3`) hoặc ObjectId giả lập không tồn tại. Tuyệt đối không trỏ vào dữ liệu gốc.*
- **4 Ngữ cảnh:**
  1. **Ngữ cảnh 1:** Không có cookie xác thực (Guest).
  2. **Ngữ cảnh 2:** Cookie User thường (`levannghia@gmail.com`).
  3. **Ngữ cảnh 3:** Cookie Staff (`QA_User_2` đang giữ role staff).
  4. **Ngữ cảnh 4:** Cookie Admin (`thanhhuy123@gmail.com` - Baseline kiểm chứng).

##### Bảng Kỳ Vọng Phân Quyền Cho 26 Admin Endpoints:
| STT | Endpoint | Guest | User | Staff | Admin (Baseline) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `GET /api/user/admin/list` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 2 | `DELETE /api/user/admin/delete/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 3 | `PUT /api/user/admin/toggle-admin/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 4 | `PUT /api/user/admin/update-role/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 5 | `GET /api/user/admin/staff-report/:staffId` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 6 | `POST /api/product/upload-image` | 401/403 | 401/403 | 200 OK (Được upload) | 200 OK |
| 7 | `POST /api/product/create` | 401/403 | 401/403 | 200 OK (Được tạo SP) | 200 OK |
| 8 | `PUT /api/product/update/:id` | 401/403 | 401/403 | 200 OK (Được sửa SP) | 200 OK |
| 9 | `DELETE /api/product/delete/:id` | 401/403 | 401/403 | 403 (Chặn xóa SP) | 200 OK |
| 10 | `POST /api/category/upload-image` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 11 | `POST /api/category/create` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 12 | `PUT /api/category/update/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 13 | `DELETE /api/category/delete/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 14 | `GET /api/payment/admin/list` | 401/403 | 401/403 | 200 OK (Xem đơn) | 200 OK |
| 15 | `PUT /api/payment/admin/update/:orderId` | 401/403 | 401/403 | 200 OK (Duyệt đơn) | 200 OK |
| 16 | `POST /api/coupon/create` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 17 | `GET /api/coupon/list` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 18 | `PUT /api/coupon/update/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 19 | `DELETE /api/coupon/delete/:id` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 20 | `GET /api/complaint/list` | 401/403 | 401/403 | 200 OK (Xem khiếu nại) | 200 OK |
| 21 | `PUT /api/complaint/respond/:id` | 401/403 | 401/403 | 200 OK (Xử lý khiếu nại) | 200 OK |
| 22 | `POST /api/flashsale/set` | 401/403 | 401/403 | 403 (Bị chặn) | 200 OK |
| 23 | `GET /api/message/conversations` | 401/403 | 401/403 | 200 OK (Chat CSKH) | 200 OK |
| 24 | `POST /api/message/accept` | 401/403 | 401/403 | 200 OK (Tiếp nhận chat) | 200 OK |
| 25 | `POST /api/message/close` | 401/403 | 401/403 | 200 OK (Đóng chat) | 200 OK |
| 26 | `GET /api/message/stats` | 401/403 | 401/403 | 200 OK (Xem thống kê chat) | 200 OK |

##### Danh Sách 18 User/Protected Endpoints Được Quét:
1. `GET /api/user/auth`
2. `GET /api/user/logout`
3. `PUT /api/user/update-profile`
4. `PUT /api/user/change-password`
5. `POST /api/payment/create`
6. `GET /api/payment/order/:orderId`
7. `GET /api/payment/user/list`
8. `POST /api/complaint/create`
9. `GET /api/complaint/user-list`
10. `POST /api/feedback/create`
11. `POST /api/cart/create`
12. `PUT /api/cart/update`
13. `DELETE /api/cart/delete/:productId`
14. `GET /api/cart/get`
15. `PUT /api/cart/update-info`
16. `PUT /api/cart/apply-coupon`
17. `GET /api/message`
18. `POST /api/message`

#### TC-SEC-05: Bảo mật JWT Token
- **Các bước:**
  1. Gửi request kèm token JWT bị chỉnh sửa payload hoặc sai signature -> Kỳ vọng: `401 Unauthorized`.
  2. Gửi request kèm token JWT đã hết hạn -> Kỳ vọng: `401 Unauthorized` hoặc tự động xóa cookie.
- **Kỳ vọng:** Token integrity bảo mật.

#### TC-SMOKE-STAFF-ADMIN: Smoke Test Storefront cho Staff và Admin
- **Mã Matrix:** Ma trận phân quyền
- **Các bước:** Đăng nhập Staff và Admin, thử duyệt storefront, thêm vào giỏ hàng, thực hiện checkout COD.
- **Kỳ vọng:** Staff và Admin đều có thể mua hàng như người dùng bình thường.

#### TC-RACE-01: (Tùy chọn) Kiểm tra Race Condition khi mua hàng
- **Các bước:** Sản phẩm còn tồn kho đúng `1`. Gửi đồng thời 2 request đặt hàng song song trong cùng 1 mili-giây.
- **Kỳ vọng:** Chỉ có đúng 1 request thành công, request thứ hai bị từ chối do hết tồn kho, không xảy ra bán âm (negative stock).

---

## GIAI ĐOẠN 6: KIỂM THỬ ĐỒNG BỘ DỮ LIỆU CHÉO (CROSS-SYNC)

#### TC-CROSS-01: Admin tạo SP & Danh mục -> Storefront nhận tức thì
- **Mã Matrix:** `CROSS-01`
- **Các bước:** Admin tạo 1 danh mục mới và 1 sản phẩm mới -> Mở ngay tab người dùng duyệt storefront -> Thấy danh mục và sản phẩm xuất hiện ngay lập tức mà không cần khởi động lại server.
- **Kỳ vọng:** Đồng bộ dữ liệu realtime.

#### TC-CROSS-02: User tương tác -> Hiển thị ngay phía Admin
- **Mã Matrix:** `CROSS-02`
- **Các bước:** User gửi khiếu nại mới -> Admin vào tab Quản lý khiếu nại thấy ngay.
- **Kỳ vọng:** Admin nhận dữ liệu mới đầy đủ.

#### TC-CROSS-03: Admin đổi trạng thái đơn -> User thấy ngay
- **Mã Matrix:** `CROSS-03`
- **Các bước:** Admin đổi trạng thái đơn hàng sang "Đã giao hàng" (`completed`) -> User tải lại trang `/orders` thấy trạng thái cập nhật tức thì.
- **Kỳ vọng:** Đồng bộ trạng thái đơn hàng 2 chiều.

---

## GIAI ĐOẠN 7: PHI CHỨC NĂNG, DỌN DẸP AN TOÀN & XUẤT BÁO CÁO

#### TC-NFR-01: Kiểm tra Console Errors & Failed Network Requests
- **Các bước:** Thu thập toàn bộ log Console và các request 4xx/5xx trong suốt quá trình chạy.
- **Kỳ vọng:** 0 lỗi React fatal crash, 0 lỗi 500 server crash.

#### TC-NFR-02: Kiểm tra Responsive đa thiết bị
- **Các bước:** Kiểm tra layout tại: Mobile (375px), Tablet (768px), Desktop (1440px).
- **Kỳ vọng:** Không vỡ layout, menu co giãn mượt mà.

#### TC-CLEANUP-01: Dọn dẹp dữ liệu an toàn tuyệt đối (Safe Cleanup)
- **Quy trình thực hiện:**
  1. Đọc danh sách ID từ `qa/created-data.md`.
  2. Liệt kê toàn bộ các bản ghi `QA_` cần xóa ra log trước khi xóa.
  3. Hoàn trả cấu hình Flash Sale về đúng giá trị gốc ban đầu.
  4. Thực hiện xóa các bản ghi test đã tạo:
     - Xóa sản phẩm `QA_Sneaker_Limited`, `QA_Sneaker_Stock`.
     - Xóa danh mục `QA_Brand_Test`.
     - Xóa các mã coupon `QA_COUPON_10`, `QA_COUPON_EXPIRED`, `QA_COUPON_EMPTY`.
     - Xóa các tài khoản phụ `QA_User_1`, `QA_User_2`, `QA_User_3`.
     - Với các đơn hàng test (nếu hệ thống không hỗ trợ xóa cứng đơn hàng): Ghi rõ danh sách orderId trong báo cáo `qa/report.md`.
  5. TUYỆT ĐỐI không xóa hay chỉnh sửa bất kỳ bản ghi gốc nào trong cơ sở dữ liệu.
- **Kỳ vọng:** Hệ thống sạch sẽ, nguyên vẹn dữ liệu gốc.
