import App from '../App';
import CartUser from '../pages/CartUser';
import Checkout from '../pages/Checkout';
import DetailProduct from '../pages/DetailProduct';
import LoginUser from '../pages/LoginUser';
import PaymentSuccess from '../pages/PaymentSuccess';
import RegisterUser from '../pages/RegisterUser';
import AdminDashboard from '../pages/AdminDashboard';
import PrivateAdminRoute from './PrivateAdminRoute';
import OrderHistory from '../pages/OrderHistory';
import Profile from '../pages/Profile';

const routes = [
    {
        path: '/',
        component: <App />,
    },
    {
        path: 'product/:id',
        component: <DetailProduct />,
    },
    {
        path: '/login',
        component: <LoginUser />,
    },
    {
        path: '/register',
        component: <RegisterUser />,
    },
    {
        path: '/cart',
        component: <CartUser />,
    },
    {
        path: '/checkout',
        component: <Checkout />,
    },
    {
        path: '/payment-success/:orderId',
        component: <PaymentSuccess />,
    },
    {
        path: '/order',
        component: <OrderHistory />,
    },
    {
        path: '/orders',
        component: <OrderHistory />,
    },
    {
        path: '/profile',
        component: <Profile />,
    },
    {
        path: '/admin',
        component: (
            <PrivateAdminRoute>
                <AdminDashboard />
            </PrivateAdminRoute>
        ),
    },
];

export default routes;
