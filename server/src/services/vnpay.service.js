const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const crypto = require('crypto');

class VnPayService {
    constructor() {
        this.tmnCode = process.env.VNPAY_TMN_CODE || '64DFOLZV';
        this.secureSecret = process.env.VNPAY_SECURE_SECRET || 'O6J4Z89F24EL7WDPFXJEJBX47AGBLQVO';
        this.vnpayHost = process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn';
        this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-callback';

        this.vnpayInstance = new VNPay({
            tmnCode: this.tmnCode,
            secureSecret: this.secureSecret,
            vnpayHost: this.vnpayHost,
            testMode: true,
            hashAlgorithm: 'SHA512',
            loggerFn: ignoreLogger,
        });
    }

    /**
     * Lấy địa chỉ IP của Client (tương đương GetIpAddress trong tài liệu C#)
     */
    getClientIp(req) {
        if (!req) return '127.0.0.1';
        let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
        if (typeof ip === 'string') {
            if (ip.includes(',')) {
                ip = ip.split(',')[0].trim();
            }
            if (ip.startsWith('::ffff:')) {
                ip = ip.replace('::ffff:', '');
            }
            if (ip === '::1') {
                ip = '127.0.0.1';
            }
        }
        // Fallback to 127.0.0.1 if not valid IPv4
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipv4Regex.test(ip) ? ip : '127.0.0.1';
    }

    /**
     * Tạo URL thanh toán VNPay (tương đương CreatePaymentUrl)
     * @param {Object} params
     * @param {number} params.amount - Số tiền thanh toán (VND)
     * @param {string} params.txnRef - Mã tham chiếu giao dịch (độc nhất)
     * @param {string} params.orderInfo - Nội dung mô tả thanh toán
     * @param {string} [params.ipAddr] - IP của client
     * @param {string} [params.returnUrl] - URL callback sau khi thanh toán
     * @returns {string} paymentUrl
     */
    createPaymentUrl({ amount, txnRef, orderInfo, ipAddr = '127.0.0.1', returnUrl = null }) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // VNPay bắt buộc vnp_Amount là số nguyên (không có phần thập phân)
        const cleanAmount = Math.round(Number(amount));

        // VNPay chỉ cho phép chữ, số, dấu gạch dưới trong TxnRef (không khoảng trắng hay dấu +)
        const cleanTxnRef = String(txnRef).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

        // Đảm bảo IPv4 hợp lệ
        let cleanIp = ipAddr;
        if (cleanIp.startsWith('::ffff:')) cleanIp = cleanIp.replace('::ffff:', '');
        if (cleanIp === '::1' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(cleanIp)) cleanIp = '127.0.0.1';

        const paymentUrl = this.vnpayInstance.buildPaymentUrl({
            vnp_Amount: cleanAmount,
            vnp_IpAddr: cleanIp,
            vnp_TxnRef: cleanTxnRef,
            vnp_OrderInfo: String(orderInfo).replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl || this.returnUrl,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });

        return paymentUrl;
    }

    /**
     * Xác thực chữ ký số và dữ liệu phản hồi từ VNPay (tương đương PaymentExecute / ValidateSignature)
     * @param {Object} query - req.query từ callback VNPay
     * @returns {Object} Kết quả xác thực chuẩn PaymentResponseModel
     */
    verifyReturnUrl(query) {
        try {
            // Sử dụng verifyReturnUrl của SDK VNPay
            const verification = this.vnpayInstance.verifyReturnUrl(query);

            return {
                isVerified: verification.isVerified,
                isSuccess: verification.isSuccess,
                vnpResponseCode: query.vnp_ResponseCode,
                vnpTxnRef: query.vnp_TxnRef,
                vnpTransactionNo: query.vnp_TransactionNo,
                vnpOrderInfo: query.vnp_OrderInfo,
                vnpAmount: Number(query.vnp_Amount) / 100,
                vnpBankCode: query.vnp_BankCode,
                vnpPayDate: query.vnp_PayDate,
                message: verification.message || (verification.isSuccess ? 'Thanh toán thành công' : 'Thanh toán không thành công')
            };
        } catch (error) {
            console.error('Lỗi khi verifyReturnUrl VNPay:', error.message);

            // Dự phòng: Xác thực chữ ký số thủ công bằng thuật toán HMAC-SHA512
            const isManualValid = this.validateSignatureManual(query);
            return {
                isVerified: isManualValid,
                isSuccess: isManualValid && query.vnp_ResponseCode === '00',
                vnpResponseCode: query.vnp_ResponseCode,
                vnpTxnRef: query.vnp_TxnRef,
                vnpTransactionNo: query.vnp_TransactionNo,
                vnpOrderInfo: query.vnp_OrderInfo,
                vnpAmount: Number(query.vnp_Amount || 0) / 100,
                vnpBankCode: query.vnp_BankCode,
                vnpPayDate: query.vnp_PayDate,
                message: isManualValid && query.vnp_ResponseCode === '00' ? 'Thanh toán thành công' : 'Chữ ký không hợp lệ hoặc giao dịch thất bại'
            };
        }
    }

    /**
     * Xác thực HMAC-SHA512 thủ công theo chuẩn tài liệu VNPay
     */
    validateSignatureManual(query) {
        const secureHash = query.vnp_SecureHash;
        if (!secureHash) return false;

        const filteredParams = {};
        for (const [key, value] of Object.entries(query)) {
            if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value !== '' && value !== undefined && value !== null) {
                filteredParams[key] = value;
            }
        }

        // Sắp xếp các tham số theo thứ tự alphabet
        const sortedKeys = Object.keys(filteredParams).sort();
        const signData = sortedKeys
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filteredParams[k])}`)
            .join('&');

        const calculatedHash = crypto
            .createHmac('sha512', this.secureSecret)
            .update(Buffer.from(signData, 'utf-8'))
            .digest('hex');

        return calculatedHash.toLowerCase() === secureHash.toLowerCase();
    }
}

module.exports = new VnPayService();
