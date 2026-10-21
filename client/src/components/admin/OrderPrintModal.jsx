import React, { useState } from 'react';
import { Modal, Button, Checkbox, Radio, message } from 'antd';
import { PrinterOutlined, LeftOutlined, RightOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';

// Utility to generate a clean visual SVG Barcode
const BarcodeSVG = ({ code, height = 45 }) => {
    const chars = (code || 'SHB-ORDER').split('');
    const bars = [];
    chars.forEach((ch) => {
        const val = ch.charCodeAt(0) % 5;
        bars.push(val === 0 ? 1 : val);
        bars.push(1); // gap
        bars.push(val % 2 === 0 ? 2 : 1);
        bars.push(1); // gap
    });

    let currentX = 5;
    const barElements = [];
    bars.forEach((width, bIdx) => {
        if (bIdx % 2 === 0) {
            barElements.push(
                <rect key={bIdx} x={currentX} y="0" width={width * 1.5} height={height} fill="#000" />
            );
        }
        currentX += width * 1.5;
    });

    return (
        <div className="flex flex-col items-center">
            <svg width={Math.max(currentX + 10, 180)} height={height} className="overflow-visible">
                {barElements}
            </svg>
            <span className="font-mono text-xs font-bold tracking-widest text-black mt-0.5">{code}</span>
        </div>
    );
};

// Utility to generate a clean visual SVG QR Code representation
const QRCodeSVG = ({ value, size = 56 }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="border border-black p-0.5 bg-white">
            <rect x="5" y="5" width="30" height="30" fill="none" stroke="#000" strokeWidth="6" />
            <rect x="13" y="13" width="14" height="14" fill="#000" />
            <rect x="65" y="5" width="30" height="30" fill="none" stroke="#000" strokeWidth="6" />
            <rect x="73" y="13" width="14" height="14" fill="#000" />
            <rect x="5" y="65" width="30" height="30" fill="none" stroke="#000" strokeWidth="6" />
            <rect x="13" y="73" width="14" height="14" fill="#000" />
            <rect x="42" y="10" width="8" height="15" fill="#000" />
            <rect x="45" y="32" width="12" height="12" fill="#000" />
            <rect x="15" y="45" width="10" height="10" fill="#000" />
            <rect x="70" y="45" width="18" height="8" fill="#000" />
            <rect x="42" y="65" width="8" height="20" fill="#000" />
            <rect x="65" y="65" width="14" height="14" fill="#000" />
            <rect x="80" y="80" width="15" height="15" fill="#000" />
        </svg>
    );
};

