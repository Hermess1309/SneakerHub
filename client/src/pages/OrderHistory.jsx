import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { requestPaymentsUser } from '../config/paymentRequest';
import { Table, Tag, Button, Spin, Empty, Descriptions, Modal, Upload, Input, Select, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { createFeedback } from '../config/FeedbackRequest';
import { createComplaint, listUserComplaints } from '../config/ComplaintRequest';

const { Option } = Select;

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

    // Complaint States
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [complaintVisible, setComplaintVisible] = useState(false);
    const [complaintOrderId, setComplaintOrderId] = useState('');
    const [complaintProduct, setComplaintProduct] = useState(null);
    const [complaintReason, setComplaintReason] = useState('Sai kích cỡ');
    const [complaintContent, setComplaintContent] = useState('');
    const [complaintFileList, setComplaintFileList] = useState([]);
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

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

    const fetchComplaints = async () => {
        setLoadingComplaints(true);
        try {
            const res = await listUserComplaints();
            setComplaints(res.metadata || []);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoadingComplaints(false);
        }
    };

    const openComplaintModal = (orderId, product) => {
        setComplaintOrderId(orderId);
        setComplaintProduct(product);
        setComplaintReason('Sai kích cỡ');
        setComplaintContent('');
        setComplaintFileList([]);
        setComplaintVisible(true);
    };

    const handleComplaintSubmit = async () => {
        if (!complaintContent.trim()) {
            message.error('Vui lòng nhập nội dung khiếu nại!');
            return;
        }

        setSubmittingComplaint(true);
        try {
            const formData = new FormData();
            formData.append('paymentId', complaintOrderId);
            formData.append('reason', complaintReason);
            formData.append('content', complaintContent);

            complaintFileList.forEach(file => {
                formData.append('images', file.originFileObj || file);
            });

            const res = await createComplaint(formData);
            message.success(res.message || 'Gửi khiếu nại thành công!');
            setComplaintVisible(false);
            fetchComplaints();
        } catch (error) {
            console.error('Error sending complaint:', error);
            message.error(error.response?.data?.message || 'Không thể gửi khiếu nại, vui lòng thử lại.');
        } finally {
            setSubmittingComplaint(false);
        }
    };

    useEffect(() => {
        fetchUserOrders();
        fetchComplaints();
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
            width: 180,
            render: (_, record) => (
                <div className="flex gap-2">
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
                    {record.status !== 'cancelled' && (
                        <Button
                            danger
                            size="small"
                            onClick={() => {
                                const firstProd = record.products?.[0]?.productId || null;
                                openComplaintModal(record._id, firstProd);
                            }}
                        >
                            Khiếu nại
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col justify-between pt-36">
            <div>
                <header>
                    <Header />
                </header>

                <main className="mx-auto px-4 py-8 max-w-[94%] w-full">
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
                                scroll={{ x: 1000 }}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            />
                        )}
                    </div>

                    {/* Complaints History Section */}
                    <div className="mt-12 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Khiếu nại của tôi</h3>
                        <p className="text-xs text-gray-500 mb-5">Danh sách các khiếu nại sản phẩm/đơn hàng gửi đến hệ thống</p>
                        
                        <Table
                            columns={[
                                {
                                    title: 'Mã khiếu nại',
                                    dataIndex: '_id',
                                    key: '_id',
                                    render: (text) => <span className="font-mono text-xs text-gray-500">{text}</span>
                                },
                                {
                                    title: 'Mã đơn hàng',
                                    dataIndex: 'paymentId',
                                    key: 'paymentId',
                                    render: (payment) => <span className="font-mono text-xs text-gray-500">{payment?._id || 'N/A'}</span>
                                },
                                {
                                    title: 'Lý do',
                                    dataIndex: 'reason',
                                    key: 'reason',
                                    render: (text) => <span className="font-semibold text-gray-800 text-xs">{text}</span>
                                },
                                {
                                    title: 'Nội dung khiếu nại',
                                    dataIndex: 'content',
                                    key: 'content',
                                    render: (text) => <span className="text-xs text-gray-700">{text}</span>
                                },
                                {
                                    title: 'Ảnh đính kèm',
                                    dataIndex: 'images',
                                    key: 'images',
                                    render: (imgs) => (
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(imgs || []).map((img, i) => (
                                                <img 
                                                    key={i} 
                                                    src={img} 
                                                    alt="evidence" 
                                                    className="w-8 h-8 object-cover rounded border cursor-pointer"
                                                    onClick={() => window.open(img)}
                                                />
                                            ))}
                                            {(!imgs || imgs.length === 0) && <span className="text-gray-400 text-xs italic">Không có</span>}
                                        </div>
                                    )
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    key: 'status',
                                    render: (status) => {
                                        const colors = {
                                            pending: 'orange',
                                            processing: 'blue',
                                            resolved: 'green',
                                            rejected: 'red'
                                        };
                                        const texts = {
                                            pending: 'Chờ xử lý',
                                            processing: 'Đang xử lý',
                                            resolved: 'Đã giải quyết',
                                            rejected: 'Từ chối'
                                        };
                                        return <Tag color={colors[status] || 'default'} className="font-semibold text-xs">{texts[status] || status}</Tag>;
                                    }
                                },
                                {
                                    title: 'Phản hồi từ shop',
                                    dataIndex: 'adminResponse',
                                    key: 'adminResponse',
                                    render: (text) => text ? <span className="text-xs text-blue-600 font-medium">{text}</span> : <span className="text-xs text-gray-400 italic">Chờ phản hồi</span>
                                }
                            ]}
                            dataSource={complaints}
                            rowKey="_id"
                            loading={loadingComplaints}
                            pagination={{ pageSize: 4 }}
                            className="border border-gray-200 rounded-xl overflow-hidden text-xs"
                        />
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
                                                {prod._id && (
                                                    <div className="flex gap-2 mt-1">
                                                        {selectedOrder.status === 'completed' && (
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
                                                        {selectedOrder.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => openComplaintModal(selectedOrder._id, prod)}
                                                                className="text-[10px] bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold px-2.5 py-0.5 rounded-full transition cursor-pointer border border-red-200"
                                                            >
                                                                Khiếu nại
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* Product Complaint Modal */}
            <Modal
                title={<span className="font-extrabold uppercase text-red-600 tracking-wider">Gửi Khiếu Nại Sản Phẩm</span>}
                open={complaintVisible}
                onCancel={() => setComplaintVisible(false)}
                footer={null}
                width={500}
                destroyOnClose
            >
                {complaintProduct && (
                    <div className="space-y-5 mt-4">
                        <div className="flex gap-3 bg-red-50/55 p-3 rounded-xl border border-red-100 items-start">
                            <img
                                src={complaintProduct.imagesProduct?.[0] || 'https://via.placeholder.com/60'}
                                alt={complaintProduct.nameProduct}
                                className="w-14 h-18 object-contain bg-white border p-1 rounded"
                            />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{complaintProduct.nameProduct}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Mã đơn hàng: <span className="font-mono">{complaintOrderId}</span></p>
                            </div>
                        </div>

                        {/* Reason Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Lý do khiếu nại:</label>
                            <Select
                                value={complaintReason}
                                onChange={(value) => setComplaintReason(value)}
                                style={{ width: '100%' }}
                                className="light-select font-medium"
                            >
                                <Option value="Sai kích cỡ">📏 Sai kích cỡ / màu sắc</Option>
                                <Option value="Sản phẩm lỗi">⚠️ Sản phẩm trầy xước / rách / lỗi keo</Option>
                                <Option value="Giao thiếu hàng">📦 Giao thiếu phụ kiện / thiếu giày</Option>
                                <Option value="Sai mô tả">❌ Sản phẩm khác biệt nhiều so với ảnh</Option>
                                <Option value="Khác">💡 Lý do khác</Option>
                            </Select>
                        </div>

                        {/* Text area details */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Chi tiết khiếu nại:</label>
                            <Input.TextArea
                                rows={4}
                                placeholder="Vui lòng mô tả cụ thể lỗi sản phẩm hoặc vấn đề để SneakerHub giải quyết nhanh nhất cho bạn..."
                                value={complaintContent}
                                onChange={(e) => setComplaintContent(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        {/* Upload Evidence Images */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Bằng chứng hình ảnh (Bắt buộc để xử lý nhanh):</label>
                            <Upload
                                listType="picture-card"
                                fileList={complaintFileList}
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
                                onChange={({ fileList: newFileList }) => setComplaintFileList(newFileList)}
                                beforeUpload={() => false}
                            >
                                {complaintFileList.length < 5 && (
                                    <div className="text-gray-400">
                                        <p className="text-lg">+</p>
                                        <p className="text-[10px]">Tải ảnh</p>
                                    </div>
                                )}
                            </Upload>
                        </div>

                        {/* Form controls */}
                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                            <Button onClick={() => setComplaintVisible(false)} size="large">
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleComplaintSubmit}
                                loading={submittingComplaint}
                                size="large"
                                className="bg-red-600 hover:bg-red-700 text-white border-none rounded-xl font-semibold"
                            >
                                Gửi khiếu nại
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default OrderHistory;
