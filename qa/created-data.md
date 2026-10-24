# Danh Sách Dữ Liệu Tạo Trong Quá Trình Test (QA Created Data)

> File này ghi nhận tất cả ID của các bản ghi có tiền tố `QA_` được tạo ra trong quá trình chạy test E2E.
> Khi dọn dẹp (Cleanup), hệ thống CHỈ xóa các bản ghi có ID được liệt kê trong danh sách này.

## 1. Danh mục (Categories)
- `QA_Brand_Test`: (Chưa tạo - sẽ ghi ID lúc tạo)

## 2. Sản phẩm (Products)
- `QA_Sneaker_Limited`: (Chưa tạo - gán vào QA_Brand_Test)
- `QA_Sneaker_Stock`: (Chưa tạo - dùng riêng cho test tồn kho ORDER-01)

## 3. Mã giảm giá (Coupons)
- `QA_COUPON_10`: (Chưa tạo)
- `QA_COUPON_EXPIRED`: (Chưa tạo)
- `QA_COUPON_EMPTY`: (Chưa tạo)

## 4. Tài khoản kiểm thử phụ (Users)
- `QA_User_1` (`qa_test_user1@sneakerhub.test`): Dùng cho Profile/Cart/IDOR
- `QA_User_2` (`qa_test_user2@sneakerhub.test`): Dùng cho Role Staff xuyên suốt Giai đoạn 3-5
- `QA_User_3` (`qa_test_user3@sneakerhub.test`): Dùng cho test Khóa/Xóa tài khoản, Update-role, Revoked JWT

## 5. Đơn hàng kiểm thử (Orders / Payments)
- `QA_Order_COD`: (Chưa tạo)
- `QA_Order_Guest`: (Chưa tạo)

## 6. Cuộc chat & Tin nhắn (Messages)
- `QA_Chat_Session`: (Chưa tạo)

## 7. Khiếu nại kiểm thử (Complaints)
- `QA_Complaint`: (Chưa tạo)

## 8. Đánh giá kiểm thử (Feedbacks)
- `QA_Feedback`: (Chưa tạo)

## 9. Bản ghi gốc đã sửa (Track & Rollback)
| Tên Bản Ghi / Cấu Hình | Giá Trị Ban Đầu (Before) | Giá Trị Khi Test (During) | Đã Hoàn Trả? (Reverted) |
| :--- | :--- | :--- | :---: |
| Cấu hình Flash Sale (`title`, `endTime`) | (Chưa ghi) | (Chưa sửa) | Chưa |
| Profile User Seed (`levannghia@gmail.com`) | *Không sửa* | *Không sửa* | N/A |
| Mật khẩu User Seed (`levannghia@gmail.com`) | *Không sửa* | *Không sửa* | N/A |
