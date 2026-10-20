const mongoose = require('mongoose');
const { AuthFailureError, ForbiddenError } = require('../core/error.response');

const { verifyToken } = require('../auth/checkAuth');

const userModel = require('../models/user.model');

const authUser = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const logged = req.cookies.logged;
        if ((logged && !accessToken) || (!logged && accessToken)) {
            res.clearCookie('logged');
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
        }
        
        if (accessToken) {
            try {
                const decoded = await verifyToken(accessToken);
                if (decoded && decoded.id) {
                    req.user = decoded.id;
                    return next();
                }
            } catch (tokenErr) {
                // Token invalid or expired - clear cookies and fall back to guest
                res.clearCookie('logged');
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
            }
        }
        
        // --- Guest User Flow ---
        let guestId = req.cookies.guestId;
        if (!guestId || !mongoose.Types.ObjectId.isValid(guestId)) {
            guestId = new mongoose.Types.ObjectId().toString();
            res.cookie('guestId', guestId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        }
        
        req.user = guestId;
        next();
    } catch (error) {
        next(error);
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
