import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { requestPaymentsUser } from '../config/paymentRequest';
import { Table, Tag, Button, Spin, Empty, Descriptions, Modal, Upload, Input, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { createFeedback } from '../config/FeedbackRequest';

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Feedback States
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackOrderId, setFeedbackOrderId] = useState('');
    const [feedbackProduct, setFeedbackProduct] = useState(null);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [fileList, setFileList] = useState([]);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const hasReviewed = (orderId, productId) => {
        try {
            const list = JSON.parse(localStorage.getItem('reviewed_orders') || '[]');
            return list.some(item => item.orderId === orderId && item.productId === productId);
        } catch (e) {
            return false;
        }
    };

    const openFeedbackModal = (orderId, product) => {
        setFeedbackOrderId(orderId);
        setFeedbackProduct(product);
        setRating(5);
        setContent('');
        setFileList([]);
        setFeedbackVisible(true);
    };

    const handleFeedbackSubmit = async () => {
        if (!content.trim()) {
            message.error('Vui lòng nhập nội dung đánh giá!');
            return;
        }
        
        setSubmittingFeedback(true);
        try {
            const formData = new FormData();
            formData.append('paymentId', feedbackOrderId);
            formData.append('productId', feedbackProduct._id);
            formData.append('rating', rating);
            formData.append('content', content);
            
            // Append files
            fileList.forEach(file => {
                formData.append('imagesFeedback', file.originFileObj || file);
            });
            
            const res = await createFeedback(formData);
            message.success(res.message || 'Đánh giá sản phẩm thành công!');
            
            try {
                const list = JSON.parse(localStorage.getItem('reviewed_orders') || '[]');
                list.push({ orderId: feedbackOrderId, productId: feedbackProduct._id });
                localStorage.setItem('reviewed_orders', JSON.stringify(list));
            } catch (e) {
                console.error(e);
            }
            
            setFeedbackVisible(false);
            setContent('');
            setRating(5);
            setFileList([]);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            message.error(error.response?.data?.message || 'Không thể gửi đánh giá, vui lòng thử lại.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const fetchUserOrders = async () => {
        setLoading(true);
        try {
            const res = await requestPaymentsUser();
            setOrders(res.metadata || []);
        } catch (error) {
            console.error('Error fetching user orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserOrders();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0);
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: '_id',
            key: '_id',
            render: (text) => <span className="font-mono text-xs">{text}</span>
        },
        {
            title: 'Sản phẩm',
            key: 'productsList',
            render: (_, record) => {
                const products = record.products || [];
                return (
                    <div className="flex flex-col gap-1.5 max-w-[280px]">
                        {products.map((item, idx) => {
                            const prod = item.productId || {};
                            return (
                                <div key={idx} className="flex items-center gap-2">
                                    <img
                                        src={prod.imagesProduct?.[0] || 'https://via.placeholder.com/40'}
                                        alt={prod.nameProduct}
                                        className="w-8 h-8 object-cover rounded border"
                                    />
                                    <span className="text-xs truncate font-medium text-gray-800" title={prod.nameProduct}>
                                        {prod.nameProduct || 'Sản phẩm đã xóa'} x{item.quantity}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) => <span className="uppercase font-semibold text-xs">{method}</span>
        },
        {
            title: 'Tổng tiền',
            key: 'total',
            render: (_, record) => (
                <span className="font-bold text-red-600">
                    {formatPrice(record.finalPrice || record.totalPrice)}
                </span>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    pending: 'gold',
                    processing: 'blue',
                    shipping: 'cyan',
                    completed: 'green',
                    cancelled: 'red'
                };
                const labels = {
                    pending: 'Chờ xác nhận',
                    processing: 'Đang chuẩn bị',
                    shipping: 'Đang giao',
                    completed: 'Đã hoàn thành',
                    cancelled: 'Đã hủy'
                };
                return (
                    <Tag color={colors[status] || 'default'} className="font-medium text-xs">
                        {labels[status] || status}
                    </Tag>
                );
            }
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => {
                        setSelectedOrder(record);
                        setDetailVisible(true);
                    }}
                >
                    Chi tiết
                </Button>
            )
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col justify-between pt-36">
            <div>
                <header>
                    <Header />
                </header>

                <main className="container mx-auto px-4 py-8 max-w-5xl">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Đơn hàng của tôi</h2>
                            <p className="text-xs text-gray-500">Xem và quản lý tất cả các đơn đặt hàng đã mua tại SneakerHub</p>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center items-center">
                                <Spin size="large" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="py-16 text-center">
                                <Empty description="Bạn chưa có đơn đặt hàng nào" />
                            </div>
                        ) : (
                            <Table
                                columns={columns}
                                dataSource={orders}
                                rowKey="_id"
                                pagination={{ pageSize: 6 }}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            />
                        )}
                    </div>
                </main>
            </div>

            <Footer />

            {/* Order detail modal */}
            <Modal
                title="Chi tiết đơn đặt hàng"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={700}
                destroyOnClose
            >
                {selectedOrder && (
                    <div className="space-y-6 mt-4">
                        <Descriptions bordered column={1} size="small" className="rounded-lg overflow-hidden">
                            <Descriptions.Item label="Mã đơn hàng">{selectedOrder._id}</Descriptions.Item>
                            <Descriptions.Item label="Họ tên nhận hàng">{selectedOrder.fullName}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{selectedOrder.phoneNumber}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ nhận">{selectedOrder.address}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái thanh toán">
                                <span className="uppercase font-semibold">{selectedOrder.paymentMethod}</span>
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2.5">Sản phẩm đã mua:</h4>
                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-150">
                                {selectedOrder.products.map((item, idx) => {
                                    const prod = item.productId || {};
                                    return (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-white hover:bg-gray-50/50">
                                            <img
                                                src={prod.imagesProduct?.[0] || 'https://via.placeholder.com/60'}
                                                alt={prod.nameProduct}
                                                className="w-12 h-12 object-cover rounded border"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate text-gray-900">{prod.nameProduct || 'Sản phẩm đã xóa'}</p>
                                                <p className="text-xs text-gray-500 mb-1">Số lượng: {item.quantity}</p>
                                                {selectedOrder.status === 'completed' && prod._id && (
                                                    hasReviewed(selectedOrder._id, prod._id) ? (
                                                        <span className="inline-block text-[10px] bg-gray-150 text-gray-500 font-semibold px-2 py-0.5 rounded-full border border-gray-250">
                                                            ✓ Đã đánh giá
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openFeedbackModal(selectedOrder._id, prod)}
                                                            className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer border border-blue-200"
                                                        >
                                                            Viết đánh giá
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <span className="font-bold text-sm text-gray-900">{formatPrice(prod.priceProduct * item.quantity)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 border-t border-gray-100 pt-4">
                            <p className="text-xs text-gray-500">Tạm tính: <span className="font-semibold">{formatPrice(selectedOrder.totalPrice)}</span></p>
                            {selectedOrder.couponId && (
                                <p className="text-xs text-green-600">Khuyến mãi: <span className="font-semibold">-{formatPrice(selectedOrder.totalPrice - selectedOrder.finalPrice)}</span></p>
                            )}
                            <p className="text-base font-bold text-red-600 mt-1">Tổng tiền: {formatPrice(selectedOrder.finalPrice || selectedOrder.totalPrice)}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Product Feedback Modal */}
            <Modal
                title={<span className="font-extrabold uppercase text-gray-800 tracking-wider">Đánh giá sản phẩm</span>}
                open={feedbackVisible}
                onCancel={() => setFeedbackVisible(false)}
                footer={null}
                width={500}
                destroyOnClose
            >
                {feedbackProduct && (
                    <div className="space-y-5 mt-4">
                        <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 items-start">
                            <img
                                src={feedbackProduct.imagesProduct?.[0] || 'https://via.placeholder.com/60'}
                                alt={feedbackProduct.nameProduct}
                                className="w-14 h-18 object-contain bg-white border p-1 rounded"
                            />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{feedbackProduct.nameProduct}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Mã sản phẩm: {feedbackProduct._id}</p>
                            </div>
                        </div>

                        {/* Rating Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Đánh giá sao:</label>
                            <div className="flex items-center gap-1.5 py-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-2xl cursor-pointer transition-all duration-150 ${
                                            star <= rating 
                                                ? 'text-amber-400 font-bold scale-110' 
                                                : 'text-gray-300 hover:text-amber-200'
                                        }`}
                                    >
                                        ★
                                    </span>
                                ))}
                                <span className="text-xs text-gray-500 font-semibold ml-2">
                                    {rating === 5 && "Cực kỳ hài lòng 😍"}
                                    {rating === 4 && "Rất tốt 😊"}
                                    {rating === 3 && "Bình thường 🙂"}
                                    {rating === 2 && "Không tốt lắm 😐"}
                                    {rating === 1 && "Rất tệ 😡"}
                                </span>
                            </div>
                        </div>

                        {/* Text area comment */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nhận xét:</label>
                            <Input.TextArea
                                rows={4}
                                placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé (chất liệu, form giày, đóng gói...)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        {/* Upload Images */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Thêm hình ảnh thực tế (tùy chọn):</label>
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onPreview={async (file) => {
                                    let src = file.url || file.preview;
                                    if (!src) {
                                        src = await new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.readAsDataURL(file.originFileObj);
                                            reader.onload = () => resolve(reader.result);
                                        });
                                    }
                                    const image = new Image();
                                    image.src = src;
                                    const imgWindow = window.open(src);
                                    imgWindow?.document.write(image.outerHTML);
                                    imgWindow?.document.close();
                                }}
                                onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                                beforeUpload={() => false}
                                className="scrollbar-custom"
                            >
                                {fileList.length < 5 && (
                                    <div className="text-gray-400">
                                        <p className="text-lg">+</p>
                                        <p className="text-[10px]">Tải ảnh</p>
                                    </div>
                                )}
                            </Upload>
                        </div>

                        {/* Form controls */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button onClick={() => setFeedbackVisible(false)} size="large">
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFeedbackSubmit}
                                loading={submittingFeedback}
                                size="large"
                                className="bg-black text-white hover:bg-gray-800 border-none rounded-xl"
                            >
                                Gửi đánh giá
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default OrderHistory;
