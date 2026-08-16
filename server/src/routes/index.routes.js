const usersRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const couponRoutes = require('./coupon.routes');
const paymentRoutes = require('./payment.routes');
const feedbackRoutes = require('./feedback.routes');
const messageRoutes = require('./message.routes');
const complaintRoutes = require('./complaint.routes');
const flashSaleRoutes = require('./flashsale.routes');

function routes(app) {
    app.use('/api/user', usersRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/message', messageRoutes);
    app.use('/api/complaint', complaintRoutes);
    app.use('/api/flashsale', flashSaleRoutes);
}

module.exports = routes;
