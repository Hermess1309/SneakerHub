const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUpload = (folderName, maxFileSize = 5 * 1024 * 1024) => {
    const uploadDir = path.join('src', 'uploads', folderName);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/;
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        const mime = (file.mimetype || '').toLowerCase();
        if (allowedTypes.test(ext) && (mime.startsWith('image/') || allowedTypes.test(mime))) {
            cb(null, true);
        } else {
            const err = new Error('Chỉ chấp nhận các tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)');
            err.statusCode = 400;
            cb(err, false);
        }
    };

    return multer({
        storage: storage,
        limits: { fileSize: maxFileSize },
        fileFilter: fileFilter,
    });
};

module.exports = createUpload;