export default function OrderPrintModal({ open, onClose, orders = [], onPrintSuccess }) {
    const [previewIndex, setPreviewIndex] = useState(0);
    const [printOuterLabel, setPrintOuterLabel] = useState(true);
    const [outerLabelSize, setOuterLabelSize] = useState('B6');
    const [printInnerSlip, setPrintInnerSlip] = useState(true);
    const [innerSlipSize, setInnerSlipSize] = useState('B6');

    if (!orders || orders.length === 0) return null;

    const printableOrders = orders.filter(o => o.status !== 'completed');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const isAllCompleted = orders.length > 0 && printableOrders.length === 0;

    const safeIndex = Math.min(previewIndex, orders.length - 1);
    const currentPreviewOrder = orders[safeIndex] || orders[0];
    const currentIsCompleted = currentPreviewOrder?.status === 'completed';

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0);
    };

    const handlePrint = () => {
        if (printableOrders.length === 0) {
            message.warning('Những đơn hàng đã giao thành công chỉ được xem phiếu, không được in nữa!');
            return;
        }

        const printedIds = printableOrders.map(o => o._id);
        if (onPrintSuccess) {
            onPrintSuccess(printedIds);
        }

        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Render single shipping label for an order
    const renderOrderLabelContent = (order, isScreenPreview = false) => {
        const trackingCode = `SHB${(order._id || '').slice(-8).toUpperCase()}VN`;
        const orderCode = order._id ? `#${order._id.slice(-8).toUpperCase()}` : '#ORDER';
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const method = (order.paymentMethod || 'cod').toLowerCase();
        const isPaid = method !== 'cod' || order.status === 'completed';
        const isCompleted = order.status === 'completed';
        const totalAmount = order.finalPrice || order.totalPrice || 0;
        const codAmount = isPaid ? 0 : totalAmount;

        return (
            <div className="bg-white border-2 border-dashed border-gray-400 p-4 text-black font-sans text-xs shadow-md w-full max-w-[420px] mx-auto select-none">
                {/* Notice for completed orders */}
                {isCompleted && (
                    <div className="bg-emerald-50 border border-emerald-400 text-emerald-800 p-1.5 text-center font-bold text-[10px] uppercase rounded mb-2 flex items-center justify-center gap-1">
                        <CheckCircleOutlined />
                        <span>ĐƠN ĐÃ GIAO THÀNH CÔNG (CHẾ ĐỘ XEM PHIẾU - KHÔNG IN LẠI)</span>
                    </div>
                )}

                {/* 1. Header: Brand, Hub, Hotline */}
                <div className="border-b-2 border-black pb-2 mb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="font-black text-sm tracking-tight text-black uppercase">
                                SNEAKERHUB.VN
                            </h2>
                            <p className="text-[10px] text-gray-700 leading-tight">
                                Đối tác lấy hàng: <strong className="text-black">SNEAKERHUB EXPRESS / GHN</strong>
                            </p>
                            <p className="text-[10px] text-gray-700">Hotline: 0899227066 | sneakerhub.vn</p>
                        </div>
                        <div className="text-right">
                            <span className="border border-black px-2 py-0.5 font-black text-xs inline-block bg-gray-50">
                                HUB: KV-HCM
                            </span>
                            <p className="text-[9px] text-gray-600 mt-1">
                                {orderDate.toLocaleTimeString('vi-VN')} {orderDate.toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Tracking Barcode Area */}
                <div className="border border-black p-2 my-2 flex flex-col items-center justify-center bg-gray-50/50">
                    <BarcodeSVG code={trackingCode} height={42} />
                    <div className="text-[10px] text-gray-600 mt-0.5">Mã đơn hàng: <strong className="text-black">{orderCode}</strong></div>
                </div>

                {/* 3. Receiver Information */}
                <div className="border-b border-black pb-2 mb-2 space-y-1">
                    <p className="font-black text-xs uppercase tracking-wide">
                        NGƯỜI NHẬN: {order.fullName || order.userId?.fullName || 'KHÁCH HÀNG'}
                    </p>
                    <p className="font-bold text-xs">
                        SĐT: {order.phoneNumber ? `${order.phoneNumber.slice(0, 3)}****${order.phoneNumber.slice(-3)}` : '09********'}
                    </p>
                    <p className="text-[11px] leading-snug">
                        <span className="font-bold">Đ/C:</span> {order.address || 'Tại cửa hàng SneakerHub'}
                    </p>
                    <p className="text-[10px] text-gray-800 italic pt-1 border-t border-dashed border-gray-300">
                        <strong>Ghi chú:</strong> Cho xem hàng, không cho thử / Giao giờ hành chính
                    </p>
                </div>

                {/* 4. Middle Row: Date, QR Code, Weight */}
                <div className="grid grid-cols-3 gap-2 border-b border-black pb-2 mb-2 items-center">
                    <div className="col-span-1 text-center bg-black text-white p-1 rounded">
                        <span className="block text-[10px] uppercase font-bold text-white/80">Ngày gửi</span>
                        <span className="block text-xs font-black text-white">
                            {orderDate.getDate()} thg {orderDate.getMonth() + 1}
                        </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <QRCodeSVG value={`https://sneakerhub.vn/order/${order._id}`} size={56} />
                    </div>
                    <div className="col-span-1 text-right text-[10px] leading-tight space-y-0.5">
                        <p><strong>KL:</strong> 0.85 Kg</p>
                        <p><strong>DV:</strong> Hỏa tốc</p>
                        <p><strong>Ca giao:</strong> 1-2 ngày</p>
                    </div>
                </div>

                {/* 5. BIG COD CASH ON DELIVERY BOX (Khách hàng phải trả) */}
                <div className="border-2 border-black p-2.5 my-2 text-center bg-gray-50">
                    <div className="flex items-center justify-between border-b border-black/20 pb-1 mb-1 text-[10px]">
                        <span className="font-semibold text-gray-700">
                            PT THANH TOÁN: <strong className="text-black uppercase">{method === 'cod' ? 'TIỀN MẶT (COD)' : method.toUpperCase()}</strong>
                        </span>
                        <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHƯA THANH TOÁN'}
                        </span>
                    </div>

                    <p className="font-extrabold text-[11px] uppercase tracking-wider text-black">
                        KHÁCH HÀNG PHẢI TRẢ (TIỀN THU COD):
                    </p>

                    <div className="mt-1">
                        {isPaid ? (
                            <div>
                                <p className="text-2xl font-black text-black tracking-tight leading-none">0 đ</p>
                                <p className="text-[10px] font-extrabold text-emerald-800 uppercase mt-1 tracking-wide">
                                    ✓ ĐÃ THANH TOÁN ONLINE - KHÔNG THU TIỀN
                                </p>
                                <p className="text-[9px] text-gray-600 mt-0.5">
                                    (Tổng giá trị đơn: {formatPrice(totalAmount)})
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-2xl font-black text-black tracking-tight leading-none">
                                    {formatPrice(codAmount)}
                                </p>
                                <p className="text-[10px] font-extrabold text-red-600 uppercase mt-1 tracking-wide">
                                    ⚠️ THU TIỀN TẬN NƠI KHI GIAO HÀNG (TIỀN MẶT)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Product Item List in Box */}
                <div className="mt-2 pt-2 border-t border-dashed border-gray-400">
                    <p className="font-bold text-[10px] uppercase text-gray-700 mb-1">Danh sách sản phẩm trong kiện:</p>
                    <div className="space-y-1">
                        {(order.products || []).slice(0, 4).map((item, idx) => {
                            const p = item.productId || {};
                            return (
                                <div key={idx} className="flex justify-between items-center text-[10px] border-b border-gray-100 pb-0.5">
                                    <span className="truncate max-w-[260px] font-medium text-black">
                                        {idx + 1}. {p.nameProduct || 'Giày SneakerHub'} {item.size ? `(Size ${item.size})` : ''}
                                    </span>
                                    <span className="font-bold text-black shrink-0 ml-1">
                                        SL: {item.quantity}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-3 pt-2 border-t border-black">
                        <span>Chữ ký người nhận: ......................</span>
                        <span>Chữ ký người giao: ......................</span>
                    </div>
                </div>

                {/* 7. Inner Packing Slip (If checked) */}
                {printInnerSlip && (
                    <div className="mt-4 pt-3 border-t-2 border-black">
                        <div className="text-center pb-1">
                            <h3 className="font-black text-xs uppercase tracking-wider text-black">
                                PHIẾU ĐÓNG GÓI & DANH SÁCH SẢN PHẨM
                            </h3>
                            <p className="text-[9px] text-gray-600">Đính kèm bên trong kiện hàng đơn {orderCode}</p>
                        </div>
                        <table className="w-full text-[10px] border border-black text-left mt-1">
                            <thead>
                                <tr className="bg-gray-100 border-b border-black">
                                    <th className="p-1">Sản phẩm</th>
                                    <th className="p-1 text-center">SL</th>
                                    <th className="p-1 text-right">Đơn giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order.products || []).map((item, i) => {
                                    const p = item.productId || {};
                                    return (
                                        <tr key={i} className="border-b border-gray-300">
                                            <td className="p-1 font-medium">{p.nameProduct || 'Giày thể thao'}</td>
                                            <td className="p-1 text-center font-bold">{item.quantity}</td>
                                            <td className="p-1 text-right">{formatPrice(p.priceProduct)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="text-right text-[10px] space-y-0.5 mt-2 font-medium">
                            <p>Tạm tính: <strong>{formatPrice(order.totalPrice)}</strong></p>
                            <p>Phí vận chuyển: <strong>0 đ</strong></p>
                            <p className="text-xs font-black text-black pt-1 border-t border-black">
                                KHÁCH HÀNG PHẢI TRẢ: <span className={isPaid ? "text-emerald-700 font-extrabold" : "text-black font-extrabold"}>
                                    {isPaid ? "0 đ (ĐÃ THANH TOÁN TRƯỚC)" : formatPrice(codAmount)}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            title={
                <div className="flex items-center justify-between pr-6">
                    <span className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2">
                        {isAllCompleted ? (
                            <>
                                <EyeOutlined className="text-blue-600" />
                                <span>Xem phiếu vận chuyển SNEAKERHUB.VN (Đơn đã hoàn tất)</span>
                            </>
                        ) : (
                            <>
                                <PrinterOutlined className="text-blue-600" />
                                <span>In nhãn vận chuyển SNEAKERHUB.VN</span>
                            </>
                        )}
                    </span>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={980}
            footer={
                <div className="flex justify-end gap-3 pt-2">
                    <Button onClick={onClose} className="rounded-xl px-5 font-semibold text-gray-600">
                        {isAllCompleted ? 'Đóng lại' : 'Huỷ bỏ'}
                    </Button>
                    {!isAllCompleted ? (
                        <Button
                            type="primary"
                            onClick={handlePrint}
                            icon={<PrinterOutlined />}
                            className="bg-[#007aff] hover:bg-[#0062cc] rounded-xl px-6 font-bold shadow-md text-white border-none"
                        >
                            In ({printableOrders.length} đơn)
                        </Button>
                    ) : (
                        <Button
                            disabled
                            className="rounded-xl px-5 font-semibold text-gray-400 bg-gray-150 cursor-not-allowed"
                        >
                            Đã giao thành công (Chỉ xem phiếu)
                        </Button>
                    )}
                </div>
            }
            destroyOnClose
            centered
        >
            <div className="flex flex-col lg:flex-row gap-6 my-2 max-h-[75vh] overflow-y-auto pr-1">
                {/* LEFT: Live Printable Area */}
                <div className="lg:w-[62%] bg-gray-100 p-4 rounded-2xl flex flex-col items-center justify-start border border-gray-200">
                    <div className="w-full flex justify-between items-center mb-2 px-1 text-xs text-gray-500">
                        <span className="font-semibold">
                            {currentIsCompleted ? 'Xem lại phiếu đơn hàng đã hoàn tất' : 'Xem trước mẫu in phiếu (SneakerHub Express)'}
                        </span>
                        <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Khổ in: {outerLabelSize} (100x150 mm)
                        </span>
                    </div>

                    {/* Pagination navigator if multiple orders */}
                    {orders.length > 1 && (
                        <div className="w-full flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-gray-200 mb-2 text-xs">
                            <Button
                                size="small"
                                icon={<LeftOutlined />}
                                disabled={safeIndex === 0}
                                onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                            >
                                Trước
                            </Button>
                            <span className="font-semibold text-gray-700">
                                Đơn {safeIndex + 1} / {orders.length}: <strong className="text-blue-600 font-mono">#{currentPreviewOrder._id.slice(-8).toUpperCase()}</strong>
                                {currentPreviewOrder.status === 'completed' && (
                                    <span className="ml-1 text-[11px] text-emerald-600 font-bold">(Đã giao)</span>
                                )}
                            </span>
                            <Button
                                size="small"
                                icon={<RightOutlined />}
                                disabled={safeIndex === orders.length - 1}
                                onClick={() => setPreviewIndex(p => Math.min(orders.length - 1, p + 1))}
                            >
                                Tiếp
                            </Button>
                        </div>
                    )}

                    {/* PRINT CONTAINER */}
                    <div id="sneakerhub-printable-area" className="w-full">
                        {/* SCREEN PREVIEW ONLY */}
                        <div className="print:hidden w-full flex justify-center">
                            {renderOrderLabelContent(currentPreviewOrder, true)}
                        </div>

                        {/* PRINT ONLY (Outputs ONLY printable orders sequentially with page breaks; ignores completed ones) */}
                        <div className="hidden print:block w-full">
                            {printableOrders.map((order) => (
                                <div key={order._id} className="sneakerhub-print-sheet">
                                    {renderOrderLabelContent(order, false)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Print Options Controller matching Image 3 mockup */}
                <div className="lg:w-[38%] space-y-5 pt-2">
                    {/* Notice if viewing completed orders */}
                    {isAllCompleted ? (
                        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-xs space-y-1.5 text-amber-900 shadow-2xs">
                            <p className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
                                <span>🔒</span>
                                <span>Chế độ chỉ xem phiếu</span>
                            </p>
                            <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                                Đơn hàng này đã <strong>giao hàng thành công</strong>. Để đảm bảo an toàn nghiệp vụ vận chuyển, hệ thống đã khóa chức năng in ấn và chỉ hiển thị để kiểm tra thông tin đối soát.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-sm text-gray-900 mb-1">
                                Số đơn sẵn sàng in: <strong className="text-blue-600 text-base">{printableOrders.length}</strong> / {orders.length}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {completedOrders.length > 0 
                                    ? `(Tự động loại bỏ ${completedOrders.length} đơn đã giao thành công)`
                                    : 'Chọn thông tin và kích thước bạn muốn in'}
                            </p>
                        </div>
                    )}

                    {/* Option 1: Outer Shipping Label */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                        <Checkbox
                            checked={printOuterLabel}
                            onChange={(e) => setPrintOuterLabel(e.target.checked)}
                            className="font-bold text-sm text-gray-800"
                        >
                            Nhãn vận chuyển
                        </Checkbox>
                        <p className="text-xs text-gray-500 pl-6 -mt-1">
                            (Để dán bên ngoài kiện hàng - có mã vạch và thông tin COD)
                        </p>

                        {printOuterLabel && (
                            <div className="pl-6 pt-1 space-y-1">
                                <label className="text-xs font-semibold text-gray-700 block">Kích thước in:</label>
                                <Radio.Group
                                    value={outerLabelSize}
                                    onChange={(e) => setOuterLabelSize(e.target.value)}
                                    className="flex gap-4 text-xs"
                                >
                                    <Radio value="B6">
                                        <span className="font-semibold text-xs">B6 (100x150 mm)</span>
                                    </Radio>
                                    <Radio value="A4">
                                        <span className="font-semibold text-xs">A4 (Laser)</span>
                                    </Radio>
                                </Radio.Group>
                            </div>
                        )}
                    </div>

                    {/* Option 2: Inner Packing Slip */}
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                        <Checkbox
                            checked={printInnerSlip}
                            onChange={(e) => setPrintInnerSlip(e.target.checked)}
                            className="font-bold text-sm text-gray-800"
                        >
                            Phiếu danh sách sản phẩm
                        </Checkbox>
                        <p className="text-xs text-gray-500 pl-6 -mt-1">
                            (Để đặt bên trong kiện hàng - kèm bảng kê chi tiết và chính sách bảo hành)
                        </p>

                        {printInnerSlip && (
                            <div className="pl-6 pt-1 space-y-1">
                                <label className="text-xs font-semibold text-gray-700 block">Kích thước in:</label>
                                <Radio.Group
                                    value={innerSlipSize}
                                    onChange={(e) => setInnerSlipSize(e.target.value)}
                                    className="flex gap-4 text-xs"
                                >
                                    <Radio value="B6">
                                        <span className="font-semibold text-xs">B6</span>
                                    </Radio>
                                    <Radio value="A4">
                                        <span className="font-semibold text-xs">A4</span>
                                    </Radio>
                                </Radio.Group>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                            <CheckCircleOutlined className="text-blue-600" /> Hỗ trợ mọi loại máy in:
                        </p>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            Khổ <strong>B6</strong> tối ưu tuyệt đối cho máy in nhiệt dán decal (HPRT, Xprinter). Khổ <strong>A4</strong> dành cho máy in văn phòng thông thường.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
