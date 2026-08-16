import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import cookie from 'js-cookie';
import { Spin } from 'antd';

function PrivateAdminRoute({ children }) {
    const { dataUser } = useStore();
    const logged = cookie.get('logged');

    // If cookie 'logged' exists but user data hasn't loaded yet, show loading
    if (logged && !dataUser) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-500 font-medium">Đang xác thực quyền Admin...</p>
                </div>
            </div>
        );
    }

    // If not logged in, or logged in but not an admin, redirect to homepage
    if (!logged || (dataUser && !dataUser.isAdmin)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PrivateAdminRoute;
