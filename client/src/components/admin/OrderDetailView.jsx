import React, { useState } from 'react';
import { Button, Tag, Select, Table, Divider, Input, message } from 'antd';
import { 
    ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined, 
    ClockCircleOutlined, ShoppingOutlined, UserOutlined, 
    EnvironmentOutlined, PhoneOutlined, CreditCardOutlined, CarOutlined, EyeOutlined,
    EditOutlined, SaveOutlined
} from '@ant-design/icons';
import codLogo from '../../assets/images/payment-cod.png';
import momoLogo from '../../assets/images/payment-momo.png';
import vnpayLogo from '../../assets/images/payment-vnpay.png';

const { Option } = Select;
const { TextArea } = Input;

export default function OrderDetailView({ 
    order, 
    onBack, 
    onPrint, 
    onUpdateStatus, 
    onUpdateNote,
    isPrinted = false 
}) {
    if (!order) return null;

    const [internalNote, setInternalNote] = useState(order.internalNote || '');
    const [savingNote, setSavingNote] = useState(false);

    const handleSaveInternalNote = async () => {
        if (!onUpdateNote) return;
        setSavingNote(true);
        try {
            await onUpdateNote(order._id, internalNote);
            message.success('Đã lưu ghi chú nội bộ cho đơn hàng!');
        } catch {
            message.error('Không thể lưu ghi chú đơn hàng');
        } finally {
            setSavingNote(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return `${d.toLocaleDateString('vi-VN')} - ${d.toLocaleTimeString('vi-VN')}`;
    };

    const isCOD = (order.paymentMethod || 'cod').toLowerCase() === 'cod';
    const isPaidOnline = !isCOD || order.status === 'completed';
    const finalTotal = order.finalPrice || order.totalPrice || 0;
    const discountAmount = (order.totalPrice && order.finalPrice && order.totalPrice > order.finalPrice)
        ? (order.totalPrice - order.finalPrice)
        : 0;

    const statusMap = {
        pending: { text: 'Chờ xác nhận', color: 'orange', bannerText: 'SneakerHub đang chờ xác nhận đơn hàng' },
        confirmed: { text: 'Đang chuẩn bị', color: 'blue', bannerText: 'SneakerHub đã tiếp nhận đơn hàng' },
        delivered: { text: 'Đang vận chuyển', color: 'cyan', bannerText: 'Đơn hàng đang trên đường giao tới bạn' },
        completed: { text: 'Đã hoàn thành', color: 'green', bannerText: 'Đơn hàng đã được giao thành công' },
        cancelled: { text: 'Đã hủy', color: 'red', bannerText: 'Đơn hàng đã bị hủy' }
    };

    const currentStatus = statusMap[order.status] || statusMap.pending;

    // Calculate packing status
    const isPacked = order.status === 'delivered' || order.status === 'completed';

    // Products table columns matching Image 2
    const productColumns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 320,
            render: (_, record) => {
                const prod = record.productId || {};
                return (
                    <div className="flex items-start gap-3 py-1">
                        {prod.imagesProduct?.[0] ? (
                            <img
                                src={prod.imagesProduct[0]}
                                alt={prod.nameProduct}
                                className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                                👟
                            </div>
                        )}
                        <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2" title={prod.nameProduct}>
                                {prod.nameProduct || 'Sản phẩm SneakerHub'}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-black text-white shadow-xs">
                                    Size: {record.size || '39 (Mặc định)'}
                                </span>
                                {(prod.metadata?.colorway || prod.metadata?.author) && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-medium border border-gray-200">
                                        Màu: {prod.metadata?.colorway || prod.metadata?.author}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">
                                SKU: <span className="font-mono font-medium text-gray-700">{prod.metadata?.sku || prod.metadata?.author || prod._id?.slice(-6).toUpperCase() || 'SHB-SKU'}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Giá niêm yết: <span className="font-semibold text-gray-800">{formatPrice(prod.priceProduct)}</span>
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 140,
            render: () => (
                <Tag color={currentStatus.color} className="font-semibold text-xs px-2.5 py-0.5 rounded-full">
                    {currentStatus.text}
                </Tag>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 80,
            align: 'center',
            render: (qty) => <strong className="text-gray-900 text-sm">{qty}</strong>
        },
        {
            title: 'Giá trị đơn hàng',
            key: 'orderValue',
            width: 130,
            align: 'right',
            render: (_, record) => {
                const prod = record.productId || {};
                const lineTotal = (prod.priceProduct || 0) * (record.quantity || 1);
                return <span className="font-semibold text-gray-900 text-xs">{formatPrice(lineTotal)}</span>;
            }
        },
        {
            title: 'SneakerHub giảm giá',
            key: 'platformDiscount',
            width: 140,
            align: 'right',
            render: () => (
                <span className="text-xs text-gray-500 font-medium">
                    {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '0 đ'}
                </span>
            )
        },
        {
            title: 'Nhà bán giảm giá',
            key: 'sellerDiscount',
            width: 130,
            align: 'right',
            render: () => <span className="text-xs text-gray-500 font-medium">0 đ</span>
        },
        {
            title: 'Phí sàn SneakerHub',
            key: 'fee',
            width: 130,
            align: 'right',
            render: () => <span className="text-xs text-gray-500 font-medium">0 đ</span>
        },
        {
            title: 'Doanh thu',
            key: 'revenue',
            width: 140,
            align: 'right',
            render: (_, record) => {
                const prod = record.productId || {};
                const lineTotal = (prod.priceProduct || 0) * (record.quantity || 1);
                return (
                    <span className="font-black text-emerald-600 text-sm">
                        {formatPrice(lineTotal - (discountAmount > 0 ? discountAmount : 0))}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 font-sans animate-fade-in pb-12">
            {/* Top Navigation Breadcrumb */}
            <div className="flex items-center justify-between">
                <Button
                    onClick={onBack}
                    icon={<ArrowLeftOutlined />}
                    className="font-bold text-gray-700 hover:text-black rounded-xl border-gray-300 hover:border-black flex items-center shadow-sm"
                >
                    Quay lại danh sách đơn hàng
                </Button>
                <div className="flex items-center gap-2">
                    {order.status === 'completed' ? (
                        <Button
                            type="default"
                            icon={<EyeOutlined />}
                            onClick={() => onPrint(order)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 font-bold rounded-xl shadow-sm flex items-center gap-1"
                        >
                            Xem phiếu vận chuyển (SneakerHub.vn)
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={() => onPrint(order)}
                            className="bg-[#007aff] hover:bg-[#0062cc] text-white border-none font-bold rounded-xl shadow-sm flex items-center gap-1"
                        >
                            In nhãn vận chuyển (SneakerHub.vn)
                        </Button>
                    )}
                </div>
            </div>

            {/* 1. TOP ORDER BANNER (Matching Image 2 Mockup) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* Blue Order Icon */}
                        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0 border border-blue-200 shadow-sm">
                            <ShoppingOutlined />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                    Đơn hàng #{order._id.slice(-8).toUpperCase()}
                                </h2>
                                <span className="font-mono text-xs text-gray-400">({order._id})</span>
                                <span className="bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                                    {currentStatus.bannerText}
                                </span>
                                <span className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs px-2.5 py-0.5 rounded-full">
                                    Hạn xử lý: 24h kể từ khi đặt
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1.5">
                                <span>Ngày đặt hàng: <strong className="text-gray-900">{formatDate(order.createdAt)}</strong></span>
                                <span className="text-gray-300">|</span>
                                <span className={isPaidOnline ? 'text-emerald-700 font-bold' : 'text-orange-700 font-bold'}>
                                    {isPaidOnline ? '✓ Đã thanh toán (Khách phải trả: 0 đ)' : '✕ Chưa thanh toán (COD)'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className={isPrinted ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                                    {isPrinted ? '✓ Đã in nhãn VC' : '✕ Chưa in nhãn VC'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="font-medium text-gray-800">
                                    Giao hàng: <strong className="text-blue-700">SneakerHub Express</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status updater quick dropdown */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Cập nhật trạng thái:</span>
                        <Select
                            value={order.status}
                            onChange={(newStatus) => onUpdateStatus(order._id, newStatus)}
                            style={{ width: 160 }}
                            className="font-bold text-xs rounded-xl"
                        >
                            <Option value="pending">Chờ xác nhận</Option>
                            <Option value="confirmed">Đang chuẩn bị</Option>
                            <Option value="delivered">Đang vận chuyển</Option>
                            <Option value="completed">Đã hoàn thành</Option>
                            <Option value="cancelled">Đã hủy</Option>
                        </Select>
                    </div>
                </div>
            </div>

            {/* 2. PRODUCT LIST TABLE (Matching Image 2 Mockup) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-sm uppercase text-gray-800 tracking-wide">Danh sách sản phẩm</span>
                        <span className="text-xs text-gray-400">({order.products?.length || 0} mẫu giày)</span>
                    </div>
                    <div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            isPacked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                            {isPacked ? '📦 Đã đóng gói & xuất kho' : '📦 Chưa đóng gói'}
                        </span>
                    </div>
                </div>

                <Table
                    columns={productColumns}
                    dataSource={order.products || []}
                    rowKey={(item, idx) => item.productId?._id || idx}
                    pagination={false}
                    scroll={{ x: 950 }}
                    className="border border-gray-150 rounded-xl overflow-hidden"
                    summary={() => {
                        const totalQty = (order.products || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                        return (
                            <Table.Summary.Row className="bg-blue-50/40 font-bold text-xs">
                                <Table.Summary.Cell index={0}>
                                    <span className="font-extrabold text-gray-900 text-sm">Tổng cộng</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="center">
                                    <strong className="text-sm text-gray-900">{totalQty}</strong>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="right">
                                    <span className="text-gray-900">{formatPrice(order.totalPrice)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4} align="right">
                                    <span className="text-emerald-700">-{formatPrice(discountAmount)}</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5} align="right">0 đ</Table.Summary.Cell>
                                <Table.Summary.Cell index={6} align="right">0 đ</Table.Summary.Cell>
                                <Table.Summary.Cell index={7} align="right">
                                    <span className="text-base font-black text-emerald-700">{formatPrice(finalTotal)}</span>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        );
                    }}
                />
            </div>

            {/* 3. BOTTOM 2 COLUMNS: Order History Timeline & Customer Payment Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Lịch sử đơn hàng (Timeline matching Image 2) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide flex items-center gap-2">
                        <ClockCircleOutlined className="text-blue-600" />
                        <span>Lịch sử đơn hàng</span>
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                        {/* Step 1: Chờ xác nhận */}
                        <div className="relative">
                            <span className="absolute -left-6 top-0.5 w-3 h-3 bg-blue-600 rounded-full ring-4 ring-blue-100"></span>
                            <div>
                                <h4 className="font-bold text-xs text-gray-900">1. Chờ xác nhận (Khách đặt hàng)</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
                                <p className="text-xs text-gray-700 mt-1">Đơn hàng được tạo thành công trên hệ thống SneakerHub.vn</p>
                            </div>
                        </div>

                        {/* Step 2: Đã tiếp nhận & chuẩn bị hàng */}
                        <div className="relative">
                            <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full ring-4 ${
                                order.status !== 'pending' ? 'bg-blue-600 ring-blue-100' : 'bg-gray-300 ring-gray-100'
                            }`}></span>
                            <div>
                                <h4 className="font-bold text-xs text-gray-900">2. Đã tiếp nhận & Đang chuẩn bị hàng</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {order.status !== 'pending' ? 'Đã kiểm tra kho & sẵn sàng đóng gói' : 'Đang chờ Admin duyệt'}
                                </p>
                            </div>
                        </div>

                        {/* Step 3: Đang vận chuyển */}
                        <div className="relative">
                            <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full ring-4 ${
                                (order.status === 'delivered' || order.status === 'completed') ? 'bg-blue-600 ring-blue-100' : 'bg-gray-300 ring-gray-100'
                            }`}></span>
                            <div>
                                <h4 className="font-bold text-xs text-gray-900">3. Đang vận chuyển (Giao hàng)</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {(order.status === 'delivered' || order.status === 'completed') 
                                        ? 'Bàn giao cho đơn vị vận chuyển SneakerHub Express / GHN' 
                                        : 'Chờ giao cho shipper'}
                                </p>
                            </div>
                        </div>

                        {/* Step 4: Giao hàng thành công */}
                        <div className="relative">
                            <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full ring-4 ${
                                order.status === 'completed' ? 'bg-emerald-600 ring-emerald-100' : 'bg-gray-300 ring-gray-100'
                            }`}></span>
                            <div>
                                <h4 className="font-bold text-xs text-gray-900">4. Giao hàng thành công (Hoàn tất)</h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {order.status === 'completed' ? 'Khách đã nhận hàng và hoàn tất đơn' : 'Chưa hoàn tất'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Thông tin thanh toán & Khách hàng */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide flex items-center gap-2">
                        <CreditCardOutlined className="text-emerald-600" />
                        <span>Thông tin thanh toán & Người nhận</span>
                    </h3>

                    {/* Customer Receiver Box */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-900 font-bold">
                            <UserOutlined className="text-blue-600" />
                            <span>{order.fullName || order.userId?.fullName || 'Khách vãng lai'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <PhoneOutlined className="text-blue-600" />
                            <span>{order.phoneNumber || 'Chưa cung cấp'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-700">
                            <EnvironmentOutlined className="text-blue-600 shrink-0 mt-0.5" />
                            <span>{order.address || 'Tại cửa hàng SneakerHub'}</span>
                        </div>
                    </div>

                    {/* Payment Financial Breakdown */}
                    <div className="space-y-2 pt-2 text-xs text-gray-600">
                        <div className="flex justify-between items-center">
                            <span>Phương thức thanh toán:</span>
                            <span className="font-extrabold uppercase text-gray-900 inline-flex items-center gap-1.5">
                                {(order.paymentMethod || 'cod').toLowerCase() === 'vnpay' && (
                                    <img src={vnpayLogo} alt="VNPAY" className="w-4 h-4 object-contain" />
                                )}
                                {(order.paymentMethod || 'cod').toLowerCase() === 'momo' && (
                                    <img src={momoLogo} alt="MoMo" className="w-4 h-4 object-contain rounded-xs" />
                                )}
                                {(order.paymentMethod || 'cod').toLowerCase() === 'cod' && (
                                    <img src={codLogo} alt="COD" className="w-4 h-4 object-contain" />
                                )}
                                {order.paymentMethod === 'cod' ? 'Thu tiền tận nơi (COD)' : order.paymentMethod?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Tạm tính ({order.products?.length || 0} sản phẩm):</span>
                            <span className="font-semibold text-gray-800">{formatPrice(order.totalPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Phí vận chuyển:</span>
                            <span className="font-semibold text-emerald-600">Miễn phí (0 đ)</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                                <span>Giảm giá khuyến mãi / Voucher:</span>
                                <span className="font-bold">-{formatPrice(discountAmount)}</span>
                            </div>
                        )}
                        <Divider className="my-2" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-black text-gray-900">Khách hàng phải trả:</span>
                            {isPaidOnline ? (
                                <div className="text-right">
                                    <span className="font-black text-emerald-600 text-base">0 đ</span>
                                    <span className="block text-[11px] text-gray-500 font-medium">
                                        (Đã thanh toán trước: {formatPrice(finalTotal)})
                                    </span>
                                </div>
                            ) : (
                                <span className="font-black text-red-600 text-base">{formatPrice(finalTotal)}</span>
                            )}
                        </div>
                    </div>

                    {/* Staff Internal Note Section */}
                    <div className="pt-3 border-t border-gray-150 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <EditOutlined className="text-blue-600" />
                                <span>Ghi chú nội bộ nhân viên</span>
                            </label>
                            <Button
                                size="small"
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={savingNote}
                                onClick={handleSaveInternalNote}
                                className="bg-black hover:bg-zinc-800 text-white border-none text-xs rounded-lg flex items-center"
                            >
                                Lưu ghi chú
                            </Button>
                        </div>
                        <TextArea
                            rows={2}
                            value={internalNote}
                            onChange={(e) => setInternalNote(e.target.value)}
                            placeholder="Nhập ghi chú đơn hàng (ví dụ: Khách dặn giao sau 18h, kiểm tra kỹ keo đế trước khi đóng gói...)"
                            className="text-xs rounded-xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
