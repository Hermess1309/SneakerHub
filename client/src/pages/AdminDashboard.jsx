import React, { useState, useEffect, useRef } from 'react';
import {
    Tabs, Table, Button, Input, Select, Modal, Upload, Popconfirm, Form,
    InputNumber, Tag, message, Descriptions, Divider, Space, Popover, Badge
} from 'antd';
import {
    EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
    AppstoreOutlined, ShoppingOutlined, UserOutlined, WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { listProduct, createProduct, updateProduct, deleteProduct } from '../config/ProductRequest';
import { listCategory, createCategory, updateCategory, deleteCategory } from '../config/CategoryRequest';
import { requestPaymentsAdmin, requestUpdatePaymentStatus } from '../config/paymentRequest';
import { requestUsersAdmin, requestDeleteUserAdmin, requestToggleAdmin } from '../config/UserRequest';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../config/CounponRequest';

// Lucide & Recharts imports for premium Dashboard theme
import { 
    LayoutDashboard, ShoppingBag, FolderHeart, ShoppingCart, Users as UsersIcon,
    Settings as SettingsIcon, Bell, LogOut, Search as SearchIcon,
    DollarSign, Layers, LineChart, MessageSquare, Clock, CheckCircle, XCircle, Image, Paperclip, Send
} from 'lucide-react';
import { 
    requestGetConversations, requestGetMessages, requestSendMessage,
    requestAcceptChat, requestCloseChat, requestGetChatStats 
} from '../config/MessageRequest';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const { Search } = Input;
const { Option } = Select;

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

function AdminDashboard() {
    const navigate = useNavigate();
    const { dataUser } = useStore();
    
    // Check admin permissions on render
    useEffect(() => {
        if (dataUser && !dataUser.isAdmin) {
            message.error('Bạn không có quyền truy cập trang quản trị');
            navigate('/');
        }
    }, [dataUser, navigate]);

    // Tab keys
    const [activeTab, setActiveTab] = useState('dashboard');

    // Notifications states
    const [notifications, setNotifications] = useState([]);
    const [notificationVisible, setNotificationVisible] = useState(false);

    // Products states
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchProduct, setSearchProduct] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm] = Form.useForm();
    const [productFileList, setProductFileList] = useState([]);
    const [submittingProduct, setSubmittingProduct] = useState(false);
    const [deletingProductId, setDeletingProductId] = useState(null);

    // Categories states
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm] = Form.useForm();
    const [categoryFileList, setCategoryFileList] = useState([]);
    const [submittingCategory, setSubmittingCategory] = useState(false);
    const [deletingCategoryId, setDeletingCategoryId] = useState(null);

    // Orders states
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [filterOrderStatus, setFilterOrderStatus] = useState('all');
    const [filterOrderDate, setFilterOrderDate] = useState('');
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Users states
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Coupons states
    const [coupons, setCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [couponModalVisible, setCouponModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [couponForm] = Form.useForm();
    const [submittingCoupon, setSubmittingCoupon] = useState(false);

    // Chat support states
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingChatMessages, setLoadingChatMessages] = useState(false);
    const [chatStats, setChatStats] = useState({ waiting: 0, chatting: 0, closed: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch products
    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await listProduct();
            setProducts(res.metadata || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoadingProducts(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const res = await listCategory();
            // Filter out crawled helper subcategories (which contain commas or specific detail words)
            const filtered = (res.metadata || []).filter(cat => {
                const name = cat.nameCategory || "";
                return !name.includes(',') && 
                       !name.includes('Các dòng') && 
                       !name.includes('chạy bộ') && 
                       !name.includes('bóng rổ') &&
                       !name.includes('Samba') &&
                       !name.includes('Pickleball');
            });
            setCategories(filtered);
        } catch (error) {
            console.error('Error fetching categories:', error);
            message.error('Không thể tải danh sách danh mục');
        } finally {
            setLoadingCategories(false);
        }
    };

    // Fetch orders
    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await requestPaymentsAdmin();
            setOrders(res.metadata || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchOrdersSilently = async () => {
        try {
            const res = await requestPaymentsAdmin();
            const newOrdersList = res.metadata || [];
            
            setOrders(prevOrders => {
                if (prevOrders.length > 0 && newOrdersList.length > prevOrders.length) {
                    const prevIds = new Set(prevOrders.map(o => o._id));
                    const addedOrders = newOrdersList.filter(o => !prevIds.has(o._id));
                    
                    if (addedOrders.length > 0) {
                        addedOrders.forEach(o => {
                            const notifyMsg = `Đơn hàng mới #${o._id.substring(o._id.length - 6)} từ ${o.fullName || 'Khách hàng'} trị giá ${formatPrice(o.finalPrice || o.totalPrice)}`;
                            
                            message.info({
                                content: notifyMsg,
                                duration: 4.5,
                                style: { marginTop: '10vh' }
                            });
                            
                            setNotifications(prev => [
                                {
                                    id: o._id,
                                    message: notifyMsg,
                                    time: new Date(),
                                    read: false
                                },
                                ...prev
                            ]);
                        });
                    }
                }
                return newOrdersList;
            });
        } catch (error) {
            console.error('Silent fetch orders error:', error);
        }
    };

    // Auto-refresh orders every 10 seconds to check for new orders
    useEffect(() => {
        const timer = setInterval(() => {
            fetchOrdersSilently();
        }, 10000);
        
        return () => clearInterval(timer);
    }, [orders]);

    // Pre-populate notifications
    useEffect(() => {
        if (orders.length > 0 && notifications.length === 0) {
            const recent3 = orders.slice(0, 3);
            const initNotifies = recent3.map(o => ({
                id: o._id,
                message: `Đơn hàng #${o._id.substring(o._id.length - 6)} từ ${o.fullName || 'Khách hàng'} trị giá ${formatPrice(o.finalPrice || o.totalPrice)}`,
                time: new Date(o.createdAt),
                read: true
            }));
            setNotifications(initNotifies);
        }
    }, [orders]);

    // Fetch users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await requestUsersAdmin();
            setUsers(res.metadata || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error('Không thể tải danh sách tài khoản');
        } finally {
            setLoadingUsers(false);
        }
    };

    // Fetch coupons
    const fetchCoupons = async () => {
        setLoadingCoupons(true);
        try {
            const res = await listCoupons();
            setCoupons(res.metadata || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            message.error('Không thể tải danh sách mã giảm giá');
        } finally {
            setLoadingCoupons(false);
        }
    };

    // Load data on active tab change
    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchProducts();
            fetchCategories();
            fetchOrders();
            fetchUsers();
            fetchCoupons();
        } else if (activeTab === 'products') {
            fetchProducts();
            fetchCategories(); // Needed for category filter & dropdowns
        } else if (activeTab === 'categories') {
            fetchCategories();
            fetchProducts(); // Needed for product count check
        } else if (activeTab === 'orders') {
            fetchOrders();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'coupons') {
            fetchCoupons();
        } else if (activeTab === 'support') {
            fetchConversations();
            fetchChatStats();
        }
    }, [activeTab]);

    // Format Price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0);
    };

    // ==========================================
    // PRODUCT CRUD HANDLERS
    // ==========================================
    const openAddProductModal = () => {
        setEditingProduct(null);
        setProductFileList([]);
        productForm.resetFields();
        setProductModalVisible(true);
    };

    const openEditProductModal = (record) => {
        setEditingProduct(record);
        productForm.setFieldsValue({
            nameProduct: record.nameProduct,
            priceProduct: record.priceProduct,
            discountProduct: record.discountProduct,
            stockProduct: record.stockProduct,
            descriptionProduct: record.descriptionProduct,
            categoryProduct: record.categoryProduct?._id || record.categoryProduct,
            author: record.metadata?.author || '',
            publisher: record.metadata?.publisher || '',
            publishingHouse: record.metadata?.publishingHouse || '',
            translator: record.metadata?.translator || '',
            size: record.metadata?.size || '',
            coverType: record.metadata?.coverType || '',
            imageUrlsProduct: record.imagesProduct ? record.imagesProduct.join(', ') : '',
        });
        
        // Map existing images to upload file list format
        if (record.imagesProduct) {
            const formattedImages = record.imagesProduct.map((url, index) => ({
                uid: `-existing-${index}`,
                name: `image-${index}.png`,
                status: 'done',
                url: url
            }));
            setProductFileList(formattedImages);
        } else {
            setProductFileList([]);
        }
        setProductModalVisible(true);
    };

    const handleBeforeUploadProduct = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Chỉ được tải lên ảnh định dạng JPG hoặc PNG!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Dung lượng ảnh phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent automatic upload
    };

    const handleProductUploadChange = ({ fileList: newFileList }) => {
        if (newFileList.length > 5) {
            message.warning('Tối đa chỉ được tải lên 5 hình ảnh!');
            setProductFileList(newFileList.slice(0, 5));
        } else {
            setProductFileList(newFileList);
        }
    };

    const handleProductSubmit = async (values) => {
        setSubmittingProduct(true);
        try {
            const formData = new FormData();
            formData.append('nameProduct', values.nameProduct);
            formData.append('priceProduct', values.priceProduct);
            formData.append('discountProduct', values.discountProduct || 0);
            formData.append('stockProduct', values.stockProduct || 0);
            formData.append('descriptionProduct', values.descriptionProduct);
            formData.append('categoryProduct', values.categoryProduct);
            
            // Build metadata
            const metadataObj = {
                author: values.author || '',
                publisher: values.publisher || '',
                publishingHouse: values.publishingHouse || '',
                translator: values.translator || '',
                size: values.size || '',
                coverType: values.coverType || '',
            };
            formData.append('metadata', JSON.stringify(metadataObj));

            // Extract manual URL entries
            const manualUrls = values.imageUrlsProduct 
                ? values.imageUrlsProduct.split(',').map(url => url.trim()).filter(Boolean)
                : [];

            // Separate existing images and new files
            const existingImages = [];
            productFileList.forEach(file => {
                if (file.originFileObj) {
                    formData.append('imagesProduct', file.originFileObj);
                } else if (file.url) {
                    existingImages.push(file.url);
                }
            });

            // Merge manual URL entries with existing images
            const finalExistingImages = [...new Set([...existingImages, ...manualUrls])];

            if (editingProduct) {
                formData.append('oldImagesProduct', JSON.stringify(finalExistingImages));
                await updateProduct(editingProduct._id, formData);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                if (productFileList.filter(f => f.originFileObj).length === 0 && manualUrls.length === 0) {
                    message.error('Vui lòng tải lên ảnh hoặc dán URL ảnh sản phẩm!');
                    setSubmittingProduct(false);
                    return;
                }
                if (manualUrls.length > 0) {
                    formData.append('imagesProduct', JSON.stringify([...new Set(manualUrls)]));
                }
                await createProduct(formData);
                message.success('Thêm sản phẩm thành công!');
            }
            setProductModalVisible(false);
            fetchProducts();
        } catch (error) {
            console.error('Error submitting product:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
        } finally {
            setSubmittingProduct(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        setDeletingProductId(id);
        try {
            await deleteProduct(id);
            message.success('Xóa sản phẩm thành công!');
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            message.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
        } finally {
            setDeletingProductId(null);
        }
    };

    // ==========================================
    // CATEGORY CRUD HANDLERS
    // ==========================================
    const openAddCategoryModal = () => {
        setEditingCategory(null);
        setCategoryFileList([]);
        categoryForm.resetFields();
        setCategoryModalVisible(true);
    };

    const openEditCategoryModal = (record) => {
        setEditingCategory(record);
        categoryForm.setFieldsValue({
            nameCategory: record.nameCategory,
            imageUrlCategory: record.imageCategory || '',
        });
        if (record.imageCategory) {
            setCategoryFileList([{
                uid: '-existing-cat',
                name: 'category-image.png',
                status: 'done',
                url: record.imageCategory
            }]);
        } else {
            setCategoryFileList([]);
        }
        setCategoryModalVisible(true);
    };

    const handleBeforeUploadCategory = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Chỉ được tải lên ảnh định dạng JPG hoặc PNG!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Dung lượng ảnh phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        return false; // Prevent automatic upload
    };

    const handleCategoryUploadChange = ({ fileList: newFileList }) => {
        setCategoryFileList(newFileList.slice(-1)); // Only allow 1 image
    };

    const handleCategorySubmit = async (values) => {
        setSubmittingCategory(true);
        try {
            const formData = new FormData();
            formData.append('nameCategory', values.nameCategory);

            if (categoryFileList[0]?.originFileObj) {
                formData.append('imageCategory', categoryFileList[0].originFileObj);
            } else if (values.imageUrlCategory) {
                formData.append('imageCategory', values.imageUrlCategory.trim());
            } else if (categoryFileList[0]?.url) {
                formData.append('imageCategory', categoryFileList[0].url);
            }

            if (editingCategory) {
                await updateCategory(editingCategory._id, formData);
                message.success('Cập nhật danh mục thành công!');
            } else {
                if (categoryFileList.length === 0 && !values.imageUrlCategory) {
                    message.error('Vui lòng tải lên ảnh hoặc nhập URL ảnh đại diện cho danh mục!');
                    setSubmittingCategory(false);
                    return;
                }
                await createCategory(formData);
                message.success('Tạo danh mục thành công!');
            }
            setCategoryModalVisible(false);
            fetchCategories();
        } catch (error) {
            console.error('Error submitting category:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
        } finally {
            setSubmittingCategory(false);
        }
    };

    const handleDeleteCategory = async (record) => {
        // Validation: Block delete if products exist in category
        const productCount = products.filter(p => {
            const catId = p.categoryProduct?._id || p.categoryProduct;
            return catId === record._id;
        }).length;

        if (productCount > 0) {
            Modal.warning({
                title: 'Không thể xóa thương hiệu này',
                icon: <WarningOutlined className="text-yellow-500" />,
                content: `Thương hiệu "${record.nameCategory}" hiện tại đang có ${productCount} sản phẩm liên kết. Vui lòng cập nhật hoặc chuyển các sản phẩm này sang thương hiệu khác trước khi thực hiện xóa.`,
                okText: 'Đã hiểu'
            });
            return;
        }

        setDeletingCategoryId(record._id);
        try {
            await deleteCategory(record._id);
            message.success('Xóa thương hiệu thành công!');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            message.error(error.response?.data?.message || 'Không thể xóa thương hiệu');
        } finally {
            setDeletingCategoryId(null);
        }
    };

    // ==========================================
    // ORDER HANDLERS
    // ==========================================
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await requestUpdatePaymentStatus(orderId, newStatus);
            message.success('Cập nhật trạng thái đơn hàng thành công!');
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    };

    const openOrderDetailModal = (record) => {
        setSelectedOrder(record);
        setOrderDetailVisible(true);
    };

    // ==========================================
    // TABLE COLUMNS DEFINITIONS
    // ==========================================

    // Products Columns
    const productColumns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'imagesProduct',
            key: 'imagesProduct',
            width: 100,
            render: (images) => (
                <img
                    src={images?.[0] || 'https://via.placeholder.com/60x80'}
                    alt="giày"
                    className="w-12 h-12 object-cover rounded shadow border"
                />
            )
        },
        {
            title: 'Tên giày',
            dataIndex: 'nameProduct',
            key: 'nameProduct',
            render: (text) => <span className="font-semibold text-gray-800">{text}</span>
        },
        {
            title: 'Thương hiệu',
            dataIndex: 'categoryProduct',
            key: 'categoryProduct',
            render: (category) => {
                const categoryObj = categories.find(c => c._id === (category?._id || category));
                return categoryObj ? <Tag color="blue">{categoryObj.nameCategory}</Tag> : <Tag color="gray">Không có</Tag>;
            }
        },
        {
            title: 'Đơn giá',
            dataIndex: 'priceProduct',
            key: 'priceProduct',
            render: (price) => <span className="text-gray-900 font-medium">{formatPrice(price)}</span>
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discountProduct',
            key: 'discountProduct',
            render: (discount) => (
                discount > 0 ? <Tag color="red">-{discount}%</Tag> : <span className="text-gray-400">-</span>
            )
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stockProduct',
            key: 'stockProduct',
            render: (stock) => (
                stock > 0 ? (
                    <span className="text-green-600 font-semibold">{stock} đôi</span>
                ) : (
                    <span className="text-red-500 font-bold">Hết hàng</span>
                )
            )
        },
        {
            title: 'Màu sắc / Chất liệu',
            key: 'authorPublisher',
            render: (_, record) => (
                <div className="text-xs text-gray-600">
                    <p><span className="font-medium">Màu sắc:</span> {record.metadata?.author || 'N/A'}</p>
                    <p><span className="font-medium">Chất liệu:</span> {record.metadata?.publisher || 'N/A'}</p>
                </div>
            )
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        ghost
                        icon={<EditOutlined />}
                        onClick={() => openEditProductModal(record)}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa giày này?"
                        onConfirm={() => handleDeleteProduct(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ loading: deletingProductId === record._id, danger: true }}
                    >
                        <Button
                            type="primary"
                            danger
                            ghost
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Categories Columns
    const categoryColumns = [
        {
            title: 'Logo',
            dataIndex: 'imageCategory',
            key: 'imageCategory',
            width: 120,
            render: (image) => (
                <img
                    src={image || 'https://via.placeholder.com/80x80'}
                    alt="thương hiệu"
                    className="w-16 h-12 object-contain bg-gray-50 rounded shadow border p-1"
                />
            )
        },
        {
            title: 'Tên thương hiệu',
            dataIndex: 'nameCategory',
            key: 'nameCategory',
            render: (text) => <span className="font-bold text-gray-800">{text}</span>
        },
        {
            title: 'Số sản phẩm',
            key: 'productCount',
            render: (_, record) => {
                const count = products.filter(p => {
                    const catId = p.categoryProduct?._id || p.categoryProduct;
                    return catId === record._id;
                }).length;
                return <Tag color="purple" className="text-sm font-semibold px-2 py-0.5">{count} đôi giày</Tag>;
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        ghost
                        icon={<EditOutlined />}
                        onClick={() => openEditCategoryModal(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        ghost
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCategory(record)}
                        loading={deletingCategoryId === record._id}
                    />
                </Space>
            )
        }
    ];

    // Orders Columns
    const orderColumns = [
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <p className="font-semibold text-gray-800">{record.fullName || record.userId?.fullName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{record.email || record.userId?.email || 'N/A'}</p>
                </div>
            )
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_, record) => (
                <div className="text-xs">
                    <p><span className="font-medium">SĐT:</span> {record.phoneNumber}</p>
                    <p className="text-gray-500 max-w-[200px] truncate" title={record.address}>
                        <span className="font-medium text-black">Địa chỉ:</span> {record.address}
                    </p>
                </div>
            )
        },
        {
            title: 'Thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) => (
                <Tag color={method === 'cod' ? 'orange' : 'green'} className="uppercase font-semibold">
                    {method}
                </Tag>
            )
        },
        {
            title: 'Tổng tiền',
            key: 'totalPrice',
            render: (_, record) => (
                <span className="font-bold text-red-600">
                    {formatPrice(record.finalPrice || record.totalPrice)}
                </span>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 180,
            render: (status, record) => (
                <Select
                    value={status}
                    style={{ width: '100%' }}
                    onChange={(newStatus) => handleUpdateOrderStatus(record._id, newStatus)}
                    className="font-medium"
                >
                    <Option value="pending">
                        <span className="text-yellow-600 font-semibold">Chờ xác nhận</span>
                    </Option>
                    <Option value="confirmed">
                        <span className="text-blue-600 font-semibold">Đang chuẩn bị</span>
                    </Option>
                    <Option value="delivered">
                        <span className="text-cyan-600 font-semibold">Đang giao</span>
                    </Option>
                    <Option value="completed">
                        <span className="text-green-600 font-semibold">Đã hoàn thành</span>
                    </Option>
                    <Option value="cancelled">
                        <span className="text-red-500 font-semibold">Đã hủy</span>
                    </Option>
                </Select>
            )
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => openOrderDetailModal(record)}
                    >
                        Chi tiết
                    </Button>
                    {(record.status === 'pending' || record.status === 'confirmed') && (
                        <Button
                            type="primary"
                            className="bg-cyan-600 hover:bg-cyan-700 text-white border-none"
                            onClick={() => handleUpdateOrderStatus(record._id, 'delivered')}
                        >
                            Xác nhận giao
                        </Button>
                    )}
                </div>
            )
        }
    ];

    // Filtered lists
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.nameProduct.toLowerCase().includes(searchProduct.toLowerCase());
        const matchesCategory = filterCategory === 'all' || 
            (product.categoryProduct?._id || product.categoryProduct) === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterOrderStatus === 'all' || order.status === filterOrderStatus;
        let matchesDate = true;
        if (filterOrderDate) {
            const orderDate = new Date(order.createdAt).toLocaleDateString('sv');
            matchesDate = orderDate === filterOrderDate;
        }
        return matchesStatus && matchesDate;
    });

    const getSalesOverviewData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map(m => ({ name: m, sales: 0 }));
        
        orders.forEach(o => {
            if (o.status === 'completed') {
                const date = new Date(o.createdAt);
                const monthIdx = date.getMonth();
                if (monthIdx >= 0 && monthIdx < 12) {
                    data[monthIdx].sales += (o.finalPrice || o.totalPrice);
                }
            }
        });
        
        return data;
    };

    const getCategoryData = () => {
        const data = categories.map(cat => {
            const count = products.filter(p => {
                const catId = p.categoryProduct?._id || p.categoryProduct;
                return catId === cat._id;
            }).length;
            return { name: cat.nameCategory, value: count };
        }).filter(d => d.value > 0);
        
        return data;
    };

    const menuItems = [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'products', label: 'Quản lý Giày', icon: ShoppingBag },
        { key: 'categories', label: 'Quản lý Thương hiệu', icon: FolderHeart },
        { key: 'orders', label: 'Quản lý Đơn hàng', icon: ShoppingCart },
        { key: 'users', label: 'Quản lý Khách hàng', icon: UsersIcon },
        { key: 'coupons', label: 'Quản lý Khuyến mãi', icon: Layers },
        { key: 'support', label: 'Hỗ trợ khách hàng', icon: MessageSquare },
        { key: 'revenue', label: 'Thống kê Doanh thu', icon: LineChart },
        { key: 'settings', label: 'Cấu hình hệ thống', icon: SettingsIcon },
    ];

    const renderRevenue = () => {
        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);
        const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);
        const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
        
        const brandRevenueMap = {};
        completedOrders.forEach(order => {
            (order.products || []).forEach(item => {
                if (item.productId) {
                    const brandName = item.productId.categoryProduct?.nameCategory || 'Khác';
                    const itemRevenue = (item.productId.priceProduct - (item.productId.priceProduct * (item.productId.discountProduct || 0)) / 100) * item.quantity;
                    brandRevenueMap[brandName] = (brandRevenueMap[brandName] || 0) + itemRevenue;
                }
            });
        });
        
        const brandRevenueData = Object.entries(brandRevenueMap).map(([name, value]) => ({
            name,
            revenue: value
        })).sort((a, b) => b.revenue - a.revenue);

        const last15Days = [...Array(15).keys()].map(i => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }).reverse();

        const dailyRevenueData = last15Days.map(dateStr => {
            const daySales = completedOrders.filter(o => {
                const oDate = new Date(o.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                return oDate === dateStr;
            }).reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);
            return { name: dateStr, 'Doanh thu': daySales };
        });

        const revenueColumns = [
            {
                title: 'Mã đơn hàng',
                dataIndex: '_id',
                key: '_id',
                render: (id) => <span className="font-mono text-xs font-semibold text-gray-800">{id}</span>
            },
            {
                title: 'Khách hàng',
                dataIndex: 'fullName',
                key: 'fullName',
                render: (text, record) => (
                    <div>
                        <p className="font-semibold text-gray-900">{text || record.userId?.fullName || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{record.email || record.userId?.email || 'N/A'}</p>
                    </div>
                )
            },
            {
                title: 'Ngày thanh toán',
                dataIndex: 'updatedAt',
                key: 'updatedAt',
                render: (date) => new Date(date).toLocaleString('vi-VN')
            },
            {
                title: 'Phương thức',
                dataIndex: 'paymentMethod',
                key: 'paymentMethod',
                render: (method) => (
                    <span className="uppercase text-xs font-bold bg-gray-150 px-2 py-0.5 rounded text-gray-700">
                        {method}
                    </span>
                )
            },
            {
                title: 'Doanh thu thực tế',
                dataIndex: 'finalPrice',
                key: 'finalPrice',
                render: (val, record) => <span className="font-bold text-gray-950">{formatPrice(val || record.totalPrice)}</span>
            }
        ];

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng doanh thu</p>
                        <h3 className="text-2xl font-extrabold text-black mt-2">{formatPrice(totalRevenue)}</h3>
                        <p className="text-[10px] text-green-600 font-semibold mt-1">✓ Đơn hàng đã hoàn thành</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh thu chờ duyệt</p>
                        <h3 className="text-2xl font-extrabold text-gray-600 mt-2">{formatPrice(pendingRevenue)}</h3>
                        <p className="text-[10px] text-yellow-600 font-semibold mt-1">⏳ Đang giao hàng / chuẩn bị</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn hàng hoàn tất</p>
                        <h3 className="text-2xl font-extrabold text-black mt-2">{completedOrders.length}</h3>
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">đơn giao thành công</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Giá trị trung bình</p>
                        <h3 className="text-2xl font-extrabold text-black mt-2">{formatPrice(avgOrderValue)}</h3>
                        <p className="text-[10px] text-blue-600 font-semibold mt-1">trên mỗi đơn hàng</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div>
                            <h4 className="text-base font-bold text-gray-955">Doanh thu 15 ngày qua</h4>
                            <p className="text-gray-500 text-xs">Biểu đồ thống kê doanh thu bán hàng theo từng ngày</p>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyRevenueData}>
                                    <defs>
                                        <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px' }}
                                        formatter={(value) => [formatPrice(value), 'Doanh thu']}
                                    />
                                    <Area type="monotone" dataKey="Doanh thu" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorDaily)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div>
                            <h4 className="text-base font-bold text-gray-955">Doanh thu theo Thương hiệu</h4>
                            <p className="text-gray-500 text-xs">Phân tích tỷ lệ cơ cấu doanh thu dựa trên hãng giày</p>
                        </div>
                        <div className="space-y-3.5 flex-1 overflow-y-auto max-h-72 pt-3 scrollbar-custom">
                            {brandRevenueData.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-10">Chưa có dữ liệu doanh thu</p>
                            ) : (
                                brandRevenueData.map((item, idx) => {
                                    const percent = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                                    return (
                                        <div key={item.name} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                                                <span>{idx + 1}. {item.name}</span>
                                                <span>{formatPrice(item.revenue)} ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-105 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-black h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div>
                        <h4 className="text-base font-bold text-gray-955">Chi tiết các đơn hàng hoàn tất</h4>
                        <p className="text-xs text-gray-500">Danh sách đầy đủ lịch sử hóa đơn bán ra thành công</p>
                    </div>
                    <Table
                        columns={revenueColumns}
                        dataSource={completedOrders}
                        rowKey="_id"
                        pagination={{ pageSize: 5 }}
                        className="border border-gray-250 rounded-xl overflow-hidden"
                    />
                </div>
            </div>
        );
    };

    const renderDashboard = () => {
        const totalSales = orders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todaySales = orders
            .filter(o => {
                const isPaid = o.status === 'completed';
                if (!isPaid) return false;
                const orderDate = new Date(o.createdAt);
                return orderDate >= startOfToday;
            })
            .reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);

        const uniqueClients = [...new Set(orders.map(o => o.email || o.userId?.email || o.phoneNumber))].filter(Boolean).length;
        const totalClients = users.length || uniqueClients;
        
        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + (p.stockProduct || 0), 0);

        const salesData = getSalesOverviewData();
        const categoryData = getCategoryData();

        const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        const MONO_COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

        return (
            <div className="space-y-6">
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Doanh thu bán hàng</p>
                                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatPrice(totalSales)}</h3>
                            </div>
                            <span className="p-3 bg-green-50 text-green-700 rounded-xl">
                                <DollarSign className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-green-600">
                            <span>▲ +14.2%</span>
                            <span className="text-gray-400">so với tuần trước</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Doanh thu hôm nay</p>
                                <h3 className="text-2xl font-extrabold text-gray-955 mt-1">{formatPrice(todaySales)}</h3>
                            </div>
                            <span className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
                                <DollarSign className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-500">
                            <span>Hôm nay</span>
                            <span className="text-gray-400">{today.toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Khách hàng</p>
                                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalClients}</h3>
                            </div>
                            <span className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                                <UsersIcon className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-blue-600">
                            <span>▲ +8.3%</span>
                            <span className="text-gray-400">tăng trưởng tháng này</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Mẫu giày trong kho</p>
                                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalProducts}</h3>
                            </div>
                            <span className="p-3 bg-purple-50 text-purple-700 rounded-xl">
                                <ShoppingBag className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-purple-600">
                            <span>▲ 5 thương hiệu</span>
                            <span className="text-gray-400">hoạt động tốt</span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Tổng tồn kho</p>
                                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalStock} đôi</h3>
                            </div>
                            <span className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                                <Layers className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 text-xs text-amber-600">
                            <span>● {products.filter(p => p.stockProduct === 0).length} hết hàng</span>
                            <span className="text-gray-400">cần nhập kho</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Overview Line Chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-base font-bold text-gray-950">Xu hướng Doanh thu</h4>
                                <p className="text-gray-500 text-xs">Biểu đồ doanh thu thực tế theo tháng trong năm</p>
                            </div>
                            <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-mono">
                                2026 (VND)
                            </div>
                        </div>
                        
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000000" stopOpacity={0.08}/>
                                            <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                                    <YAxis 
                                        stroke="#71717a" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px' }}
                                        labelStyle={{ color: '#000' }}
                                        formatter={(value) => [formatPrice(value), 'Doanh thu']}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Distribution Pie Chart */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-sm">
                        <div>
                            <h4 className="text-base font-bold text-gray-950">Cơ cấu Thương hiệu</h4>
                            <p className="text-gray-500 text-xs">Tỷ lệ cơ cấu sản phẩm theo từng hãng giày</p>
                        </div>

                        <div className="h-56 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '8px' }}
                                        formatter={(value) => [`${value} đôi`, 'Số lượng']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {categoryData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-gray-600">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MONO_COLORS[index % MONO_COLORS.length] }}></span>
                                    <span className="truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Orders list */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h4 className="text-base font-bold text-gray-950">Đơn hàng vừa đặt</h4>
                        <Button 
                            type="link" 
                            className="text-black hover:text-gray-600 p-0 text-xs font-semibold"
                            onClick={() => setActiveTab('orders')}
                        >
                            Xem tất cả đơn hàng →
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-450 text-xs font-semibold uppercase">
                                    <th className="pb-3 pl-2">Khách hàng</th>
                                    <th className="pb-3">SĐT</th>
                                    <th className="pb-3">Phương thức</th>
                                    <th className="pb-3">Trạng thái</th>
                                    <th className="pb-3 text-right pr-2">Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {recentOrders.map(o => (
                                    <tr key={o._id} className="hover:bg-gray-50/50">
                                        <td className="py-3.5 pl-2">
                                            <p className="font-semibold text-gray-900">{o.fullName || o.userId?.fullName || 'N/A'}</p>
                                            <p className="text-xs text-gray-400">{o.email || o.userId?.email || 'N/A'}</p>
                                        </td>
                                        <td className="py-3.5">{o.phoneNumber}</td>
                                        <td className="py-3.5 uppercase text-xs font-medium text-gray-500">{o.paymentMethod}</td>
                                        <td className="py-3.5">
                                            <Tag color={
                                                o.status === 'completed' ? 'success' :
                                                o.status === 'cancelled' ? 'error' : 'warning'
                                            } className="font-semibold text-xs rounded-full border px-2.5 py-0.5">
                                                {o.status === 'completed' ? 'Đã hoàn thành' :
                                                 o.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                                            </Tag>
                                        </td>
                                        <td className="py-3.5 text-right font-bold text-gray-900 pr-2">
                                            {formatPrice(o.finalPrice || o.totalPrice)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderProducts = () => {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-955">Danh sách giày thể thao</h3>
                        <p className="text-xs text-gray-500">Quản lý và chỉnh sửa toàn bộ các sản phẩm giày trong kho</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={openAddProductModal}
                        className="bg-black hover:bg-zinc-800 w-full sm:w-auto font-medium text-white flex items-center justify-center border-none"
                    >
                        Thêm giày mới
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <SearchIcon className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm giày theo tên..."
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black w-full"
                        />
                    </div>
                    <Select
                        value={filterCategory}
                        style={{ width: 200 }}
                        onChange={(value) => setFilterCategory(value)}
                        className="light-select"
                    >
                        <Option value="all">Tất cả thương hiệu</Option>
                        {categories.map(cat => (
                            <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                        ))}
                    </Select>
                </div>

                <Table
                    columns={productColumns}
                    dataSource={filteredProducts}
                    rowKey="_id"
                    loading={loadingProducts}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                />
            </div>
        );
    };

    const renderCategories = () => {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-955">Danh sách thương hiệu</h3>
                        <p className="text-xs text-gray-500">Quản lý các thương hiệu giày hoạt động trên hệ thống</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={openAddCategoryModal}
                        className="bg-black hover:bg-zinc-800 w-full sm:w-auto font-medium text-white flex items-center justify-center border-none"
                    >
                        Tạo thương hiệu mới
                    </Button>
                </div>

                <Table
                    columns={categoryColumns}
                    dataSource={categories}
                    rowKey="_id"
                    loading={loadingCategories}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                />
            </div>
        );
    };

    const renderOrders = () => {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-955">Danh sách đơn đặt hàng</h3>
                        <p className="text-xs text-gray-500">Xem chi tiết trạng thái thanh toán và thông tin giao nhận</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                        <Select
                            value={filterOrderStatus}
                            style={{ width: 180 }}
                            onChange={(value) => setFilterOrderStatus(value)}
                            className="light-select"
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="pending">Chờ xác nhận</Option>
                            <Option value="confirmed">Đang chuẩn bị</Option>
                            <Option value="delivered">Đang giao</Option>
                            <Option value="completed">Đã hoàn thành</Option>
                            <Option value="cancelled">Đã hủy</Option>
                        </Select>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Lọc theo ngày:</span>
                            <input
                                type="date"
                                value={filterOrderDate}
                                onChange={(e) => setFilterOrderDate(e.target.value)}
                                className="bg-white border border-gray-200 rounded-xl px-3 py-1 text-sm text-gray-900 focus:outline-none focus:border-black"
                            />
                            {filterOrderDate && (
                                <Button 
                                    type="link" 
                                    size="small" 
                                    onClick={() => setFilterOrderDate('')}
                                    className="text-red-500 p-0 text-xs hover:text-red-750 font-medium"
                                >
                                    Xóa
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Table
                    columns={orderColumns}
                    dataSource={filteredOrders}
                    rowKey="_id"
                    loading={loadingOrders}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                />
            </div>
        );
    };

    const renderSettings = () => {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-955">Cấu hình hệ thống</h3>
                    <p className="text-xs text-gray-500">Quản lý cấu hình cửa hàng, phương thức thanh toán và lưu trữ</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-3">
                        <h4 className="font-semibold text-gray-900">Thông tin cửa hàng</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Tên cửa hàng: SneakerHub</p>
                            <p>Số điện thoại: 0899227066</p>
                            <p>Email: doanthanhhuy1309@gmail.com</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-3">
                        <h4 className="font-semibold text-gray-900">Kết nối API & Tải ảnh</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>Trạng thái Cloudinary: <Tag color="orange" className="border-none px-2 py-0.5">Dự phòng cục bộ hoạt động</Tag></p>
                            <p>Đường dẫn API: http://localhost:3000/api</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleRoleChange = async (userId, currentIsAdmin, selectedValue) => {
        const wantsAdmin = selectedValue === 'admin';
        if (wantsAdmin !== currentIsAdmin) {
            try {
                await requestToggleAdmin(userId);
                message.success('Cập nhật vai trò tài khoản thành công');
                fetchUsers();
            } catch (error) {
                console.error('Error changing role:', error);
                message.error('Không thể cập nhật vai trò tài khoản');
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await requestDeleteUserAdmin(userId);
            message.success('Xóa tài khoản thành công');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error('Không thể xóa tài khoản');
        }
    };

    const userColumns = [
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => <span className="font-semibold text-gray-900">{text}</span>
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Vai trò (Chọn để đổi)',
            key: 'isAdmin',
            render: (_, record) => (
                <Select
                    value={record.isAdmin ? 'admin' : 'user'}
                    onChange={(value) => handleRoleChange(record._id, record.isAdmin, value)}
                    style={{ width: 140 }}
                >
                    <Option value="user">Khách hàng</Option>
                    <Option value="admin">Admin</Option>
                </Select>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm
                    title="Bạn có chắc muốn xóa tài khoản này?"
                    onConfirm={() => handleDeleteUser(record._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    const renderUsers = () => {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-gray-955">Danh sách tài khoản khách hàng</h3>
                    <p className="text-xs text-gray-500">Quản lý và cấp quyền truy cập admin cho các tài khoản đăng ký</p>
                </div>

                <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="_id"
                    loading={loadingUsers}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                />
            </div>
        );
    };

    // ==========================================
    // COUPON CRUD HANDLERS
    // ==========================================
    const openAddCouponModal = () => {
        setEditingCoupon(null);
        couponForm.resetFields();
        setCouponModalVisible(true);
    };

    const openEditCouponModal = (record) => {
        setEditingCoupon(record);
        couponForm.setFieldsValue({
            nameCoupon: record.nameCoupon,
            discount: record.discount,
            quantity: record.quantity,
            startDate: record.startDate ? record.startDate.substring(0, 10) : '',
            endDate: record.endDate ? record.endDate.substring(0, 10) : '',
            minPrice: record.minPrice,
        });
        setCouponModalVisible(true);
    };

    const handleCouponSubmit = async (values) => {
        setSubmittingCoupon(true);
        try {
            if (editingCoupon) {
                const res = await updateCoupon(editingCoupon._id, values);
                message.success(res.message || 'Cập nhật mã giảm giá thành công');
            } else {
                const res = await createCoupon(values);
                message.success(res.message || 'Thêm mã giảm giá thành công');
            }
            setCouponModalVisible(false);
            fetchCoupons();
        } catch (error) {
            console.error('Error saving coupon:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setSubmittingCoupon(false);
        }
    };

    const handleDeleteCoupon = async (id) => {
        try {
            const res = await deleteCoupon(id);
            message.success(res.message || 'Xóa mã giảm giá thành công');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            message.error('Không thể xóa mã giảm giá');
        }
    };

    const renderCoupons = () => {
        const couponColumns = [
            {
                title: 'Mã giảm giá',
                dataIndex: 'nameCoupon',
                key: 'nameCoupon',
                render: (text) => <span className="font-bold text-gray-900">{text}</span>
            },
            {
                title: 'Mức giảm (%)',
                dataIndex: 'discount',
                key: 'discount',
                render: (val) => <span className="font-semibold text-green-600">{val}%</span>
            },
            {
                title: 'Số lượng',
                dataIndex: 'quantity',
                key: 'quantity',
            },
            {
                title: 'Đơn tối thiểu',
                dataIndex: 'minPrice',
                key: 'minPrice',
                render: (val) => <span>{formatPrice(val)}</span>
            },
            {
                title: 'Ngày bắt đầu',
                dataIndex: 'startDate',
                key: 'startDate',
                render: (date) => new Date(date).toLocaleDateString('vi-VN')
            },
            {
                title: 'Ngày hết hạn',
                dataIndex: 'endDate',
                key: 'endDate',
                render: (date) => {
                    const isExpired = new Date(date) < new Date();
                    return (
                        <span className={isExpired ? "text-red-500 font-medium" : "text-gray-700"}>
                            {new Date(date).toLocaleDateString('vi-VN')} {isExpired && "(Hết hạn)"}
                        </span>
                    );
                }
            },
            {
                title: 'Hành động',
                key: 'actions',
                render: (_, record) => (
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditCouponModal(record)}
                        />
                        <Popconfirm
                            title="Bạn có chắc muốn xóa mã giảm giá này?"
                            onConfirm={() => handleDeleteCoupon(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="primary" danger size="small" icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </div>
                )
            }
        ];

        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-955">Danh sách mã giảm giá</h3>
                        <p className="text-xs text-gray-500">Tạo và quản lý các sự kiện khuyến mãi cho cửa hàng</p>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openAddCouponModal}
                        className="bg-black text-white hover:bg-gray-800 border-none rounded-xl"
                    >
                        Tạo mã giảm giá
                    </Button>
                </div>

                <Table
                    columns={couponColumns}
                    dataSource={coupons}
                    rowKey="_id"
                    loading={loadingCoupons}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 'max-content' }}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                />
            </div>
        );
    };

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const res = await requestGetConversations();
            setConversations(res.metadata || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch chat statistics
    const fetchChatStats = async () => {
        try {
            const res = await requestGetChatStats();
            if (res.metadata) {
                setChatStats(res.metadata);
            }
        } catch (error) {
            console.error('Error fetching chat stats:', error);
        }
    };

    // Fetch messages for a specific user
    const fetchMessagesForUser = async (userId, silent = false) => {
        if (!userId) return;
        if (!silent) setLoadingChatMessages(true);
        try {
            const res = await requestGetMessages(userId);
            setChatMessages(res.metadata || []);
        } catch (error) {
            console.error('Error fetching chat messages for user:', error);
        } finally {
            if (!silent) setLoadingChatMessages(false);
        }
    };

    // Polling effect for Support Tab
    useEffect(() => {
        if (activeTab !== 'support') return;

        fetchConversations();
        fetchChatStats();
        const convTimer = setInterval(() => {
            fetchConversations();
            fetchChatStats();
        }, 4000);

        return () => clearInterval(convTimer);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'support' || !selectedUserId) return;

        fetchMessagesForUser(selectedUserId);
        const msgTimer = setInterval(() => {
            fetchMessagesForUser(selectedUserId, true);
        }, 3000);

        return () => clearInterval(msgTimer);
    }, [activeTab, selectedUserId]);

    // Handle sending message
    const handleSendReply = async (e) => {
        if (e) e.preventDefault();
        if (!replyText.trim() || !selectedUserId) return;

        const text = replyText;
        setReplyText('');

        // Optimistic update
        const tempMsg = {
            _id: `temp-${Date.now()}`,
            userId: selectedUserId,
            senderId: dataUser?._id || 'admin',
            content: text,
            createdAt: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, tempMsg]);

        try {
            await requestSendMessage(text, selectedUserId);
            fetchMessagesForUser(selectedUserId, true);
            fetchConversations(); // refresh last message
        } catch (error) {
            message.error('Không thể gửi phản hồi');
        }
    };

    // Accept Chat Request
    const handleAcceptChat = async (userId) => {
        try {
            await requestAcceptChat(userId);
            message.success('Đã chấp nhận cuộc trò chuyện');
            fetchConversations();
            fetchChatStats();
            fetchMessagesForUser(userId, true);
        } catch (error) {
            message.error('Không thể chấp nhận cuộc trò chuyện');
        }
    };

    // Close Chat Session
    const handleCloseChat = async (userId) => {
        try {
            await requestCloseChat(userId);
            message.success('Đã đóng cuộc trò chuyện');
            setSelectedUserId(null); // Clear selected user panel
            fetchConversations();
            fetchChatStats();
        } catch (error) {
            message.error('Không thể đóng cuộc trò chuyện');
        }
    };

    const adminChatEndRef = useRef(null);
    useEffect(() => {
        if (activeTab === 'support' && selectedUserId) {
            adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab, selectedUserId]);

    // Conversations search filtering (exposes only active/waiting tickets, hiding closed ones)
    const filteredConversations = conversations.filter(conv => {
        const status = conv.userInfo?.chatStatus || 'closed';
        if (status === 'closed') return false; // Filter out closed chats

        const name = (conv.userInfo?.fullName || '').toLowerCase();
        const email = (conv.userInfo?.email || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    const renderSupport = () => {
        const activeConv = conversations.find(c => c._id === selectedUserId);
        const selectedChatStatus = activeConv?.userInfo?.chatStatus || 'closed';
        const activeDisplayName = activeConv?.userInfo ? (activeConv.userInfo.fullName || activeConv.userInfo.email) : 'Khách vãng lai';

        return (
            <div className="space-y-6 font-sans">
                {/* Real-time Support Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Hỗ trợ Trực Tuyến</h3>
                        <p className="text-xs text-gray-500 mt-1">Quản lý và phản hồi yêu cầu hỗ trợ từ khách hàng theo thời gian thực</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 md:mt-0 text-xs bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-gray-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Đang kết nối</span>
                        <span className="text-gray-300">|</span>
                        <span>Tư cách: <b>{dataUser?.fullName || 'Nhân Viên BH'} (Nhân viên)</b></span>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Waiting Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-extrabold text-gray-900">{chatStats.waiting || 0}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Đang chờ</p>
                            </div>
                        </div>
                    </div>

                    {/* Chatting Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-extrabold text-gray-900">{chatStats.chatting || 0}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Đang chat</p>
                            </div>
                        </div>
                    </div>

                    {/* Closed Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-extrabold text-gray-900">{chatStats.closed || 0}</h4>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Đã đóng</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Workspace */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex h-[620px] gap-6">
                    {/* Left Conversations column */}
                    <div className="w-1/3 border-r border-gray-150 pr-4 flex flex-col h-full">
                        {/* Search Bar */}
                        <div className="relative mb-4 shrink-0">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input 
                                type="text"
                                placeholder="Tìm khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black"
                            />
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto space-y-3.5">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                                    Không tìm thấy cuộc hội thoại nào.
                                </div>
                            ) : (
                                filteredConversations.map(conv => {
                                    const isSelected = conv._id === selectedUserId;
                                    const hasUnread = conv.unreadCount > 0;
                                    const displayName = conv.userInfo ? (conv.userInfo.fullName || conv.userInfo.email) : 'Khách vãng lai';
                                    const status = conv.userInfo?.chatStatus || 'closed';
                                    
                                    // Avatar initials
                                    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                    return (
                                        <div
                                            key={conv._id}
                                            onClick={() => setSelectedUserId(conv._id)}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border flex flex-col ${
                                                isSelected 
                                                    ? 'bg-amber-50/50 border-amber-200' 
                                                    : 'hover:bg-gray-50 bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm text-gray-900 block">{displayName}</span>
                                                        {status === 'waiting' && (
                                                            <span className="text-amber-500 font-semibold text-[11px]">Đang chờ hỗ trợ</span>
                                                        )}
                                                        {status === 'chatting' && (
                                                            <span className="text-green-600 font-semibold text-[11px]">Đang hỗ trợ</span>
                                                        )}
                                                        {status === 'closed' && (
                                                            <span className="text-gray-400 text-[11px]">Đã đóng</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {hasUnread && !isSelected && (
                                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Accept Button inside Card if Waiting */}
                                            {status === 'waiting' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAcceptChat(conv._id);
                                                    }}
                                                    className="w-full mt-3 bg-[#10b981] hover:bg-[#059669] text-white py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer shadow-sm"
                                                >
                                                    Chấp nhận
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Chat details column */}
                    <div className="flex-1 flex flex-col h-full">
                        {selectedUserId ? (
                            <>
                                {/* Chat Header */}
                                <div className="pb-3 border-b border-gray-250 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                                            {activeDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-base">{activeDisplayName}</h4>
                                            {selectedChatStatus === 'waiting' && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                    <span className="text-xs text-amber-500 font-medium">Đang chờ</span>
                                                </div>
                                            )}
                                            {selectedChatStatus === 'chatting' && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    <span className="text-xs text-green-500 font-medium">Đang hoạt động</span>
                                                </div>
                                            )}
                                            {selectedChatStatus === 'closed' && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                    <span className="text-xs text-gray-400 font-medium">Đã đóng</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons on top right */}
                                    <div className="flex gap-2">
                                        {selectedChatStatus === 'waiting' && (
                                            <button
                                                onClick={() => handleAcceptChat(selectedUserId)}
                                                className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm transition-all"
                                            >
                                                Chấp nhận hỗ trợ
                                            </button>
                                        )}
                                        {selectedChatStatus === 'chatting' && (
                                            <button
                                                onClick={() => handleCloseChat(selectedUserId)}
                                                className="bg-red-500 hover:bg-red-650 text-white px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer shadow-sm transition-all"
                                            >
                                                Đóng hỗ trợ
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Message Logs */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-2xl my-4 space-y-4">
                                    {chatMessages.map(msg => {
                                        const isFromAdmin = msg.senderId !== msg.userId;
                                        
                                        if (isFromAdmin) {
                                            // Admin message: styled yellow banner text bubble to match screenshot
                                            return (
                                                <div key={msg._id} className="flex flex-col items-start w-full">
                                                    <div className="bg-[#fffbeb] border border-[#fde68a] text-yellow-950 p-4 rounded-xl text-sm leading-relaxed max-w-[85%] w-fit self-start flex flex-col shadow-sm">
                                                        <span className="font-extrabold text-[10px] text-amber-700 uppercase tracking-wider mb-1 block">
                                                            SNEAKERHUB AI
                                                        </span>
                                                        <span>{msg.content}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        } else {
                                            // Customer message: standard left bubble with initials avatar next to it
                                            const senderName = activeDisplayName;
                                            const customerInitials = senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                            return (
                                                <div key={msg._id} className="flex gap-3 items-start w-full">
                                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                                        {customerInitials}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-xs text-gray-700">{senderName}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white border border-gray-200 text-gray-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-sm shadow-sm mt-1 max-w-[75%] w-fit">
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                    <div ref={adminChatEndRef} />
                                </div>

                                {/* Chat Input Box */}
                                <div className="shrink-0 flex flex-col gap-2">
                                    <span className="text-xs text-gray-500 font-semibold px-1">
                                        Trả lời với tư cách: <span className="text-blue-600">Nhân Viên BH</span> (Nhân viên)
                                    </span>
                                    <form onSubmit={handleSendReply} className="flex gap-3 items-center">
                                        {/* Paperclip Icon for image attachments mockup */}
                                        <div className="flex gap-1">
                                            <Paperclip className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={
                                                selectedChatStatus === 'waiting'
                                                    ? "Chấp nhận để bắt đầu trả lời..."
                                                    : selectedChatStatus === 'closed'
                                                    ? "Cuộc trò chuyện đã đóng."
                                                    : "Nhập tin nhắn..."
                                            }
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            disabled={selectedChatStatus !== 'chatting'}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-400"
                                        />
                                        <button
                                            type="submit"
                                            disabled={selectedChatStatus !== 'chatting' || !replyText.trim()}
                                            className="bg-[#f43f5e] hover:bg-[#e11d48] text-white w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0 shadow-md"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-3">
                                <MessageSquare className="text-5xl opacity-40 text-gray-300" />
                                <p className="font-bold text-gray-700 text-base">Chưa chọn cuộc hội thoại</p>
                                <p className="text-xs max-w-sm">Nhấp vào một cuộc hội thoại ở danh sách bên trái để bắt đầu chat tư vấn khách hàng.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 text-gray-900 min-h-screen flex font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col justify-between shrink-0">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2 py-4 mb-6">
                        <span className="text-xl font-extrabold tracking-wider text-black">
                            SNEAKERHUB
                        </span>
                        <Tag className="border-none font-bold text-xs bg-gray-100 text-gray-800">ADMIN</Tag>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-1">
                        {menuItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => setActiveTab(item.key)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-black text-white font-semibold' 
                                            : 'text-gray-650 hover:bg-gray-100 hover:text-black'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Admin info */}
                <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold text-white text-sm shadow-sm">
                            TH
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Thanh Huy</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    </div>
                    <Button 
                        type="text" 
                        danger 
                        icon={<LogOut className="w-4 h-4 inline mr-2" />}
                        onClick={() => navigate('/')}
                        className="text-left w-full hover:bg-red-50 flex items-center text-gray-650 border-none justify-start px-2"
                    >
                        Quay lại Store
                    </Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-x-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-900 capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Search input placeholder */}
                        <div className="relative hidden md:block">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input 
                                type="text"
                                placeholder="Tìm kiếm nhanh..."
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black w-60"
                            />
                        </div>
                        
                        {/* Notifications */}
                        <Popover
                            content={
                                <div className="w-80 max-h-96 overflow-y-auto divide-y divide-gray-150">
                                    <div className="flex justify-between items-center pb-2.5">
                                        <span className="font-bold text-sm text-gray-800">Thông báo ({notifications.filter(n => !n.read).length})</span>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={() => {
                                                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                    message.success('Đã đánh dấu tất cả là đã đọc');
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 transition font-semibold bg-transparent border-none cursor-pointer"
                                            >
                                                Đọc tất cả
                                            </button>
                                        )}
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        {notifications.length === 0 ? (
                                            <p className="text-xs text-gray-400 py-6 text-center font-medium">Không có thông báo mới nào</p>
                                        ) : (
                                            notifications.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => {
                                                        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                                                        setActiveTab('orders');
                                                        setNotificationVisible(false);
                                                    }}
                                                    className={`p-2.5 rounded-lg text-xs transition cursor-pointer ${
                                                        item.read ? 'bg-white hover:bg-gray-50 text-gray-655 border border-gray-100' : 'bg-blue-50/50 hover:bg-blue-50 text-gray-900 font-semibold border border-blue-100'
                                                    }`}
                                                >
                                                    <p className="line-clamp-2">{item.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-normal">
                                                        {new Date(item.time).toLocaleTimeString('vi-VN')}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            }
                            title={null}
                            trigger="click"
                            open={notificationVisible}
                            onOpenChange={setNotificationVisible}
                            placement="bottomRight"
                            overlayClassName="rounded-xl overflow-hidden shadow-xl border border-gray-100"
                        >
                            <div className="relative cursor-pointer text-gray-500 hover:text-black">
                                <Badge dot={notifications.some(n => !n.read)} offset={[-2, 2]}>
                                    <Bell className="w-5 h-5" />
                                </Badge>
                            </div>
                        </Popover>

                        {/* Language indicator */}
                        <div className="flex items-center gap-1 cursor-pointer text-gray-500 hover:text-black text-sm">
                            <span>🇻🇳</span>
                            <span className="font-medium">VI</span>
                        </div>
                    </div>
                </header>

                <main className="p-6 flex-1 overflow-y-auto space-y-6">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'products' && renderProducts()}
                    {activeTab === 'categories' && renderCategories()}
                    {activeTab === 'orders' && renderOrders()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'coupons' && renderCoupons()}
                    {activeTab === 'support' && renderSupport()}
                    {activeTab === 'revenue' && renderRevenue()}
                    {activeTab === 'settings' && renderSettings()}
                </main>
            </div>

            {/* ========================================================
                PRODUCT MODAL (ADD / EDIT)
            ======================================================== */}
            <Modal
                title={editingProduct ? 'Chỉnh sửa thông tin giày' : 'Thêm giày thể thao mới'}
                open={productModalVisible}
                onCancel={() => setProductModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Form
                    form={productForm}
                    layout="vertical"
                    onFinish={handleProductSubmit}
                    className="mt-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="nameProduct"
                            label="Tên giày"
                            rules={[{ required: true, message: 'Vui lòng nhập tên giày!' }]}
                        >
                            <Input placeholder="Ví dụ: Giày Nike Air Force 1..." />
                        </Form.Item>

                        <Form.Item
                            name="categoryProduct"
                            label="Thương hiệu"
                            rules={[{ required: true, message: 'Vui lòng chọn thương hiệu!' }]}
                        >
                            <Select placeholder="Chọn thương hiệu...">
                                {categories.map(cat => (
                                    <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="priceProduct"
                            label="Đơn giá (VNĐ)"
                            rules={[{ required: true, message: 'Vui lòng nhập đơn giá!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 1200000" />
                        </Form.Item>

                        <Form.Item
                            name="discountProduct"
                            label="Khuyến mãi (%)"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="Ví dụ: 10" />
                        </Form.Item>

                        <Form.Item
                            name="stockProduct"
                            label="Số lượng trong kho (Đôi)"
                            rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn kho!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 50" />
                        </Form.Item>

                        <Form.Item
                            name="author"
                            label="Màu sắc"
                        >
                            <Input placeholder="Ví dụ: White/Black" />
                        </Form.Item>

                        <Form.Item
                            name="publisher"
                            label="Chất liệu"
                        >
                            <Input placeholder="Ví dụ: Leather/Rubber" />
                        </Form.Item>

                        <Form.Item
                            name="size"
                            label="Kích cỡ (Sizes - phân tách bằng dấu phẩy)"
                        >
                            <Input placeholder="Ví dụ: 38, 39, 40, 41, 42" />
                        </Form.Item>

                        <Form.Item name="coverType" label="Tình trạng giày">
                            <Select placeholder="Chọn tình trạng...">
                                <Option value="Mới 100% (Fullbox)">Mới 100% (Fullbox)</Option>
                                <Option value="Hàng chính hãng">Hàng chính hãng</Option>
                                <Option value="Hàng trưng bày">Hàng trưng bày</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="descriptionProduct"
                        label="Mô tả tóm tắt sản phẩm"
                        rules={[{ required: true, message: 'Vui lòng viết mô tả giày!' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Viết mô tả ngắn về mẫu giày..." />
                    </Form.Item>

                    <Form.Item label="Hình ảnh sản phẩm (Tải lên tối đa 5 ảnh, định dạng JPG/PNG, dung lượng < 5MB)">
                        <Upload
                            listType="picture-card"
                            fileList={productFileList}
                            beforeUpload={handleBeforeUploadProduct}
                            onChange={handleProductUploadChange}
                            multiple
                            maxCount={5}
                        >
                            {productFileList.length < 5 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        name="imageUrlsProduct"
                        label="Hoặc dán URL các ảnh sản phẩm (ngăn cách bằng dấu phẩy nếu có nhiều ảnh)"
                    >
                        <Input.TextArea rows={2} placeholder="Ví dụ: https://res.cloudinary.com/image1.png, https://res.cloudinary.com/image2.png" />
                    </Form.Item>

                    <Divider />

                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setProductModalVisible(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submittingProduct}
                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                        >
                            Lưu thông tin
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* ========================================================
                CATEGORY MODAL (ADD / EDIT)
            ======================================================== */}
            <Modal
                title={editingCategory ? 'Chỉnh sửa thương hiệu' : 'Tạo thương hiệu giày mới'}
                open={categoryModalVisible}
                onCancel={() => setCategoryModalVisible(false)}
                footer={null}
                width={500}
                destroyOnClose
            >
                <Form
                    form={categoryForm}
                    layout="vertical"
                    onFinish={handleCategorySubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="nameCategory"
                        label="Tên thương hiệu"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thương hiệu!' }]}
                    >
                        <Input placeholder="Ví dụ: Nike, Adidas, Puma..." />
                    </Form.Item>

                    <Form.Item label="Ảnh đại diện danh mục (Chọn 1 ảnh JPG/PNG, dung lượng < 5MB)">
                        <Upload
                            listType="picture-card"
                            fileList={categoryFileList}
                            beforeUpload={handleBeforeUploadCategory}
                            onChange={handleCategoryUploadChange}
                            maxCount={1}
                        >
                            {categoryFileList.length < 1 && (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        name="imageUrlCategory"
                        label="Hoặc dán URL ảnh thương hiệu trực tiếp"
                    >
                        <Input placeholder="Ví dụ: https://res.cloudinary.com/brand_logo.png" />
                    </Form.Item>

                    <Divider />

                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setCategoryModalVisible(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submittingCategory}
                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                        >
                            Lưu danh mục
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* ========================================================
                ORDER DETAIL MODAL
            ======================================================== */}
            <Modal
                title={<span className="text-xl font-bold">Chi tiết đơn đặt hàng</span>}
                open={orderDetailVisible}
                onCancel={() => setOrderDetailVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setOrderDetailVisible(false)} className="bg-green-600 border-none hover:bg-green-700">
                        Đóng lại
                    </Button>
                ]}
                width={700}
                destroyOnClose
            >
                {selectedOrder && (
                    <div className="space-y-6 mt-4">
                        {/* Order Metadata */}
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Mã đơn hàng" span={2}>
                                <span className="font-mono font-bold text-gray-700">{selectedOrder._id}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Người nhận">
                                {selectedOrder.fullName || selectedOrder.userId?.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {selectedOrder.email || selectedOrder.userId?.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {selectedOrder.phoneNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                                <Tag color="blue">{selectedOrder.paymentMethod.toUpperCase()}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ giao nhận" span={2}>
                                {selectedOrder.address}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-lg font-bold mb-3">Sản phẩm đã đặt</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="p-3 font-semibold text-gray-600 text-sm">Hình ảnh</th>
                                            <th className="p-3 font-semibold text-gray-600 text-sm">Tên giày</th>
                                            <th className="p-3 font-semibold text-gray-600 text-sm text-right">Đơn giá</th>
                                            <th className="p-3 font-semibold text-gray-600 text-sm text-center">SL</th>
                                            <th className="p-3 font-semibold text-gray-600 text-sm text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.products?.map((item, idx) => {
                                            const pPrice = item.productId?.priceProduct - (item.productId?.priceProduct * (item.productId?.discountProduct || 0)) / 100 || 0;
                                            const pTotal = pPrice * item.quantity;
                                            return (
                                                <tr key={idx} className="border-b hover:bg-gray-50/50">
                                                    <td className="p-3">
                                                        <img
                                                            src={item.productId?.imagesProduct?.[0] || 'https://via.placeholder.com/40x50'}
                                                            alt="giày"
                                                            className="w-10 h-12 object-cover rounded shadow-sm"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-800 text-sm">
                                                        {item.productId?.nameProduct || 'Sản phẩm đã bị xóa'}
                                                    </td>
                                                    <td className="p-3 text-right text-sm">
                                                        {formatPrice(pPrice)}
                                                    </td>
                                                    <td className="p-3 text-center text-sm font-semibold">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-900 text-sm">
                                                        {formatPrice(pTotal)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary Prices */}
                        <div className="flex flex-col items-end gap-1.5 pr-2">
                            <p className="text-gray-500 text-sm">Tạm tính: <span className="font-semibold text-gray-800">{formatPrice(selectedOrder.totalPrice)}</span></p>
                            {selectedOrder.couponId && (
                                <p className="text-green-600 text-sm">Khuyến mãi: <span className="font-semibold">-{formatPrice(selectedOrder.totalPrice - selectedOrder.finalPrice)}</span></p>
                            )}
                            <Divider className="my-1.5" />
                            <p className="text-lg font-bold text-red-600">Tổng cộng: <span>{formatPrice(selectedOrder.finalPrice || selectedOrder.totalPrice)}</span></p>
                        </div>
                    </div>
                )}
            </Modal>
            {/* ========================================================
                COUPON MODAL (ADD / EDIT)
            ======================================================== */}
            <Modal
                title={editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
                open={couponModalVisible}
                onCancel={() => setCouponModalVisible(false)}
                footer={null}
                width={500}
                destroyOnClose
            >
                <Form
                    form={couponForm}
                    layout="vertical"
                    onFinish={handleCouponSubmit}
                    className="mt-4"
                >
                    <Form.Item
                        name="nameCoupon"
                        label="Mã giảm giá"
                        rules={[{ required: true, message: 'Vui lòng nhập mã giảm giá!' }]}
                    >
                        <Input placeholder="Ví dụ: SALE10, SNEAKERNEW" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="discount"
                            label="Mức giảm giá (%)"
                            rules={[{ required: true, message: 'Vui lòng nhập mức giảm!' }]}
                        >
                            <InputNumber min={1} max={100} className="w-full" placeholder="Ví dụ: 10" />
                        </Form.Item>

                        <Form.Item
                            name="quantity"
                            label="Số lượng"
                            rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                        >
                            <InputNumber min={1} className="w-full" placeholder="Ví dụ: 100" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="minPrice"
                        label="Giá trị đơn hàng tối thiểu (đ)"
                        rules={[{ required: true, message: 'Vui lòng nhập đơn hàng tối thiểu!' }]}
                    >
                        <InputNumber min={0} className="w-full" placeholder="Ví dụ: 1000000" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="startDate"
                            label="Ngày bắt đầu"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                        >
                            <Input type="date" className="w-full" />
                        </Form.Item>

                        <Form.Item
                            name="endDate"
                            label="Ngày kết thúc"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
                        >
                            <Input type="date" className="w-full" />
                        </Form.Item>
                    </div>

                    <Form.Item className="mb-0 flex justify-end gap-2">
                        <Space>
                            <Button onClick={() => setCouponModalVisible(false)}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submittingCoupon} className="bg-black text-white hover:bg-gray-800 border-none">
                                {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default AdminDashboard;
