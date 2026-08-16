import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../hooks/useStore';
import { Form, Input, Button, Card, Divider, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { requestUpdateProfile, requestChangePassword } from '../config/UserRequest';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const { dataUser, fetchAuth } = useStore();
    const navigate = useNavigate();
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        if (dataUser) {
            profileForm.setFieldsValue({
                fullName: dataUser.fullName
            });
        }
    }, [dataUser, profileForm]);

    if (!dataUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center pt-24">
                    <Spin size="large" tip="Đang tải thông tin tài khoản..." />
                </div>
                <Footer />
            </div>
        );
    }

    const handleProfileSubmit = async (values) => {
        setUpdatingProfile(true);
        try {
            await requestUpdateProfile({ fullName: values.fullName });
            message.success('Cập nhật thông tin cá nhân thành công!');
            if (fetchAuth) {
                await fetchAuth();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error(error.response?.data?.message || 'Không thể cập nhật thông tin cá nhân');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handlePasswordSubmit = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error('Mật khẩu nhập lại không khớp!');
            return;
        }

        setUpdatingPassword(true);
        try {
            await requestChangePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });
            message.success('Đổi mật khẩu thành công!');
            passwordForm.resetFields();
        } catch (error) {
            console.error('Error changing password:', error);
            message.error(error.response?.data?.message || 'Đổi mật khẩu không thành công');
        } finally {
            setUpdatingPassword(false);
        }
    };

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            
            <main className="flex-grow container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Intro */}
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hồ Sơ Cá Nhân</h1>
                        <p className="text-sm text-gray-500 mt-1">Quản lý và thay đổi thông tin tài khoản của bạn</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Profile Summary Card */}
                        <div className="md:col-span-1">
                            <Card className="rounded-2xl border-gray-200 shadow-sm text-center p-4 sticky top-28 bg-white">
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 rounded-full bg-black text-white text-2xl font-extrabold flex items-center justify-center shadow-md">
                                        {getInitials(dataUser.fullName)}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{dataUser.fullName}</h3>
                                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
                                    <MailOutlined /> {dataUser.email}
                                </p>
                                
                                <Divider className="my-4" />
                                
                                <div className="space-y-3.5 text-left text-xs text-gray-655">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vai trò tài khoản</p>
                                        <p className="font-bold text-gray-900 mt-0.5">
                                            {dataUser.isAdmin ? 'Quản trị viên (Admin)' : 'Khách hàng thân thiết'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ngày tham gia</p>
                                        <p className="font-semibold text-gray-800 mt-0.5">
                                            {new Date(dataUser.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Edit Forms Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Personal Info Form */}
                            <Card className="rounded-2xl border-gray-200 shadow-sm bg-white" title={<span className="font-bold text-gray-900">Thông Tin Tài Khoản</span>}>
                                <Form
                                    form={profileForm}
                                    layout="vertical"
                                    onFinish={handleProfileSubmit}
                                >
                                    <Form.Item
                                        name="fullName"
                                        label="Họ và tên"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                                    >
                                        <Input 
                                            prefix={<UserOutlined className="text-gray-400" />} 
                                            placeholder="Nguyễn Văn A" 
                                            size="large"
                                            className="rounded-xl"
                                        />
                                    </Form.Item>

                                    <Form.Item className="mb-0 flex justify-end">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={updatingProfile}
                                            size="large"
                                            className="bg-black text-white hover:bg-gray-800 border-none rounded-xl px-6"
                                        >
                                            Cập nhật
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>

                            {/* Change Password Form */}
                            <Card className="rounded-2xl border-gray-200 shadow-sm bg-white" title={<span className="font-bold text-gray-900">Đổi Mật Khẩu</span>}>
                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handlePasswordSubmit}
                                >
                                    <Form.Item
                                        name="oldPassword"
                                        label="Mật khẩu cũ"
                                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
                                    >
                                        <Input.Password 
                                            prefix={<LockOutlined className="text-gray-400" />} 
                                            placeholder="Nhập mật khẩu cũ"
                                            size="large"
                                            className="rounded-xl"
                                        />
                                    </Form.Item>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Form.Item
                                            name="newPassword"
                                            label="Mật khẩu mới"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                                { min: 6, message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' }
                                            ]}
                                        >
                                            <Input.Password 
                                                prefix={<KeyOutlined className="text-gray-400" />} 
                                                placeholder="Tối thiểu 6 ký tự"
                                                size="large"
                                                className="rounded-xl"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="confirmPassword"
                                            label="Xác nhận mật khẩu mới"
                                            rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu mới!' }]}
                                        >
                                            <Input.Password 
                                                prefix={<KeyOutlined className="text-gray-400" />} 
                                                placeholder="Nhập lại mật khẩu mới"
                                                size="large"
                                                className="rounded-xl"
                                            />
                                        </Form.Item>
                                    </div>

                                    <Form.Item className="mb-0 flex justify-end">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={updatingPassword}
                                            size="large"
                                            className="bg-black text-white hover:bg-gray-800 border-none rounded-xl px-6"
                                        >
                                            Đổi mật khẩu
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Profile;
