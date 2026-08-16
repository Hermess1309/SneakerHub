const { AuthFailureError, ForbiddenError } = require('../core/error.response');

const { verifyToken } = require('../auth/checkAuth');

const userModel = require('../models/user.model');

const authUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const loggoed = req.cookies.logged;
        if ((loggoed && !accessToken) || (!loggoed && accessToken)) {
            res.clearCookie('logged');
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
        }
        
        if (accessToken) {
            const decoded = await verifyToken(accessToken);
            if (decoded) {
                req.user = decoded.id;
                return next();
            }
        }
        
        // --- Guest User Flow ---
        let guestId = req.cookies.guestId;
        if (!guestId) {
            const randomSuffix = Math.random().toString(36).substring(2, 7);
            const guestEmail = `guest_${Date.now()}_${randomSuffix}@guest.com`;
            const guestUser = await userModel.create({
                fullName: 'Khách vãng lai',
                email: guestEmail,
                password: 'guest_password_123'
            });
            guestId = guestUser._id.toString();
            res.cookie('guestId', guestId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        } else {
            const checkGuest = await userModel.findById(guestId);
            if (!checkGuest) {
                const randomSuffix = Math.random().toString(36).substring(2, 7);
                const guestEmail = `guest_${Date.now()}_${randomSuffix}@guest.com`;
                const guestUser = await userModel.create({
                    fullName: 'Khách vãng lai',
                    email: guestEmail,
                    password: 'guest_password_123'
                });
                guestId = guestUser._id.toString();
                res.cookie('guestId', guestId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            }
        }
        
        req.user = guestId;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const decoded = await verifyToken(accessToken);
        if (!decoded) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        const findUser = await userModel.findById(decoded.id);
        if (!findUser) {
            throw new AuthFailureError('Vui lòng đăng nhập lại');
        }
        if (findUser.isAdmin === false) {
            throw new ForbiddenError('Bạn không có quyền truy cập');
        }
        req.user = decoded.id;
        next();
    } catch (error) {
        throw new ForbiddenError('Bạn không có quyền truy cập');
    }
};

module.exports = { authUser, authAdmin };
