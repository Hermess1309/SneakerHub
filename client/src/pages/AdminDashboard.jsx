import React, { useState, useEffect, useRef } from 'react';
import {
    Tabs, Table, Button, Input, Select, Modal, Upload, Popconfirm, Form,
    InputNumber, Tag, message, Descriptions, Divider, Space, Popover, Badge, DatePicker
} from 'antd';
import {
    EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
    AppstoreOutlined, ShoppingOutlined, UserOutlined, WarningOutlined,
    PrinterOutlined, ReloadOutlined, ThunderboltOutlined, FireOutlined,
    CheckOutlined, CloseOutlined, CopyOutlined, DownloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { listProduct, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../config/ProductRequest';
import { listCategory, createCategory, updateCategory, deleteCategory, uploadCategoryImage } from '../config/CategoryRequest';
import { requestPaymentsAdmin, requestUpdatePaymentStatus } from '../config/paymentRequest';
import { requestUsersAdmin, requestDeleteUserAdmin, requestUpdateRole, requestGetStaffReport } from '../config/UserRequest';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../config/CounponRequest';
import { listAllComplaints, respondToComplaint } from '../config/ComplaintRequest';
import { getFlashSaleConfig, setFlashSaleConfig as requestSetFlashSaleConfig } from '../config/FlashSaleRequest';

// Lucide & Recharts imports for premium Dashboard theme
import { 
    LayoutDashboard, ShoppingBag, FolderHeart, ShoppingCart, Users as UsersIcon,
    Settings as SettingsIcon, Bell, LogOut, Search as SearchIcon,
    DollarSign, Layers, LineChart, MessageSquare, Clock, CheckCircle, XCircle, Image, Paperclip, Send, Download,
    TrendingUp, CreditCard, Award, Calendar
} from 'lucide-react';
import OrderPrintModal from '../components/admin/OrderPrintModal';
import OrderDetailView from '../components/admin/OrderDetailView';
import codLogo from '../assets/images/payment-cod.png';
import momoLogo from '../assets/images/payment-momo.png';
import vnpayLogo from '../assets/images/payment-vnpay.png';
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
    const [searchOrderKeyword, setSearchOrderKeyword] = useState('');
    const [searchFieldType, setSearchFieldType] = useState('all');
    const [shippingFilter, setShippingFilter] = useState('all');
    const [dateFilterRange, setDateFilterRange] = useState('all');
    const [selectedOrderKeys, setSelectedOrderKeys] = useState([]);
    const [batchAction, setBatchAction] = useState('none');
    const [isApplyingBatch, setIsApplyingBatch] = useState(false);
    const [orderDetailVisible, setOrderDetailVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderViewMode, setOrderViewMode] = useState('list'); // 'list' or 'detail'
    const [printModalVisible, setPrintModalVisible] = useState(false);
    const [ordersToPrint, setOrdersToPrint] = useState([]);
    const [printedOrderIds, setPrintedOrderIds] = useState(() => {
        try {
            const saved = localStorage.getItem('sneakerhub_printed_orders');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const handlePrintSuccess = (printedIds) => {
        const next = Array.from(new Set([...printedOrderIds, ...printedIds]));
        setPrintedOrderIds(next);
        try {
            localStorage.setItem('sneakerhub_printed_orders', JSON.stringify(next));
        } catch {}
        message.success(`Đã chuẩn bị bản in cho ${printedIds.length} đơn hàng!`);
    };

    const handleOpenPrintForOrder = (order) => {
        setOrdersToPrint([order]);
        setPrintModalVisible(true);
    };

    const handleOpenPrintBatch = () => {
        const selected = orders.filter(o => selectedOrderKeys.includes(o._id));
        if (!selected.length) {
            message.warning('Vui lòng tích chọn ít nhất 1 đơn hàng để in nhãn!');
            return;
        }
        setOrdersToPrint(selected);
        setPrintModalVisible(true);
    };

    const handleViewOrderDetail = (order) => {
        setSelectedOrder(order);
        setOrderViewMode('detail');
    };

    const handleBackToOrderList = () => {
        setOrderViewMode('list');
    };

    // Users states
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Staff management states
    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [staffReport, setStaffReport] = useState(null);
    const [loadingStaffReport, setLoadingStaffReport] = useState(false);

    // Coupons states
    const [coupons, setCoupons] = useState([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [couponModalVisible, setCouponModalVisible] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [couponForm] = Form.useForm();
    const [submittingCoupon, setSubmittingCoupon] = useState(false);

    // Inventory states
    const [editingStockId, setEditingStockId] = useState(null);
    const [tempStockValue, setTempStockValue] = useState(0);
    const [sizeModalVisible, setSizeModalVisible] = useState(false);
    const [selectedSizeProduct, setSelectedSizeProduct] = useState(null);
    const [sizeStockMap, setSizeStockMap] = useState({});
    const [newSizeName, setNewSizeName] = useState('');
    const [savingSizeStock, setSavingSizeStock] = useState(false);
    const [inventorySearch, setInventorySearch] = useState('');
    const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
    const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');

    // Complaints states
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [adminReplyText, setAdminReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Flash Sale states
    const [flashSaleForm] = Form.useForm();
    const [submittingFlashSale, setSubmittingFlashSale] = useState(false);
    const [flashSaleData, setFlashSaleData] = useState(null);
    const [flashSaleSearch, setFlashSaleSearch] = useState('');
    const [flashSaleCategoryFilter, setFlashSaleCategoryFilter] = useState('all');
    const [selectedSaleProductKeys, setSelectedSaleProductKeys] = useState([]);
    
    // Quick Add Product to Flash Sale modal state
    const [addSaleModalVisible, setAddSaleModalVisible] = useState(false);
    const [selectedProductsToAdd, setSelectedProductsToAdd] = useState([]);
    const [defaultDiscountToAdd, setDefaultDiscountToAdd] = useState(20);
    const [searchAddProduct, setSearchAddProduct] = useState('');
    const [brandAddProduct, setBrandAddProduct] = useState('all');
    const [isApplyingSale, setIsApplyingSale] = useState(false);

    // Bulk Discount Modal state
    const [bulkDiscountModalVisible, setBulkDiscountModalVisible] = useState(false);
    const [bulkDiscountValue, setBulkDiscountValue] = useState(20);

    // Inline edit state
    const [editingDiscountId, setEditingDiscountId] = useState(null);
    const [tempDiscountValue, setTempDiscountValue] = useState(null);

    // Advanced search & filter states
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [couponSearch, setCouponSearch] = useState('');
    const [complaintStatusFilter, setComplaintStatusFilter] = useState('all');
    const [complaintSearch, setComplaintSearch] = useState('');
    const [revenueTimeRange, setRevenueTimeRange] = useState('all');
    const [revenueSearch, setRevenueSearch] = useState('');
    const [productSortOrder, setProductSortOrder] = useState('default');
    const [storeSettings, setStoreSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('sneakerhub_store_settings');
            return saved ? JSON.parse(saved) : {
                storeName: 'SneakerHub Việt Nam',
                hotline: '0899227066',
                email: 'cskh@sneakerhub.vn',
                address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                slogan: 'Nâng niu từng bước chân - Sneaker Chính Hãng & Đẳng Cấp',
                shippingFee: 30000,
                freeShippingThreshold: 1000000,
                returnDays: 7,
                warrantyMonths: 6,
                bankName: 'MB Bank (Quân Đội)',
                bankAccount: '0899227066',
                bankOwner: 'DOAN THANH HUY'
            };
        } catch {
            return {
                storeName: 'SneakerHub Việt Nam',
                hotline: '0899227066',
                email: 'cskh@sneakerhub.vn',
                address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                slogan: 'Nâng niu từng bước chân - Sneaker Chính Hãng & Đẳng Cấp',
                shippingFee: 30000,
                freeShippingThreshold: 1000000,
                returnDays: 7,
                warrantyMonths: 6,
                bankName: 'MB Bank (Quân Đội)',
                bankAccount: '0899227066',
                bankOwner: 'DOAN THANH HUY'
            };
        }
    });

    // Chat support states
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
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

    const fetchStaffList = async () => {
        try {
            const res = await requestUsersAdmin();
            const allUsers = res.metadata || [];
            const staffOnly = allUsers.filter(u => u.role === 'staff');
            setStaffList(staffOnly);
            if (staffOnly.length > 0 && !selectedStaffId) {
                setSelectedStaffId(staffOnly[0]._id);
            }
        } catch (error) {
            console.error('Error fetching staff list:', error);
            message.error('Không thể tải danh sách nhân viên');
        }
    };

    useEffect(() => {
        if (selectedStaffId && activeTab === 'staff-mgmt') {
            const fetchReport = async () => {
                setLoadingStaffReport(true);
                try {
                    const res = await requestGetStaffReport(selectedStaffId);
                    setStaffReport(res.metadata);
                } catch (error) {
                    console.error('Error fetching staff report:', error);
                    message.error('Không thể tải báo cáo nhân viên');
                } finally {
                    setLoadingStaffReport(false);
                }
            };
            fetchReport();
        }
    }, [selectedStaffId, activeTab]);

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

    // Fetch complaints
    const fetchComplaints = async () => {
        setLoadingComplaints(true);
        try {
            const res = await listAllComplaints();
            setComplaints(res.metadata || []);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            message.error('Không thể tải danh sách khiếu nại');
        } finally {
            setLoadingComplaints(false);
        }
    };

    // Fetch flash sale config
    const fetchFlashSale = async () => {
        try {
            const res = await getFlashSaleConfig();
            if (res.metadata) {
                setFlashSaleData(res.metadata);
                const values = {
                    title: res.metadata.title || '',
                    isActive: res.metadata.isActive !== undefined ? res.metadata.isActive : true
                };
                if (res.metadata.startTime) {
                    values.startTime = new Date(res.metadata.startTime).toISOString().slice(0, 16);
                } else {
                    values.startTime = new Date().toISOString().slice(0, 16);
                }
                if (res.metadata.endTime) {
                    values.endTime = new Date(res.metadata.endTime).toISOString().slice(0, 16);
                }
                flashSaleForm.setFieldsValue(values);
            }
        } catch (error) {
            console.error('Error fetching flash sale config:', error);
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
        } else if (activeTab === 'staff-mgmt') {
            fetchStaffList();
        } else if (activeTab === 'coupons') {
            fetchCoupons();
        } else if (activeTab === 'support') {
            fetchConversations();
            fetchChatStats();
        } else if (activeTab === 'inventory') {
            fetchProducts();
        } else if (activeTab === 'complaints') {
            fetchComplaints();
        } else if (activeTab === 'flash-sale') {
            fetchFlashSale();
            fetchProducts();
            fetchCategories();
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
            categoryProduct: record.categoryProduct?._id || record.categoryProduct,
            priceProduct: record.priceProduct,
            costPrice: record.costPrice || Math.round((record.priceProduct || 0) * 0.6),
            discountProduct: record.discountProduct,
            stockProduct: record.stockProduct,
            descriptionProduct: record.descriptionProduct,
            sku: record.metadata?.sku || record.metadata?.author || '',
            colorway: record.metadata?.colorway || record.metadata?.author || '',
            material: record.metadata?.material || record.metadata?.publisher || '',
            gender: record.metadata?.gender || 'Unisex',
            size: record.metadata?.size || '38, 39, 40, 41, 42, 43',
            condition: record.metadata?.condition || record.metadata?.coverType || 'Mới 100% (Fullbox)',
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
        const isAllowedType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif';
        if (!isAllowedType) {
            message.error('Chỉ được tải lên ảnh định dạng JPG, PNG, WEBP hoặc GIF!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Dung lượng ảnh phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const handleCustomUploadProduct = async ({ file, onSuccess, onError, onProgress }) => {
        try {
            const res = await uploadProductImage(file, onProgress);
            const uploadedUrl = res.metadata?.url;
            onSuccess({ url: uploadedUrl }, file);
            message.success('Đã tự động tải ảnh lên Cloudinary thành công!');
        } catch (err) {
            onError(err);
            message.error(err.response?.data?.message || 'Tải ảnh lên Cloudinary thất bại!');
        }
    };

    const handleProductUploadChange = ({ fileList: newFileList }) => {
        if (newFileList.length > 5) {
            message.warning('Tối đa chỉ được tải lên 5 hình ảnh!');
            setProductFileList(newFileList.slice(0, 5));
        } else {
            const updated = newFileList.map(f => {
                if (f.response && f.response.url) {
                    return { ...f, url: f.response.url };
                }
                return f;
            });
            setProductFileList(updated);
        }
    };

    const handleProductSubmit = async (values) => {
        if (submittingProduct) return;

        // Check if any file is still uploading
        const isStillUploading = productFileList.some(f => f.status === 'uploading');
        if (isStillUploading) {
            message.warning('Ảnh đang được tự động tải lên Cloudinary, vui lòng chờ trong giây lát!');
            return;
        }

        setSubmittingProduct(true);
        try {
            const formData = new FormData();
            formData.append('nameProduct', values.nameProduct);
            formData.append('priceProduct', values.priceProduct);
            formData.append('costPrice', values.costPrice !== undefined ? values.costPrice : 0);
            formData.append('discountProduct', values.discountProduct !== undefined ? values.discountProduct : 0);
            formData.append('stockProduct', values.stockProduct !== undefined ? values.stockProduct : 0);
            formData.append('descriptionProduct', values.descriptionProduct);
            formData.append('categoryProduct', values.categoryProduct);
            
            // Build metadata
            const metadataObj = {
                ...(editingProduct?.metadata || {}),
                sku: values.sku || values.author || '',
                colorway: values.colorway || values.author || '',
                author: values.colorway || values.author || '',
                material: values.material || values.publisher || '',
                publisher: values.material || values.publisher || '',
                gender: values.gender || 'Unisex',
                condition: values.condition || values.coverType || 'Mới 100% (Fullbox)',
                coverType: values.condition || values.coverType || 'Mới 100% (Fullbox)',
                size: values.size || '',
            };
            formData.append('metadata', JSON.stringify(metadataObj));

            // Extract manual URL entries
            const manualUrls = values.imageUrlsProduct 
                ? values.imageUrlsProduct.split(',').map(url => url.trim()).filter(Boolean)
                : [];

            // Extract successfully uploaded Cloudinary URLs & existing URLs
            const uploadedUrls = [];
            productFileList.forEach(file => {
                const url = file.response?.url || file.url;
                if (url) {
                    uploadedUrls.push(url);
                } else if (file.originFileObj) {
                    // Fallback for raw files
                    formData.append('imagesProduct', file.originFileObj);
                }
            });

            // Merge all image URLs
            const allImageUrls = [...new Set([...uploadedUrls, ...manualUrls])];

            if (editingProduct) {
                formData.append('oldImagesProduct', JSON.stringify(allImageUrls));
                await updateProduct(editingProduct._id, formData);
                message.success('Cập nhật sản phẩm thành công!');
            } else {
                if (allImageUrls.length === 0 && !formData.has('imagesProduct')) {
                    message.error('Vui lòng chọn ảnh hoặc dán URL ảnh sản phẩm!');
                    setSubmittingProduct(false);
                    return;
                }
                if (allImageUrls.length > 0) {
                    formData.append('imagesProduct', JSON.stringify(allImageUrls));
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
        const isAllowed = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml';
        if (!isAllowed) {
            message.error('Chỉ được tải lên ảnh định dạng JPG, PNG, WEBP hoặc SVG!');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Dung lượng ảnh phải nhỏ hơn 5MB!');
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const handleCustomUploadCategory = async ({ file, onSuccess, onError, onProgress }) => {
        try {
            const res = await uploadCategoryImage(file, onProgress);
            const uploadedUrl = res.metadata?.url;
            onSuccess({ url: uploadedUrl }, file);
            message.success('Đã tự động tải logo lên Cloudinary thành công!');
        } catch (err) {
            onError(err);
            message.error(err.response?.data?.message || 'Tải logo lên Cloudinary thất bại!');
        }
    };

    const handleCategoryUploadChange = ({ fileList: newFileList }) => {
        const updated = newFileList.slice(-1).map(f => {
            if (f.response && f.response.url) {
                return { ...f, url: f.response.url };
            }
            return f;
        });
        setCategoryFileList(updated);
    };

    const handleCategorySubmit = async (values) => {
        if (submittingCategory) return;

        const isStillUploading = categoryFileList.some(f => f.status === 'uploading');
        if (isStillUploading) {
            message.warning('Logo đang được tải lên Cloudinary, vui lòng chờ trong giây lát!');
            return;
        }

        setSubmittingCategory(true);
        try {
            const formData = new FormData();
            formData.append('nameCategory', values.nameCategory.trim());

            const readyUrl = categoryFileList[0]?.response?.url || categoryFileList[0]?.url || values.imageUrlCategory?.trim();
            if (readyUrl) {
                formData.append('imageCategory', readyUrl);
            } else if (categoryFileList[0]?.originFileObj) {
                formData.append('imageCategory', categoryFileList[0].originFileObj);
            }

            if (!readyUrl && !categoryFileList[0]?.originFileObj) {
                message.error('Vui lòng chọn ảnh logo thương hiệu!');
                setSubmittingCategory(false);
                return;
            }

            if (editingCategory) {
                await updateCategory(editingCategory._id, formData);
                message.success('Cập nhật thương hiệu thành công!');
            } else {
                await createCategory(formData);
                message.success('Tạo thương hiệu thành công!');
            }
            setCategoryModalVisible(false);
            fetchCategories();
        } catch (error) {
            console.error('Error submitting category:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thương hiệu');
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
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
        }
    };

    const handleUpdateOrderNote = async (orderId, note) => {
        try {
            await requestUpdatePaymentStatus(orderId, undefined, note);
            if (selectedOrder && selectedOrder._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, internalNote: note }));
            }
            fetchOrders();
        } catch (error) {
            console.error('Error updating order note:', error);
            throw error;
        }
    };

    const openOrderDetailModal = (record) => {
        setSelectedOrder(record);
        setOrderDetailVisible(true);
    };

    const handleBatchConfirmOrders = async () => {
        if (!selectedOrderKeys.length) {
            message.warning('Vui lòng tích chọn ít nhất một đơn hàng để xác nhận.');
            return;
        }
        const pendingSelected = orders.filter(o => selectedOrderKeys.includes(o._id) && o.status === 'pending');
        if (!pendingSelected.length) {
            message.info('Tất cả các đơn đã chọn đều đã được xác nhận từ trước.');
            return;
        }
        setIsApplyingBatch(true);
        try {
            for (const order of pendingSelected) {
                await requestUpdatePaymentStatus(order._id, 'confirmed');
            }
            message.success(`Đã xác nhận thành công ${pendingSelected.length} đơn hàng!`);
            setSelectedOrderKeys([]);
            fetchOrders();
        } catch (error) {
            console.error('Error batch confirming orders:', error);
            message.error('Có lỗi xảy ra khi xác nhận đơn hàng.');
        } finally {
            setIsApplyingBatch(false);
        }
    };

    const handleBatchAction = async () => {
        if (!selectedOrderKeys.length) {
            message.warning('Vui lòng chọn ít nhất một đơn hàng để thực hiện tác vụ.');
            return;
        }
        if (batchAction === 'none') {
            message.warning('Vui lòng chọn một tác vụ hợp lệ.');
            return;
        }

        setIsApplyingBatch(true);
        try {
            for (const id of selectedOrderKeys) {
                await requestUpdatePaymentStatus(id, batchAction);
            }
            message.success(`Đã cập nhật trạng thái cho ${selectedOrderKeys.length} đơn hàng!`);
            setSelectedOrderKeys([]);
            setBatchAction('none');
            fetchOrders();
        } catch (error) {
            console.error('Error applying batch action:', error);
            message.error('Có lỗi xảy ra khi cập nhật một số đơn hàng.');
        } finally {
            setIsApplyingBatch(false);
        }
    };

    const handleExportOrders = () => {
        if (!filteredOrders.length) {
            message.warning('Không có đơn hàng nào để xuất file.');
            return;
        }

        const headers = [
            'Mã đơn hàng',
            'Khách hàng',
            'Số điện thoại',
            'Địa chỉ',
            'Sản phẩm',
            'Tổng giá trị đơn (VND)',
            'Hình thức thanh toán',
            'Trạng thái thanh toán',
            'Khách hàng phải trả (VND)',
            'Trạng thái đơn hàng',
            'Ngày đặt'
        ];

        const rows = filteredOrders.map(o => {
            const prodList = (o.products || []).map(p => `${p.productId?.nameProduct || 'Sản phẩm'} (x${p.quantity})`).join('; ');
            const isPaid = (o.paymentMethod && o.paymentMethod.toLowerCase() !== 'cod') || o.status === 'completed';
            const customerToPay = isPaid ? 0 : (o.finalPrice || o.totalPrice || 0);
            const statusMap = {
                pending: 'Chờ xác nhận',
                confirmed: 'Đang chuẩn bị',
                delivered: 'Đang vận chuyển',
                completed: 'Hoàn tất',
                cancelled: 'Đã hủy'
            };
            const methodMap = {
                cod: 'Thu tiền tận nơi - COD',
                vnpay: 'VNPAY',
                momo: 'MoMo',
                bank: 'Chuyển khoản'
            };
            return [
                `"${o._id}"`,
                `"${(o.fullName || o.userId?.fullName || '').replace(/"/g, '""')}"`,
                `"${o.phoneNumber || ''}"`,
                `"${(o.address || '').replace(/"/g, '""')}"`,
                `"${prodList.replace(/"/g, '""')}"`,
                o.finalPrice || o.totalPrice || 0,
                `"${methodMap[o.paymentMethod] || o.paymentMethod || 'COD'}"`,
                `"${isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}"`,
                customerToPay,
                `"${statusMap[o.status] || o.status}"`,
                `"${new Date(o.createdAt).toLocaleString('vi-VN')}"`
            ];
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('Xuất file danh sách đơn hàng thành công!');
    };

    const handleCloneProduct = (record) => {
        setEditingProduct(null);
        productForm.setFieldsValue({
            nameProduct: `${record.nameProduct} (Bản sao)`,
            categoryProduct: record.categoryProduct?._id || record.categoryProduct,
            priceProduct: record.priceProduct,
            costPrice: record.costPrice || Math.round((record.priceProduct || 0) * 0.6),
            discountProduct: 0,
            stockProduct: record.stockProduct || 10,
            descriptionProduct: record.descriptionProduct,
            sku: `${record.metadata?.sku || record._id.slice(-6).toUpperCase()}-COPY`,
            colorway: record.metadata?.colorway || record.metadata?.author || '',
            material: record.metadata?.material || record.metadata?.publisher || '',
            gender: record.metadata?.gender || 'Unisex',
            size: record.metadata?.size || '38, 39, 40, 41, 42, 43',
            condition: record.metadata?.condition || 'Mới 100% (Fullbox)',
            imageUrlsProduct: record.imagesProduct ? record.imagesProduct.join(', ') : '',
        });
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
        message.info('Đã nhân bản thông tin mẫu giày! Bạn có thể chỉnh sửa lại phối màu hoặc ảnh rồi bấm Lưu.');
    };

    const handleExportProductsCSV = () => {
        if (!products.length) {
            message.warning('Không có sản phẩm nào để xuất file!');
            return;
        }
        const headers = ['Mã sản phẩm', 'Mã SKU', 'Tên giày', 'Thương hiệu', 'Giá bán niêm yết', 'Giá vốn nhập hàng', 'Khuyến mãi (%)', 'Tồn kho (Đôi)', 'Phối màu', 'Kích cỡ', 'Tình trạng'];
        const rows = products.map(p => {
            const cat = categories.find(c => c._id === (p.categoryProduct?._id || p.categoryProduct));
            return [
                `"${p._id}"`,
                `"${p.metadata?.sku || p.metadata?.author || p._id.slice(-6).toUpperCase()}"`,
                `"${(p.nameProduct || '').replace(/"/g, '""')}"`,
                `"${cat?.nameCategory || 'Chưa phân loại'}"`,
                p.priceProduct || 0,
                p.costPrice || Math.round((p.priceProduct || 0) * 0.6),
                p.discountProduct || 0,
                p.stockProduct || 0,
                `"${p.metadata?.colorway || p.metadata?.author || ''}"`,
                `"${p.metadata?.size || ''}"`,
                `"${p.metadata?.condition || 'Mới 100% (Fullbox)'}"`
            ];
        });
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `catalog_giay_sneakerhub_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('Đã xuất file catalog sản phẩm thành công!');
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
            width: 80,
            render: (images) => (
                <img
                    src={images?.[0] || 'https://via.placeholder.com/60x80'}
                    alt="giày"
                    className="w-12 h-12 object-cover rounded-lg shadow-2xs border bg-gray-50"
                />
            )
        },
        {
            title: 'Tên giày & Mã SKU',
            key: 'nameProduct',
            render: (_, record) => {
                const sku = record.metadata?.sku || record.metadata?.author || record._id.slice(-6).toUpperCase();
                return (
                    <div className="space-y-0.5">
                        <span className="font-bold text-gray-900 block text-xs line-clamp-1">{record.nameProduct}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                SKU: {sku}
                            </span>
                            {record.metadata?.gender && (
                                <span className="text-[11px] text-blue-600 font-medium">
                                    {record.metadata.gender}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Thương hiệu',
            dataIndex: 'categoryProduct',
            key: 'categoryProduct',
            width: 130,
            render: (category) => {
                const categoryObj = categories.find(c => c._id === (category?._id || category));
                return categoryObj ? <Tag color="blue" className="font-medium">{categoryObj.nameCategory}</Tag> : <Tag color="gray">Khác</Tag>;
            }
        },
        {
            title: 'Đơn giá & Giá vốn',
            key: 'pricing',
            width: 160,
            render: (_, record) => {
                const cost = Number(record.costPrice) || Math.round((Number(record.priceProduct) || 0) * 0.6);
                return (
                    <div>
                        <span className="text-gray-900 font-extrabold block text-xs">{formatPrice(record.priceProduct)}</span>
                        <span className="text-[11px] text-gray-500">
                            Giá vốn: <span className="font-medium text-gray-700">{formatPrice(cost)}</span>
                        </span>
                    </div>
                );
            }
        },
        {
            title: 'Giảm giá',
            dataIndex: 'discountProduct',
            key: 'discountProduct',
            width: 100,
            render: (discount) => (
                discount > 0 ? <Tag color="red" className="font-bold">-{Math.round(discount)}%</Tag> : <span className="text-gray-400">-</span>
            )
        },
        {
            title: 'Tồn kho',
            dataIndex: 'stockProduct',
            key: 'stockProduct',
            width: 110,
            render: (stock) => (
                stock > 0 ? (
                    <span className="text-emerald-700 font-bold font-mono text-xs">{stock} đôi</span>
                ) : (
                    <Tag color="error" className="font-bold">Hết hàng</Tag>
                )
            )
        },
        {
            title: 'Phối màu / Tình trạng',
            key: 'colorCondition',
            render: (_, record) => (
                <div className="text-xs text-gray-600 space-y-0.5">
                    <p><span className="font-medium text-gray-500">Màu:</span> {record.metadata?.colorway || record.metadata?.author || 'Tiêu chuẩn'}</p>
                    <p className="text-[11px] text-gray-400">{record.metadata?.condition || 'Mới 100% (Fullbox)'}</p>
                </div>
            )
        },
        ...(!dataUser || dataUser.role !== 'staff' ? [{
            title: 'Hành động',
            key: 'actions',
            width: 160,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        title="Xem ngoài cửa hàng"
                        onClick={() => window.open(`/product/${record._id}`, '_blank')}
                        className="rounded"
                    />
                    <Button
                        type="default"
                        size="small"
                        icon={<CopyOutlined />}
                        title="Nhân bản mẫu giày này"
                        onClick={() => handleCloneProduct(record)}
                        className="rounded text-blue-600"
                    />
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<EditOutlined />}
                        title="Chỉnh sửa thông tin"
                        onClick={() => openEditProductModal(record)}
                        className="rounded"
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
                            size="small"
                            icon={<DeleteOutlined />}
                            className="rounded"
                        />
                    </Popconfirm>
                </Space>
            )
        }] : [])
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

    // Orders Columns (Designed exactly according to Image 1 layout)
    const orderColumns = [
        {
            title: 'Mã đơn hàng',
            key: 'orderCode',
            width: 150,
            render: (_, record) => {
                const isPrinted = printedOrderIds.includes(record._id);
                return (
                    <div className="space-y-1">
                        <button
                            onClick={() => handleViewOrderDetail(record)}
                            className="text-blue-600 hover:text-blue-800 font-bold font-mono text-xs cursor-pointer hover:underline bg-transparent border-none p-0 text-left block"
                            title="Bấm để xem chi tiết đơn hàng"
                        >
                            #{record._id.slice(-8).toUpperCase()}
                        </button>
                        <div>
                            {isPrinted ? (
                                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-0.5">
                                    ✓ Đã in PGH
                                </span>
                            ) : (
                                <span className="text-red-500 font-semibold text-[11px] flex items-center gap-0.5">
                                    ✕ Chưa in PGH
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Hình thức giao hàng',
            key: 'shippingMethod',
            width: 170,
            render: (_, record) => {
                const isExpress = (record.address || '').toLowerCase().includes('hcm') || (record.address || '').toLowerCase().includes('hà nội');
                return (
                    <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-gray-800">
                            {isExpress ? 'SneakerHub giao hàng (2H)' : 'SneakerHub giao hàng'}
                        </p>
                        <p className="text-[11px] text-gray-500">Đối tác: GHN / Express</p>
                    </div>
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 200,
            render: (status) => {
                const badgeConfig = {
                    pending: { text: 'SneakerHub đã tiếp nhận đơn hàng', border: 'border-orange-400', bg: 'bg-orange-50', textCol: 'text-orange-700' },
                    confirmed: { text: 'Đang chuẩn bị hàng', border: 'border-blue-400', bg: 'bg-blue-50', textCol: 'text-blue-700' },
                    delivered: { text: 'Đang vận chuyển', border: 'border-cyan-400', bg: 'bg-cyan-50', textCol: 'text-cyan-700' },
                    completed: { text: 'Đã giao hàng thành công', border: 'border-emerald-400', bg: 'bg-emerald-50', textCol: 'text-emerald-700' },
                    cancelled: { text: 'Đã hủy đơn hàng', border: 'border-red-400', bg: 'bg-red-50', textCol: 'text-red-700' }
                };
                const conf = badgeConfig[status] || badgeConfig.pending;
                return (
                    <span className={`inline-block border ${conf.border} ${conf.bg} ${conf.textCol} text-xs font-semibold px-2.5 py-1 rounded shadow-2xs`}>
                        {conf.text}
                    </span>
                );
            }
        },
        {
            title: 'Số lượng',
            key: 'totalQuantity',
            width: 80,
            align: 'center',
            render: (_, record) => {
                const totalQty = (record.products || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
                return <strong className="text-gray-900 text-sm">{totalQty}</strong>;
            }
        },
        {
            title: 'Phương thức thanh toán',
            key: 'paymentMethod',
            width: 170,
            render: (_, record) => {
                const method = (record.paymentMethod || 'cod').toLowerCase();
                const isPaid = method !== 'cod' || record.status === 'completed';

                if (method === 'vnpay') {
                    return (
                        <div className="text-xs space-y-1">
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                                <img src={vnpayLogo} alt="VNPAY" className="w-3.5 h-3.5 object-contain" />
                                VNPAY
                            </span>
                            <span className="block text-[11px] text-emerald-600 font-semibold">
                                ✓ Đã thanh toán
                            </span>
                        </div>
                    );
                }

                if (method === 'momo') {
                    return (
                        <div className="text-xs space-y-1">
                            <span className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded border border-pink-200">
                                <img src={momoLogo} alt="MoMo" className="w-3.5 h-3.5 object-contain rounded-xs" />
                                MoMo
                            </span>
                            <span className="block text-[11px] text-emerald-600 font-semibold">
                                ✓ Đã thanh toán
                            </span>
                        </div>
                    );
                }

                // Default: COD (Cash On Delivery)
                return (
                    <div className="text-xs space-y-1">
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded border border-orange-200">
                            <img src={codLogo} alt="COD" className="w-3.5 h-3.5 object-contain" />
                            COD (Tiền mặt)
                        </span>
                        <span className="block text-[11px]">
                            {record.status === 'completed' ? (
                                <span className="text-emerald-600 font-semibold">✓ Đã thanh toán</span>
                            ) : (
                                <span className="text-amber-600 font-semibold">⏳ Thu khi nhận</span>
                            )}
                        </span>
                    </div>
                );
            }
        },
        {
            title: 'Khách hàng phải trả',
            key: 'totalPrice',
            width: 170,
            render: (_, record) => {
                const method = (record.paymentMethod || 'cod').toLowerCase();
                const isPaid = method !== 'cod' || record.status === 'completed';
                const totalOrderPrice = record.finalPrice || record.totalPrice || 0;

                if (isPaid) {
                    return (
                        <div className="text-xs space-y-0.5">
                            <div className="font-extrabold text-emerald-600 text-sm">
                                0 ₫
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                                Đã thanh toán ({formatPrice(totalOrderPrice)})
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="text-xs space-y-0.5">
                        <div className="font-extrabold text-gray-900 text-sm">
                            {formatPrice(totalOrderPrice)}
                        </div>
                        <div className="text-[11px] text-orange-600 font-semibold">
                            Thu tiền tận nơi - COD
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Hạn xác nhận',
            key: 'confirmationDeadline',
            width: 160,
            render: (_, record) => {
                if (record.status !== 'pending') {
                    const d = new Date(record.createdAt || Date.now());
                    return (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                            XN lúc {d.toLocaleDateString('vi-VN')} {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    );
                }
                return (
                    <div className="text-xs space-y-0.5">
                        <span className="text-gray-800 font-bold block">Ngày mai 12:00:00</span>
                        <span className="text-[10px] text-gray-400">Xử lý trong 24h</span>
                    </div>
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <div className="flex flex-col items-start gap-1 text-xs">
                    {record.status === 'pending' && (
                        <button
                            onClick={() => {
                                handleUpdateOrderStatus(record._id, 'confirmed');
                                handleViewOrderDetail(record);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline bg-transparent border-none p-0 text-left"
                        >
                            Xem & Xác nhận
                        </button>
                    )}
                    <button
                        onClick={() => handleViewOrderDetail(record)}
                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0 text-left"
                    >
                        Xem chi tiết
                    </button>
                    {record.status === 'completed' ? (
                        <button
                            onClick={() => handleOpenPrintForOrder(record)}
                            className="text-gray-500 hover:text-blue-600 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0 text-left flex items-center gap-1"
                            title="Đơn hàng đã giao thành công, chỉ xem lại phiếu"
                        >
                            Xem phiếu
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenPrintForOrder(record)}
                            className="text-gray-600 hover:text-black font-semibold cursor-pointer hover:underline bg-transparent border-none p-0 text-left flex items-center gap-1"
                        >
                            In phiếu giao
                        </button>
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

    const filteredOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter(order => {
            const matchesStatus = filterOrderStatus === 'all' || order.status === filterOrderStatus;
            
            // Shipping filter
            let matchesShipping = true;
            if (shippingFilter !== 'all') {
                if (shippingFilter === 'express') {
                    matchesShipping = (order.address || '').toLowerCase().includes('hcm') || (order.address || '').toLowerCase().includes('hà nội');
                } else if (shippingFilter === 'standard') {
                    matchesShipping = true;
                }
            }

            // Date filter
            let matchesDate = true;
            if (filterOrderDate) {
                const orderDate = new Date(order.createdAt).toLocaleDateString('sv');
                matchesDate = orderDate === filterOrderDate;
            } else if (dateFilterRange !== 'all') {
                const orderTime = new Date(order.createdAt).getTime();
                const now = Date.now();
                if (dateFilterRange === 'today') {
                    const todayStr = new Date().toLocaleDateString('sv');
                    matchesDate = new Date(order.createdAt).toLocaleDateString('sv') === todayStr;
                } else if (dateFilterRange === '7days') {
                    matchesDate = (now - orderTime) <= (7 * 24 * 60 * 60 * 1000);
                } else if (dateFilterRange === '30days') {
                    matchesDate = (now - orderTime) <= (30 * 24 * 60 * 60 * 1000);
                }
            }

            // Keyword Search (Mã đơn hàng, tên khách, SĐT, hoặc nhiều mã cách nhau bằng dấu phẩy)
            let matchesSearch = true;
            if (searchOrderKeyword && searchOrderKeyword.trim()) {
                const kw = searchOrderKeyword.trim().toLowerCase();
                if (kw.includes(',')) {
                    const codes = kw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                    matchesSearch = codes.some(c => (order._id || '').toLowerCase().includes(c));
                } else {
                    const orderId = (order._id || '').toLowerCase();
                    const customerName = (order.fullName || order.userId?.fullName || '').toLowerCase();
                    const phone = (order.phoneNumber || '').toLowerCase();
                    const address = (order.address || '').toLowerCase();
                    const productsStr = (order.products || []).map(p => p.productId?.nameProduct || '').join(' ').toLowerCase();

                    if (searchFieldType === 'orderCode') {
                        matchesSearch = orderId.includes(kw);
                    } else if (searchFieldType === 'customer') {
                        matchesSearch = customerName.includes(kw) || phone.includes(kw);
                    } else {
                        matchesSearch = orderId.includes(kw) || customerName.includes(kw) || phone.includes(kw) || address.includes(kw) || productsStr.includes(kw);
                    }
                }
            }

            return matchesStatus && matchesShipping && matchesDate && matchesSearch;
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

    const isStaff = dataUser?.role === 'staff';
    const menuItems = [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'products', label: 'Quản lý Giày', icon: ShoppingBag },
        { key: 'inventory', label: 'Quản lý kho', icon: Layers },
        ...(!isStaff ? [
            { key: 'categories', label: 'Quản lý Thương hiệu', icon: FolderHeart }
        ] : []),
        { key: 'orders', label: 'Quản lý Đơn hàng', icon: ShoppingCart },
        ...(!isStaff ? [
            { key: 'users', label: 'Quản lý tài khoản', icon: UsersIcon },
            { key: 'coupons', label: 'Quản lý Khuyến mãi', icon: Layers }
        ] : []),
        { key: 'support', label: 'Hỗ trợ khách hàng', icon: MessageSquare },
        { key: 'complaints', label: 'Quản lý khiếu nại', icon: WarningOutlined },
        ...(!isStaff ? [
            { key: 'revenue', label: 'Thống kê Doanh thu', icon: LineChart },
            { key: 'staff-mgmt', label: 'Quản lý nhân viên', icon: UsersIcon },
            { key: 'flash-sale', label: 'Cấu hình Flash Sale', icon: Clock },
            { key: 'settings', label: 'Cấu hình hệ thống', icon: SettingsIcon }
        ] : []),
    ];

    const handleExportRevenueCSV = (ordersToExport) => {
        if (!ordersToExport || ordersToExport.length === 0) {
            message.warning('Không có dữ liệu đơn hàng để xuất báo cáo');
            return;
        }
        const headers = [
            'Mã đơn hàng',
            'Tên khách hàng',
            'Email',
            'Số điện thoại',
            'Ngày thanh toán',
            'Phương thức',
            'Sản phẩm & Size',
            'Doanh thu (VNĐ)',
            'Giá vốn (VNĐ)',
            'Lợi nhuận gộp (VNĐ)',
            'Tỷ suất (%)'
        ];

        const rows = ordersToExport.map(o => {
            const orderId = `"${o._id || ''}"`;
            const customer = `"${(o.fullName || o.userId?.fullName || 'Khách vãng lai').replace(/"/g, '""')}"`;
            const email = `"${(o.email || o.userId?.email || '').replace(/"/g, '""')}"`;
            const phone = `"${(o.phoneNumber || '').replace(/"/g, '""')}"`;
            const paymentDate = `"${new Date(o.updatedAt || o.createdAt).toLocaleString('vi-VN')}"`;
            const method = `"${(o.paymentMethod || 'COD').toUpperCase()}"`;

            const productDetails = (o.products || []).map(item => {
                const name = item.productId?.nameProduct || 'Giày Sneaker';
                const size = item.size ? `[Size ${item.size}]` : '';
                const qty = item.quantity || 1;
                return `${name} ${size} x${qty}`;
            }).join('; ');
            const productStr = `"${productDetails.replace(/"/g, '""')}"`;

            const revenue = o.finalPrice || o.totalPrice || 0;
            let cost = 0;
            (o.products || []).forEach(item => {
                if (item.productId) {
                    const c = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                    cost += c * (item.quantity || 1);
                }
            });
            const profit = Math.max(0, revenue - cost);
            const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

            return [
                orderId, customer, email, phone, paymentDate, method,
                productStr, revenue, cost, profit, `${margin}%`
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bao_Cao_Doanh_Thu_SneakerHub_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('Đã xuất báo cáo doanh thu CSV thành công!');
    };

    const renderRevenue = () => {
        const now = new Date();
        const allCompletedOrders = orders.filter(o => o.status === 'completed');

        // Apply Time Filter
        const filteredCompletedOrders = allCompletedOrders.filter(o => {
            const orderDate = new Date(o.updatedAt || o.createdAt);
            if (isNaN(orderDate.getTime())) return false;

            if (revenueTimeRange === '7days') {
                const past = new Date();
                past.setDate(past.getDate() - 7);
                past.setHours(0, 0, 0, 0);
                if (orderDate < past) return false;
            } else if (revenueTimeRange === '15days') {
                const past = new Date();
                past.setDate(past.getDate() - 15);
                past.setHours(0, 0, 0, 0);
                if (orderDate < past) return false;
            } else if (revenueTimeRange === '30days') {
                const past = new Date();
                past.setDate(past.getDate() - 30);
                past.setHours(0, 0, 0, 0);
                if (orderDate < past) return false;
            } else if (revenueTimeRange === 'thisMonth') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                if (orderDate < startOfMonth) return false;
            }

            // Search filter
            if (revenueSearch.trim()) {
                const s = revenueSearch.toLowerCase().trim();
                const idMatch = (o._id || '').toLowerCase().includes(s);
                const nameMatch = (o.fullName || o.userId?.fullName || '').toLowerCase().includes(s);
                const emailMatch = (o.email || o.userId?.email || '').toLowerCase().includes(s);
                const phoneMatch = (o.phoneNumber || '').includes(s);
                if (!idMatch && !nameMatch && !emailMatch && !phoneMatch) return false;
            }

            return true;
        });

        // 1. Core Financial Metrics
        const totalRevenue = filteredCompletedOrders.reduce((sum, o) => sum + (o.finalPrice || o.totalPrice || 0), 0);
        let totalCOGS = 0;
        filteredCompletedOrders.forEach(order => {
            (order.products || []).forEach(item => {
                if (item.productId) {
                    const cost = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                    totalCOGS += cost * (item.quantity || 1);
                }
            });
        });

        const grossProfit = Math.max(0, totalRevenue - totalCOGS);
        const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
        const avgOrderValue = filteredCompletedOrders.length > 0 ? Math.round(totalRevenue / filteredCompletedOrders.length) : 0;

        // 2. Daily Timeline Data for AreaChart
        let dailyRevenueData = [];
        if (revenueTimeRange === 'all') {
            const dateMap = {};
            filteredCompletedOrders.forEach(o => {
                const oDate = new Date(o.updatedAt || o.createdAt);
                const dateKey = oDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                const sortKey = oDate.toISOString().slice(0, 10);
                if (!dateMap[sortKey]) {
                    dateMap[sortKey] = { name: dateKey, sort: sortKey, sales: 0, cost: 0 };
                }
                dateMap[sortKey].sales += (o.finalPrice || o.totalPrice || 0);
                (o.products || []).forEach(item => {
                    if (item.productId) {
                        const cost = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                        dateMap[sortKey].cost += cost * (item.quantity || 1);
                    }
                });
            });
            dailyRevenueData = Object.values(dateMap)
                .sort((a, b) => a.sort.localeCompare(b.sort))
                .map(d => ({
                    name: d.name,
                    'Doanh thu': d.sales,
                    'Lợi nhuận gộp': Math.max(0, d.sales - d.cost)
                }));
        } else {
            const numDays = revenueTimeRange === '7days' ? 7 : (revenueTimeRange === '15days' ? 15 : 30);
            const daysList = [...Array(numDays).keys()].map(i => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return {
                    label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                    rawDate: d.toLocaleDateString('vi-VN')
                };
            }).reverse();

            dailyRevenueData = daysList.map(dayItem => {
                const dayOrders = filteredCompletedOrders.filter(o => {
                    const oDate = new Date(o.updatedAt || o.createdAt).toLocaleDateString('vi-VN');
                    return oDate === dayItem.rawDate;
                });
                const daySales = dayOrders.reduce((sum, o) => sum + (o.finalPrice || o.totalPrice || 0), 0);
                let dayCost = 0;
                dayOrders.forEach(o => {
                    (o.products || []).forEach(item => {
                        if (item.productId) {
                            const cost = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                            dayCost += cost * (item.quantity || 1);
                        }
                    });
                });
                return {
                    name: dayItem.label,
                    'Doanh thu': daySales,
                    'Lợi nhuận gộp': Math.max(0, daySales - dayCost)
                };
            });
        }

        if (dailyRevenueData.length === 0) {
            dailyRevenueData = [{ name: 'Hôm nay', 'Doanh thu': 0, 'Lợi nhuận gộp': 0 }];
        }

        // 3. Brand Distribution (Deep populated or matched by Category ID)
        const brandRevenueMap = {};
        filteredCompletedOrders.forEach(order => {
            (order.products || []).forEach(item => {
                if (item.productId) {
                    const cat = item.productId.categoryProduct;
                    let brandName = 'Khác';
                    if (cat && typeof cat === 'object' && cat.nameCategory) {
                        brandName = cat.nameCategory;
                    } else {
                        const catId = typeof cat === 'string' ? cat : (cat?._id || null);
                        const found = categories.find(c => c._id === catId);
                        if (found) brandName = found.nameCategory;
                    }
                    const pPrice = Number(item.productId.priceProduct) || 0;
                    const pDiscount = Number(item.productId.discountProduct) || 0;
                    const itemRevenue = (pPrice - (pPrice * pDiscount) / 100) * (item.quantity || 1);
                    brandRevenueMap[brandName] = (brandRevenueMap[brandName] || 0) + itemRevenue;
                }
            });
        });

        const brandRevenueData = Object.entries(brandRevenueMap).map(([name, value]) => ({
            name,
            revenue: value
        })).sort((a, b) => b.revenue - a.revenue);

        // 4. Payment Method Breakdown (COD vs MoMo vs VNPay)
        const paymentStats = {
            COD: { label: 'Tiền mặt COD', count: 0, revenue: 0, color: 'bg-zinc-800' },
            MOMO: { label: 'Ví MoMo', count: 0, revenue: 0, color: 'bg-pink-600' },
            VNPAY: { label: 'Cổng VNPay', count: 0, revenue: 0, color: 'bg-blue-600' }
        };
        filteredCompletedOrders.forEach(o => {
            const rawMethod = (o.paymentMethod || 'COD').toUpperCase();
            const key = rawMethod.includes('MOMO') ? 'MOMO' : (rawMethod.includes('VNPAY') ? 'VNPAY' : 'COD');
            paymentStats[key].count += 1;
            paymentStats[key].revenue += (o.finalPrice || o.totalPrice || 0);
        });

        // 5. Top 5 Revenue Sneakers
        const sneakerRevenueMap = {};
        filteredCompletedOrders.forEach(order => {
            (order.products || []).forEach(item => {
                if (item.productId) {
                    const p = item.productId;
                    const pId = p._id || p.nameProduct || 'sku';
                    if (!sneakerRevenueMap[pId]) {
                        sneakerRevenueMap[pId] = {
                            id: pId,
                            name: p.nameProduct || 'Giày Sneaker',
                            image: (p.imagesProduct && p.imagesProduct[0]) || '',
                            sku: p.metadata?.sku || p.metadata?.colorway || 'Chính Hãng',
                            quantity: 0,
                            revenue: 0,
                            cost: 0
                        };
                    }
                    const pPrice = Number(p.priceProduct) || 0;
                    const pDisc = Number(p.discountProduct) || 0;
                    const unitPrice = pPrice - (pPrice * pDisc / 100);
                    const qty = item.quantity || 1;
                    const unitCost = Number(p.costPrice) || Math.round(pPrice * 0.6);

                    sneakerRevenueMap[pId].quantity += qty;
                    sneakerRevenueMap[pId].revenue += unitPrice * qty;
                    sneakerRevenueMap[pId].cost += unitCost * qty;
                }
            });
        });

        const topSneakers = Object.values(sneakerRevenueMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 6. Order Table Columns
        const revenueColumns = [
            {
                title: 'Mã đơn hàng',
                dataIndex: '_id',
                key: '_id',
                render: (id) => (
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-zinc-100 px-2 py-0.5 rounded">
                            #{id?.slice(-8) || id}
                        </span>
                        {id && (
                            <button
                                type="button"
                                title="Sao chép toàn bộ mã đơn"
                                onClick={() => {
                                    navigator.clipboard.writeText(id);
                                    message.success('Đã sao chép mã đơn hàng');
                                }}
                                className="text-gray-400 hover:text-black transition"
                            >
                                <CopyOutlined className="text-xs" />
                            </button>
                        )}
                    </div>
                )
            },
            {
                title: 'Khách hàng',
                dataIndex: 'fullName',
                key: 'fullName',
                render: (text, record) => (
                    <div>
                        <p className="font-bold text-gray-900">{text || record.userId?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-xs text-gray-400">{record.email || record.userId?.email || 'Chưa có email'}</p>
                    </div>
                )
            },
            {
                title: 'Sản phẩm & Size đã bán',
                key: 'products',
                render: (_, record) => {
                    const list = record.products || [];
                    return (
                        <div className="space-y-1 max-w-xs">
                            {list.map((item, idx) => (
                                <div key={idx} className="text-xs text-gray-800 flex items-center gap-1.5">
                                    <span className="font-medium truncate">{item.productId?.nameProduct || 'Sản phẩm'}</span>
                                    {item.size && (
                                        <Tag color="black" className="text-[10px] px-1.5 py-0 rounded font-bold font-mono">
                                            Size {item.size}
                                        </Tag>
                                    )}
                                    <span className="text-gray-400 font-mono">x{item.quantity || 1}</span>
                                </div>
                            ))}
                        </div>
                    );
                }
            },
            {
                title: 'Ngày thanh toán',
                dataIndex: 'updatedAt',
                key: 'updatedAt',
                render: (date, record) => (
                    <span className="text-xs text-gray-600 font-medium">
                        {new Date(date || record.createdAt).toLocaleString('vi-VN')}
                    </span>
                )
            },
            {
                title: 'Phương thức',
                dataIndex: 'paymentMethod',
                key: 'paymentMethod',
                render: (method) => {
                    const m = (method || 'COD').toUpperCase();
                    let color = 'default';
                    if (m.includes('MOMO')) color = 'magenta';
                    else if (m.includes('VNPAY')) color = 'blue';
                    else color = 'gold';
                    return (
                        <Tag color={color} className="uppercase text-xs font-bold px-2 py-0.5 rounded-full">
                            {m}
                        </Tag>
                    );
                }
            },
            {
                title: 'Giá vốn',
                key: 'cogs',
                render: (_, record) => {
                    let cost = 0;
                    (record.products || []).forEach(item => {
                        if (item.productId) {
                            const c = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                            cost += c * (item.quantity || 1);
                        }
                    });
                    return <span className="text-xs font-mono text-gray-500">{formatPrice(cost)}</span>;
                }
            },
            {
                title: 'Lợi nhuận đơn',
                key: 'profit',
                render: (_, record) => {
                    const rev = record.finalPrice || record.totalPrice || 0;
                    let cost = 0;
                    (record.products || []).forEach(item => {
                        if (item.productId) {
                            const c = Number(item.productId.costPrice) || Math.round((Number(item.productId.priceProduct) || 0) * 0.6);
                            cost += c * (item.quantity || 1);
                        }
                    });
                    const p = Math.max(0, rev - cost);
                    return <span className="text-xs font-mono font-bold text-emerald-600">+{formatPrice(p)}</span>;
                }
            },
            {
                title: 'Doanh thu thực nhận',
                dataIndex: 'finalPrice',
                key: 'finalPrice',
                render: (val, record) => (
                    <span className="font-extrabold text-sm text-gray-950 font-mono">
                        {formatPrice(val || record.totalPrice)}
                    </span>
                )
            }
        ];

        return (
            <div className="space-y-6">
                {/* Time Range Filter Bar & Export Actions */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-zinc-100 rounded-xl text-zinc-800">
                                <DollarSign className="w-5 h-5" />
                            </span>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Thống kê Doanh thu & Lợi nhuận P&L</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Phân tích chuyên sâu dòng tiền bán lẻ sneaker, giá vốn nhập hàng (COGS) và biên lợi nhuận ròng
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Time Range Selector */}
                        <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setRevenueTimeRange('all')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition ${revenueTimeRange === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                Toàn thời gian
                            </button>
                            <button
                                type="button"
                                onClick={() => setRevenueTimeRange('thisMonth')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition ${revenueTimeRange === 'thisMonth' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                Tháng này
                            </button>
                            <button
                                type="button"
                                onClick={() => setRevenueTimeRange('30days')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition ${revenueTimeRange === '30days' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                30 ngày
                            </button>
                            <button
                                type="button"
                                onClick={() => setRevenueTimeRange('15days')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition ${revenueTimeRange === '15days' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                15 ngày
                            </button>
                            <button
                                type="button"
                                onClick={() => setRevenueTimeRange('7days')}
                                className={`px-3 py-1.5 rounded-lg font-bold transition ${revenueTimeRange === '7days' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                            >
                                7 ngày
                            </button>
                        </div>

                        {/* Export CSV Button */}
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={() => handleExportRevenueCSV(filteredCompletedOrders)}
                            className="bg-black hover:bg-zinc-800 text-white font-bold rounded-xl px-4 border-none shadow-sm flex items-center gap-1.5"
                        >
                            Xuất báo cáo CSV
                        </Button>
                    </div>
                </div>

                {/* 5 KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng doanh thu</p>
                        <h3 className="text-2xl font-black text-black mt-2 font-mono">{formatPrice(totalRevenue)}</h3>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">✓ {filteredCompletedOrders.length} đơn hoàn thành</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng giá vốn (COGS)</p>
                        <h3 className="text-2xl font-black text-gray-600 mt-2 font-mono">{formatPrice(totalCOGS)}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Tiền nhập giày từ nhà sản xuất</p>
                    </div>
                    <div className="bg-white border border-emerald-200 bg-emerald-50/25 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Lợi nhuận gộp</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2 font-mono">{formatPrice(grossProfit)}</h3>
                        <p className="text-xs text-emerald-700 font-bold mt-1">💰 Lợi nhuận thực tế thu về</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tỷ suất lợi nhuận</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-2 font-mono">{profitMargin}%</h3>
                        <p className="text-xs text-blue-600 font-semibold mt-1">Biên lợi nhuận gộp toàn shop</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giá trị đơn TB (AOV)</p>
                        <h3 className="text-2xl font-black text-black mt-2 font-mono">{formatPrice(avgOrderValue)}</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-1">trung bình trên mỗi đơn hàng</p>
                    </div>
                </div>

                {/* Timeline AreaChart & Brand Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Biểu đồ Doanh thu & Lợi nhuận theo Thời gian</h4>
                                <p className="text-gray-500 text-xs">
                                    Đang xem: <span className="font-bold text-black uppercase">{revenueTimeRange === 'all' ? 'Toàn thời gian' : (revenueTimeRange === 'thisMonth' ? 'Tháng này' : `${revenueTimeRange.replace('days', ' ngày qua')}`)}</span> ({dailyRevenueData.length} mốc phát sinh)
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-gray-900">
                                    <span className="w-3 h-3 rounded-full bg-black"></span>
                                    <span>Doanh thu</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-600">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span>Lợi nhuận gộp</span>
                                </span>
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyRevenueData}>
                                    <defs>
                                        <linearGradient id="colorDailyRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#18181b" stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorDailyProf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                                    <YAxis 
                                        stroke="#a1a1aa" 
                                        fontSize={11} 
                                        tickLine={false} 
                                        domain={[0, 'auto']}
                                        tickFormatter={(v) => {
                                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                                            if (v >= 1000) return `${Math.round(v / 1000)}k`;
                                            return `${v}đ`;
                                        }} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value, name) => [formatPrice(value), name]}
                                    />
                                    <Area type="monotone" dataKey="Doanh thu" stroke="#000000" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDailyRev)" />
                                    <Area type="monotone" dataKey="Lợi nhuận gộp" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDailyProf)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Brand Distribution */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                        <div>
                            <h4 className="text-base font-bold text-gray-900">Doanh thu theo Thương hiệu</h4>
                            <p className="text-gray-500 text-xs">Phân tích tỷ trọng doanh số dựa trên hãng giày</p>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-72 pt-1 scrollbar-custom">
                            {brandRevenueData.length === 0 ? (
                                <p className="text-gray-400 text-xs text-center py-10">Chưa có dữ liệu thương hiệu trong khoảng thời gian này</p>
                            ) : (
                                brandRevenueData.map((item, idx) => {
                                    const percent = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                                    return (
                                        <div key={item.name} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-gray-800">
                                                <span>{idx + 1}. {item.name}</span>
                                                <span className="font-mono">{formatPrice(item.revenue)} ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
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

                        <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
                            <span>Thương hiệu dẫn đầu:</span>
                            <span className="font-bold text-gray-900">{brandRevenueData[0]?.name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Row: Top 5 Sneaker & Payment Methods */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top 5 Best Selling Sneakers */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <span>👟</span> Top 5 Mẫu Giày Đóng Góp Doanh Thu Cao Nhất
                                </h4>
                                <p className="text-gray-500 text-xs mt-0.5">Xếp hạng theo tổng doanh thu bán ra thực tế</p>
                            </div>
                            <Tag color="black" className="rounded-full text-xs font-bold px-2.5">Gà Đẻ Trứng Vàng</Tag>
                        </div>

                        {topSneakers.length === 0 ? (
                            <p className="text-gray-400 text-xs text-center py-8">Chưa có dữ liệu mẫu giày hoàn tất</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {topSneakers.map((s, idx) => {
                                    const profit = Math.max(0, s.revenue - s.cost);
                                    return (
                                        <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${idx === 0 ? 'bg-amber-400 text-white' : (idx === 1 ? 'bg-gray-300 text-gray-800' : 'bg-gray-100 text-gray-500')}`}>
                                                    {idx + 1}
                                                </span>
                                                {s.image ? (
                                                    <img src={s.image} alt={s.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 shrink-0">👟</div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{s.name}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono truncate">{s.sku}</p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="font-bold font-mono text-gray-900">{formatPrice(s.revenue)}</div>
                                                <div className="text-[11px] text-gray-500">
                                                    <span className="font-semibold text-black">{s.quantity}</span> đôi · Lãi: <span className="text-emerald-600 font-semibold font-mono">+{formatPrice(profit)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Breakdown */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="border-b pb-3">
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <span>💳</span> Cơ Cấu Phương Thức Thanh Toán
                            </h4>
                            <p className="text-gray-500 text-xs mt-0.5">Phân tích rủi ro dòng tiền (Tiền mặt COD vs Chuyển khoản)</p>
                        </div>

                        <div className="space-y-4 text-xs">
                            {Object.entries(paymentStats).map(([key, data]) => {
                                const percent = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;
                                return (
                                    <div key={key} className="space-y-1.5">
                                        <div className="flex justify-between items-center font-bold">
                                            <span className="text-gray-800">{data.label} ({data.count} đơn)</span>
                                            <span className="font-mono text-gray-900">{formatPrice(data.revenue)} ({percent}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                            <div className={`${data.color} h-full rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] text-gray-600 space-y-1 mt-2">
                            <p className="font-bold text-gray-800">💡 Nhận định tài chính:</p>
                            <p>
                                {paymentStats.COD.revenue > (totalRevenue * 0.5) 
                                    ? 'Tỷ trọng tiền mặt COD chiếm trên 50%. Cần theo dõi đối soát chặt chẽ với đơn vị vận chuyển để tránh chậm luân chuyển dòng tiền.'
                                    : 'Dòng tiền chuyển khoản trực tuyến đạt mức an toàn cao, giảm thiểu rủi ro chậm đối soát.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Completed Orders Detailed Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h4 className="text-base font-bold text-gray-955">Bảng Kê Hóa Đơn & Đơn Hàng Hoàn Tất</h4>
                            <p className="text-xs text-gray-500">
                                Danh sách chi tiết {filteredCompletedOrders.length} đơn hàng thành công kèm giá vốn và lợi nhuận từng đơn
                            </p>
                        </div>

                        <Input
                            placeholder="Tìm kiếm theo mã đơn, tên khách..."
                            value={revenueSearch}
                            onChange={(e) => setRevenueSearch(e.target.value)}
                            prefix={<SearchIcon className="w-4 h-4 text-gray-400 mr-1" />}
                            className="w-64 rounded-xl text-xs"
                            allowClear
                        />
                    </div>

                    <Table
                        columns={revenueColumns}
                        dataSource={filteredCompletedOrders}
                        rowKey="_id"
                        pagination={{ pageSize: 6, showTotal: (total) => `Tổng cộng ${total} đơn hoàn tất` }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                    />
                </div>
            </div>
        );
    };

    const renderStaffManagement = () => {
        const selectedStaff = staffList.find(s => s._id === selectedStaffId);

        return (
            <div className="space-y-6 font-sans">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900">Quản lý hiệu suất Nhân viên</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Theo dõi thống kê số lượng đơn hàng nhân viên đã xác nhận và các tin nhắn hỗ trợ đã gửi.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Staff list selection column */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col space-y-4">
                        <span className="font-bold text-sm text-gray-800">Danh sách nhân viên ({staffList.length})</span>
                        <div className="space-y-2 overflow-y-auto max-h-[450px]">
                            {staffList.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center font-medium">Chưa có nhân viên nào</p>
                            ) : (
                                staffList.map(staff => {
                                    const isSelected = staff._id === selectedStaffId;
                                    return (
                                        <div
                                            key={staff._id}
                                            onClick={() => setSelectedStaffId(staff._id)}
                                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                                                isSelected
                                                    ? 'bg-black text-white border-black font-semibold shadow-sm'
                                                    : 'bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            <p className="text-sm truncate">{staff.fullName}</p>
                                            <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                                {staff.email}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Staff report detail column */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-6">
                        {selectedStaff ? (
                            <>
                                {/* Selected Staff Header info */}
                                <div className="border-b border-gray-150 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">{selectedStaff.fullName}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{selectedStaff.email}</p>
                                    </div>
                                    <Tag color="purple" className="font-bold border-none px-3 py-1 rounded-full text-xs">
                                        NHÂN VIÊN HỖ TRỢ
                                    </Tag>
                                </div>

                                {/* KPIs dashboard row */}
                                {loadingStaffReport ? (
                                    <div className="py-20 text-center text-gray-450 text-xs">Đang tải báo cáo hiệu suất...</div>
                                ) : staffReport ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Đơn hàng đã xác nhận</span>
                                                <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{staffReport.confirmedOrders?.length || 0}</h3>
                                                <p className="text-[10px] text-green-600 font-medium mt-1">✓ Đã đối chiếu thành công</p>
                                            </div>
                                            <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tin nhắn chat đã gửi</span>
                                                <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{staffReport.sentMessages?.length || 0}</h3>
                                                <p className="text-[10px] text-blue-600 font-medium mt-1">💬 Đã phản hồi khách hàng</p>
                                            </div>
                                        </div>

                                        {/* Confirmed Orders Table */}
                                        <div>
                                            <h5 className="font-bold text-sm text-gray-800 mb-3">Đơn hàng đã xác nhận ({staffReport.confirmedOrders?.length || 0})</h5>
                                            <Table
                                                dataSource={staffReport.confirmedOrders}
                                                rowKey="_id"
                                                pagination={{ pageSize: 4 }}
                                                className="border border-gray-200 rounded-xl overflow-hidden text-xs"
                                                columns={[
                                                    {
                                                        title: 'Mã đơn',
                                                        dataIndex: '_id',
                                                        key: '_id',
                                                        render: (id) => <span className="font-mono text-xs text-gray-800 font-semibold">{id.substring(id.length - 6)}</span>
                                                    },
                                                    {
                                                        title: 'Khách hàng',
                                                        key: 'customer',
                                                        render: (_, rec) => (
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-xs">{rec.fullName || rec.userId?.fullName || 'N/A'}</p>
                                                                <p className="text-[10px] text-gray-400">{rec.phoneNumber}</p>
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        title: 'Trạng thái',
                                                        dataIndex: 'status',
                                                        key: 'status',
                                                        render: (st) => (
                                                            <Tag color={st === 'completed' ? 'success' : st === 'confirmed' ? 'blue' : st === 'cancelled' ? 'error' : 'warning'}>
                                                                {st === 'completed' ? 'Hoàn thành' : st === 'confirmed' ? 'Đang chuẩn bị' : 'Chờ xử lý'}
                                                            </Tag>
                                                        )
                                                    },
                                                    {
                                                        title: 'Tổng tiền',
                                                        key: 'finalPrice',
                                                        render: (_, rec) => <span className="font-bold text-gray-900">{formatPrice(rec.finalPrice || rec.totalPrice)}</span>
                                                    }
                                                ]}
                                            />
                                        </div>

                                        {/* Chat Messages Timeline */}
                                        <div>
                                            <h5 className="font-bold text-sm text-gray-800 mb-3">Lịch sử tin nhắn hỗ trợ đã gửi ({staffReport.sentMessages?.length || 0})</h5>
                                            <Table
                                                dataSource={staffReport.sentMessages}
                                                rowKey="_id"
                                                pagination={{ pageSize: 4 }}
                                                className="border border-gray-200 rounded-xl overflow-hidden text-xs"
                                                columns={[
                                                    {
                                                        title: 'Gửi tới khách hàng',
                                                        key: 'customer',
                                                        render: (_, rec) => (
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-xs">{rec.userId?.fullName || 'Khách vãng lai'}</p>
                                                                <p className="text-[10px] text-gray-400">{rec.userId?.email || 'N/A'}</p>
                                                            </div>
                                                        )
                                                    },
                                                    {
                                                        title: 'Nội dung tin nhắn',
                                                        dataIndex: 'content',
                                                        key: 'content',
                                                        render: (content) => <span className="text-gray-700 italic">"{content.substring(0, 50)}{content.length > 50 ? '...' : ''}"</span>
                                                    },
                                                    {
                                                        title: 'Thời gian',
                                                        dataIndex: 'createdAt',
                                                        key: 'createdAt',
                                                        render: (date) => new Date(date).toLocaleString('vi-VN')
                                                    }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center text-gray-400">Không có báo cáo hiệu suất khả dụng.</div>
                                )}
                            </>
                        ) : (
                            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                                <UsersIcon className="w-10 h-10 opacity-30 text-gray-450" />
                                <p className="font-bold text-gray-700">Chưa chọn nhân viên</p>
                                <p className="text-xs">Chọn một nhân viên từ danh sách bên trái để xem chi tiết báo cáo công việc.</p>
                            </div>
                        )}
                    </div>
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
                                                o.status === 'confirmed' ? 'blue' :
                                                o.status === 'delivered' ? 'cyan' :
                                                o.status === 'cancelled' ? 'error' : 'warning'
                                            } className="font-semibold text-xs rounded-full border px-2.5 py-0.5">
                                                {o.status === 'completed' ? 'Đã hoàn thành' :
                                                 o.status === 'confirmed' ? 'Đang chuẩn bị' :
                                                 o.status === 'delivered' ? 'Đang giao' :
                                                 o.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
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
        const totalProds = products.length;
        const saleProds = products.filter(p => (p.discountProduct || 0) > 0).length;
        const inStockProds = products.filter(p => (p.stockProduct || 0) >= 5).length;
        const lowStockProds = products.filter(p => (p.stockProduct || 0) < 5).length;

        const sortedAndFiltered = [...filteredProducts].sort((a, b) => {
            if (productSortOrder === 'price_asc') return (a.priceProduct || 0) - (b.priceProduct || 0);
            if (productSortOrder === 'price_desc') return (b.priceProduct || 0) - (a.priceProduct || 0);
            if (productSortOrder === 'discount_desc') return (b.discountProduct || 0) - (a.discountProduct || 0);
            if (productSortOrder === 'stock_desc') return (b.stockProduct || 0) - (a.stockProduct || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return (
            <div className="space-y-6">
                {/* 1. Products KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng mẫu giày</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <ShoppingBag className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mt-2">{totalProds} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-gray-500 mt-1">Đang kinh doanh trên hệ thống</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đang áp dụng Sale</span>
                            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                                <FireOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-red-600 mt-2">{saleProds} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-red-700 font-medium mt-1">Có mức chiết khấu từ 5% - 50%</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tồn kho dồi dào</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{inStockProds} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">≥ 5 đôi, sẵn sàng giao ngay</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cần bổ sung kho</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <WarningOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{lowStockProds} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-amber-700 font-medium mt-1">&lt; 5 đôi hoặc đã hết hàng</p>
                    </div>
                </div>

                {/* 2. Main Products Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Danh sách giày thể thao</h3>
                            <p className="text-xs text-gray-500">Quản lý mã SKU, đơn giá bán, giá vốn nhập hàng, hình ảnh và tình trạng giày</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportProductsCSV}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center"
                            >
                                Xuất Catalog CSV
                            </Button>
                            {!isStaff && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={openAddProductModal}
                                    className="bg-black hover:bg-zinc-800 font-bold text-xs text-white rounded-xl flex items-center border-none"
                                >
                                    Thêm giày mới
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1 max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên giày hoặc mã SKU..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black w-full"
                            />
                        </div>
                        <Select
                            value={filterCategory}
                            style={{ width: 180 }}
                            onChange={(value) => setFilterCategory(value)}
                            className="text-xs"
                        >
                            <Option value="all">Tất cả thương hiệu</Option>
                            {categories.map(cat => (
                                <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                            ))}
                        </Select>
                        <Select
                            value={productSortOrder}
                            style={{ width: 170 }}
                            onChange={setProductSortOrder}
                            className="text-xs"
                        >
                            <Option value="default">Mới nhất</Option>
                            <Option value="price_asc">Giá: Thấp đến Cao</Option>
                            <Option value="price_desc">Giá: Cao đến Thấp</Option>
                            <Option value="discount_desc">Giảm giá nhiều nhất</Option>
                            <Option value="stock_desc">Tồn kho nhiều nhất</Option>
                        </Select>
                    </div>

                    <Table
                        columns={productColumns}
                        dataSource={sortedAndFiltered}
                        rowKey="_id"
                        loading={loadingProducts}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden mt-3"
                    />
                </div>
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
        if (orderViewMode === 'detail' && selectedOrder) {
            return (
                <OrderDetailView
                    order={selectedOrder}
                    onBack={handleBackToOrderList}
                    onPrint={handleOpenPrintForOrder}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onUpdateNote={handleUpdateOrderNote}
                    isPrinted={printedOrderIds.includes(selectedOrder._id)}
                />
            );
        }

        const allCount = orders.length;
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
        const deliveredCount = orders.filter(o => o.status === 'delivered').length;
        const completedCount = orders.filter(o => o.status === 'completed').length;
        const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

        const statusTabs = [
            { key: 'all', label: 'Tất cả', count: allCount },
            { key: 'pending', label: 'Chờ xác nhận', count: pendingCount },
            { key: 'confirmed', label: 'Đang xử lý', count: confirmedCount },
            { key: 'delivered', label: 'Đang vận chuyển', count: deliveredCount },
            { key: 'completed', label: 'Đã giao hàng', count: completedCount },
            { key: 'cancelled', label: 'Đã huỷ', count: cancelledCount },
        ];

        const rowSelection = {
            selectedRowKeys: selectedOrderKeys,
            onChange: (newSelectedRowKeys) => {
                setSelectedOrderKeys(newSelectedRowKeys);
            }
        };

        const hasActiveFilters = 
            searchOrderKeyword.trim() !== '' || 
            shippingFilter !== 'all' || 
            dateFilterRange !== 'all' || 
            filterOrderDate !== '';

        const clearAllFilters = () => {
            setSearchOrderKeyword('');
            setShippingFilter('all');
            setDateFilterRange('all');
            setFilterOrderDate('');
        };

        const pendingSelectedCount = orders.filter(o => selectedOrderKeys.includes(o._id) && o.status === 'pending').length;

        return (
            <div className="space-y-4 font-sans text-gray-800">
                {/* 1. STATUS TABS BAR (Horizontal Tiki Seller Center style) */}
                <div className="bg-white border-b border-gray-200 px-4 pt-1 rounded-t-xl shadow-xs">
                    <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
                        {statusTabs.map((tab) => {
                            const isActive = filterOrderStatus === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setFilterOrderStatus(tab.key)}
                                    className={`py-3.5 px-3 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors relative cursor-pointer border-b-2 bg-transparent ${
                                        isActive
                                            ? 'text-blue-600 font-bold border-blue-600'
                                            : 'text-gray-600 hover:text-gray-900 border-transparent'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] ${
                                        isActive ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. FILTER CONTAINER (Matching Image 1) */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                    {/* Row 1: Search and Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Search input group */}
                        <div className="md:col-span-7 flex items-center gap-2">
                            <Select
                                value={searchFieldType}
                                onChange={setSearchFieldType}
                                style={{ width: 160 }}
                                className="shrink-0"
                            >
                                <Option value="orderCode">Mã đơn hàng</Option>
                                <Option value="customer">Tên khách / SĐT</Option>
                                <Option value="all">Tất cả tiêu chí</Option>
                            </Select>
                            <Input
                                placeholder={
                                    searchFieldType === 'orderCode'
                                        ? 'Nhập mã đơn hàng (nhiều mã cách nhau bởi dấu phẩy)...'
                                        : searchFieldType === 'customer'
                                        ? 'Nhập họ tên khách hàng, số điện thoại...'
                                        : 'Nhập từ khóa tìm kiếm...'
                                }
                                value={searchOrderKeyword}
                                onChange={(e) => setSearchOrderKeyword(e.target.value)}
                                prefix={<SearchIcon className="w-4 h-4 text-gray-400 mr-1" />}
                                allowClear
                                className="w-full text-xs"
                            />
                        </div>

                        {/* Date filter group */}
                        <div className="md:col-span-5 flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500 shrink-0 hidden lg:inline">Thời gian:</span>
                            <Select
                                value={dateFilterRange}
                                onChange={(val) => {
                                    setDateFilterRange(val);
                                    if (val !== 'custom') setFilterOrderDate('');
                                }}
                                style={{ width: 130 }}
                                className="shrink-0 text-xs"
                            >
                                <Option value="all">Tất cả</Option>
                                <Option value="today">Hôm nay</Option>
                                <Option value="7days">7 ngày qua</Option>
                                <Option value="30days">30 ngày qua</Option>
                            </Select>
                            <Input
                                type="date"
                                value={filterOrderDate}
                                onChange={(e) => {
                                    setFilterOrderDate(e.target.value);
                                    setDateFilterRange('all');
                                }}
                                className="text-xs"
                                style={{ width: 140 }}
                                title="Lọc theo ngày cụ thể"
                            />
                        </div>
                    </div>

                    {/* Row 2: Shipping method filter pills & clear */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-500 font-medium">Hình thức giao hàng:</span>
                            <button
                                type="button"
                                onClick={() => setShippingFilter('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                                    shippingFilter === 'all'
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                Tất cả
                            </button>
                            <button
                                type="button"
                                onClick={() => setShippingFilter('express')}
                                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                                    shippingFilter === 'express'
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                SneakerHub Express (2H)
                            </button>
                            <button
                                type="button"
                                onClick={() => setShippingFilter('standard')}
                                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
                                    shippingFilter === 'standard'
                                        ? 'bg-blue-50 text-blue-600 border-blue-400 font-bold'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                SneakerHub Tiêu chuẩn
                            </button>
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer bg-transparent border-none flex items-center gap-1 hover:underline ml-auto"
                            >
                                <ReloadOutlined className="text-[11px]" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. ACTION BAR & TABLE CONTAINER (Matching Image 1) */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs space-y-3">
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 text-sm">
                                Đơn hàng: <span className="text-blue-600">{filteredOrders.length}</span>
                            </span>
                            {selectedOrderKeys.length > 0 && (
                                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                                    Đã chọn {selectedOrderKeys.length} đơn
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="primary"
                                onClick={handleBatchConfirmOrders}
                                loading={isApplyingBatch}
                                disabled={!selectedOrderKeys.length || pendingSelectedCount === 0}
                                className="bg-[#00acc1] hover:bg-[#0097a7] text-white border-none font-semibold rounded-lg text-xs h-8 shadow-xs"
                            >
                                Xác nhận hàng loạt {pendingSelectedCount > 0 ? `(${pendingSelectedCount})` : ''}
                            </Button>

                            <Button
                                icon={<PrinterOutlined />}
                                onClick={handleOpenPrintBatch}
                                disabled={!selectedOrderKeys.length}
                                className="font-semibold rounded-lg text-xs h-8 border-gray-300 hover:border-blue-600 text-gray-700 flex items-center gap-1"
                            >
                                In nhãn hàng loạt {selectedOrderKeys.length > 0 ? `(${selectedOrderKeys.length})` : ''}
                            </Button>

                            <Button
                                icon={<Download className="w-3.5 h-3.5" />}
                                onClick={handleExportOrders}
                                className="font-semibold rounded-lg text-xs h-8 border-gray-300 hover:border-black text-gray-700 flex items-center gap-1"
                            >
                                Xuất đơn hàng
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <Table
                        rowSelection={rowSelection}
                        columns={orderColumns}
                        dataSource={filteredOrders}
                        rowKey="_id"
                        loading={loadingOrders}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} của ${total} đơn hàng`
                        }}
                        scroll={{ x: 1100 }}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                    />
                </div>
            </div>
        );
    };

    const handleSaveStoreSettings = () => {
        try {
            localStorage.setItem('sneakerhub_store_settings', JSON.stringify(storeSettings));
            message.success('Đã lưu cấu hình hệ thống SneakerHub thành công!');
        } catch (e) {
            console.error('Error saving store settings:', e);
            message.error('Không thể lưu cấu hình hệ thống');
        }
    };

    const handleResetStoreSettings = () => {
        const defaults = {
            storeName: 'SneakerHub Việt Nam',
            hotline: '0899227066',
            email: 'cskh@sneakerhub.vn',
            address: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            slogan: 'Nâng niu từng bước chân - Sneaker Chính Hãng & Đẳng Cấp',
            shippingFee: 30000,
            freeShippingThreshold: 1000000,
            returnDays: 7,
            warrantyMonths: 6,
            bankName: 'MB Bank (Quân Đội)',
            bankAccount: '0899227066',
            bankOwner: 'DOAN THANH HUY'
        };
        setStoreSettings(defaults);
        try {
            localStorage.setItem('sneakerhub_store_settings', JSON.stringify(defaults));
            message.info('Đã khôi phục cấu hình hệ thống về mặc định!');
        } catch (e) {
            console.error('Error resetting store settings:', e);
        }
    };

    const renderSettings = () => {
        return (
            <div className="space-y-6">
                {/* Header & Actions */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-zinc-100 rounded-xl text-zinc-800">
                                <SettingsIcon className="w-5 h-5" />
                            </span>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Cấu hình Hệ thống & Vận hành Shop</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Quản lý thông tin thương hiệu SneakerHub, chính sách giao nhận, đổi trả bảo hành và cổng thanh toán
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleResetStoreSettings}
                            className="rounded-xl font-medium border-gray-300 hover:border-gray-400"
                        >
                            Khôi phục mặc định
                        </Button>
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={handleSaveStoreSettings}
                            className="bg-black hover:bg-zinc-800 text-white font-bold rounded-xl px-5 border-none shadow-sm flex items-center gap-1.5"
                        >
                            Lưu cấu hình
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card 1: Thông tin thương hiệu & showroom */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏬</span>
                                <h4 className="font-bold text-gray-900 text-base">Thông tin Thương hiệu & Liên hệ</h4>
                            </div>
                            <Tag color="black" className="rounded-full text-xs px-2.5 font-semibold">Chính hãng</Tag>
                        </div>

                        <div className="space-y-3.5 text-sm">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tên cửa hàng / Thương hiệu</label>
                                <Input
                                    value={storeSettings.storeName}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                                    placeholder="SneakerHub Việt Nam"
                                    className="rounded-xl py-2"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Hotline CSKH / Đặt hàng</label>
                                    <Input
                                        value={storeSettings.hotline}
                                        onChange={(e) => setStoreSettings({ ...storeSettings, hotline: e.target.value })}
                                        placeholder="0899227066"
                                        className="rounded-xl py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email tiếp nhận khiếu nại</label>
                                    <Input
                                        value={storeSettings.email}
                                        onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                                        placeholder="cskh@sneakerhub.vn"
                                        className="rounded-xl py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Địa chỉ showroom / Kho hàng chính</label>
                                <Input
                                    value={storeSettings.address}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                                    placeholder="123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                                    className="rounded-xl py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Slogan thương hiệu</label>
                                <Input
                                    value={storeSettings.slogan}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, slogan: e.target.value })}
                                    placeholder="Nâng niu từng bước chân - Sneaker Chính Hãng & Đẳng Cấp"
                                    className="rounded-xl py-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Vận chuyển & Giao hàng Sneaker */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🚚</span>
                                <h4 className="font-bold text-gray-900 text-base">Chính sách Giao hàng & Vận chuyển</h4>
                            </div>
                            <Tag color="blue" className="rounded-full text-xs px-2.5 font-semibold">Toàn quốc</Tag>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phí vận chuyển tiêu chuẩn</label>
                                <div className="flex items-center gap-2">
                                    <InputNumber
                                        value={storeSettings.shippingFee}
                                        onChange={(val) => setStoreSettings({ ...storeSettings, shippingFee: val || 0 })}
                                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                                        className="w-full rounded-xl py-1"
                                        min={0}
                                        addonAfter="VNĐ"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Áp dụng cho đơn hàng không đạt mức Freeship</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngưỡng Freeship (Miễn phí ship giày)</label>
                                <div className="flex items-center gap-2">
                                    <InputNumber
                                        value={storeSettings.freeShippingThreshold}
                                        onChange={(val) => setStoreSettings({ ...storeSettings, freeShippingThreshold: val || 0 })}
                                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                                        className="w-full rounded-xl py-1"
                                        min={0}
                                        addonAfter="VNĐ"
                                    />
                                </div>
                                <p className="text-xs text-emerald-600 font-medium mt-1">
                                    ✓ Tự động miễn 100% phí ship cho đơn từ {(storeSettings.freeShippingThreshold || 0).toLocaleString('vi-VN')} VNĐ
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 space-y-1.5 text-xs text-blue-900">
                                <p className="font-bold flex items-center gap-1.5">
                                    <span>📦</span> Đối tác vận chuyển tích hợp:
                                </p>
                                <p className="text-blue-700">
                                    Hỗ trợ Giao Hàng Nhanh (GHN), Giao Hàng Tiết Kiệm (GHTK), Viettel Post và Hỏa tốc GrabExpress nội thành 2h.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Chính sách Đổi size & Bảo hành */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🛡️</span>
                                <h4 className="font-bold text-gray-900 text-base">Chính sách Đổi Size & Bảo hành Sneaker</h4>
                            </div>
                            <Tag color="green" className="rounded-full text-xs px-2.5 font-semibold">An tâm mua sắm</Tag>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Thời hạn đổi size / đổi mẫu</label>
                                    <InputNumber
                                        value={storeSettings.returnDays}
                                        onChange={(val) => setStoreSettings({ ...storeSettings, returnDays: val || 0 })}
                                        className="w-full rounded-xl py-1"
                                        min={1}
                                        max={30}
                                        addonAfter="Ngày"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Tính từ ngày giao thành công</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Thời gian bảo hành keo chỉ</label>
                                    <InputNumber
                                        value={storeSettings.warrantyMonths}
                                        onChange={(val) => setStoreSettings({ ...storeSettings, warrantyMonths: val || 0 })}
                                        className="w-full rounded-xl py-1"
                                        min={1}
                                        max={36}
                                        addonAfter="Tháng"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Bảo hành lỗi kỹ thuật nhà sản xuất</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
                                <p className="font-bold flex items-center gap-1.5">
                                    <span>⚠️</span> Quy định đổi trả sneaker tại shop:
                                </p>
                                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                                    <li>Giày phải còn nguyên tem, tag giá, hộp gốc và chưa qua sử dụng ngoài trời.</li>
                                    <li>Hỗ trợ 1 lần đổi size miễn phí nếu khách hàng mang không vừa.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Thông tin Chuyển khoản & VietQR */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">💳</span>
                                <h4 className="font-bold text-gray-900 text-base">Tài khoản Ngân hàng & VietQR</h4>
                            </div>
                            <Tag color="purple" className="rounded-full text-xs px-2.5 font-semibold">Tự động đối soát</Tag>
                        </div>

                        <div className="space-y-3.5 text-sm">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngân hàng thụ hưởng</label>
                                <Input
                                    value={storeSettings.bankName}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, bankName: e.target.value })}
                                    placeholder="MB Bank (Quân Đội)"
                                    className="rounded-xl py-2"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số tài khoản</label>
                                    <Input
                                        value={storeSettings.bankAccount}
                                        onChange={(e) => setStoreSettings({ ...storeSettings, bankAccount: e.target.value })}
                                        placeholder="0899227066"
                                        className="rounded-xl py-2 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Chủ tài khoản (viết hoa không dấu)</label>
                                    <Input
                                        value={storeSettings.bankOwner}
                                        onChange={(e) => setStoreSettings({ ...storeSettings, bankOwner: e.target.value })}
                                        placeholder="DOAN THANH HUY"
                                        className="rounded-xl py-2 uppercase font-medium"
                                    />
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5 flex items-center justify-between text-xs text-purple-900">
                                <div>
                                    <p className="font-bold">Phương thức thanh toán đã kích hoạt:</p>
                                    <p className="text-purple-700 mt-0.5">Tiền mặt COD, Ví điện tử MoMo, Cổng VNPay QR và Chuyển khoản VietQR</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <img src={codLogo} alt="COD" className="h-6 w-auto object-contain" />
                                    <img src={momoLogo} alt="MoMo" className="h-6 w-auto object-contain" />
                                    <img src={vnpayLogo} alt="VNPay" className="h-6 w-auto object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 5: Tình trạng kết nối hạ tầng & API */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚙️</span>
                            <h4 className="font-bold text-gray-900 text-base">Tình trạng Kết nối Hạ tầng Kỹ thuật & API</h4>
                        </div>
                        <span className="text-xs font-mono text-gray-400">SneakerHub Engine v2.5.0</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700">Backend REST API</span>
                                <Tag color="green" className="m-0 font-bold">HOẠT ĐỘNG</Tag>
                            </div>
                            <p className="font-mono text-gray-500">http://localhost:3000/api</p>
                            <p className="text-gray-400 text-[11px]">Xử lý auth, catalogue, giỏ hàng, đặt hàng</p>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700">Lưu trữ Ảnh Sản Phẩm</span>
                                <Tag color="blue" className="m-0 font-bold">CLOUDINARY / LOCAL</Tag>
                            </div>
                            <p className="font-mono text-gray-500">Cloudinary CDN + Local Fallback</p>
                            <p className="text-gray-400 text-[11px]">Tự động tối ưu nén ảnh WebP & thumbnail</p>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-700">Real-time WebSocket</span>
                                <Tag color="green" className="m-0 font-bold">SOCKET.IO CONNECTED</Tag>
                            </div>
                            <p className="font-mono text-gray-500">ws://localhost:3000</p>
                            <p className="text-gray-400 text-[11px]">Đồng bộ chat hỗ trợ & thông báo đơn tức thì</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleUpdateStock = async (productId, currentProduct) => {
        try {
            const formData = new FormData();
            formData.append('nameProduct', currentProduct.nameProduct);
            formData.append('priceProduct', currentProduct.priceProduct);
            formData.append('discountProduct', currentProduct.discountProduct || 0);
            formData.append('stockProduct', tempStockValue);
            formData.append('descriptionProduct', currentProduct.descriptionProduct);
            formData.append('categoryProduct', currentProduct.categoryProduct?._id || currentProduct.categoryProduct);
            formData.append('metadata', JSON.stringify(currentProduct.metadata || {}));
            
            const existingImages = currentProduct.imagesProduct || [];
            formData.append('oldImagesProduct', JSON.stringify(existingImages));

            await updateProduct(productId, formData);
            message.success('Cập nhật tồn kho thành công!');
            setEditingStockId(null);
            fetchProducts();
        } catch (error) {
            console.error('Error updating stock:', error);
            message.error('Không thể cập nhật tồn kho');
        }
    };

    const handleComplaintReply = async () => {
        if (!selectedComplaint) return;
        setSubmittingReply(true);
        try {
            await respondToComplaint(selectedComplaint._id, {
                adminResponse: adminReplyText,
                status: selectedComplaint.status
            });
            message.success('Đã gửi phản hồi khiếu nại thành công!');
            setResponseModalVisible(false);
            fetchComplaints();
        } catch (error) {
            console.error('Error responding to complaint:', error);
            message.error('Không thể gửi phản hồi khiếu nại');
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleFlashSaleSubmit = async (values) => {
        setSubmittingFlashSale(true);
        try {
            await requestSetFlashSaleConfig(values);
            message.success('Cập nhật cấu hình Flash Sale thành công!');
            fetchFlashSale();
        } catch (error) {
            console.error('Error updating flash sale config:', error);
            message.error('Không thể cập nhật cấu hình Flash Sale');
        } finally {
            setSubmittingFlashSale(false);
        }
    };

    const setQuickDuration = (hours) => {
        const now = new Date();
        const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        flashSaleForm.setFieldsValue({
            startTime: now.toISOString().slice(0, 16),
            endTime: endTime.toISOString().slice(0, 16)
        });
        message.info(`Đã thiết lập đếm ngược trong ${hours} giờ!`);
    };

    const handleUpdateProductDiscount = async (product, newDiscount) => {
        try {
            const formData = new FormData();
            formData.append('nameProduct', product.nameProduct);
            formData.append('priceProduct', product.priceProduct);
            formData.append('discountProduct', Math.max(0, Math.min(100, Number(newDiscount) || 0)));
            formData.append('stockProduct', product.stockProduct !== undefined ? product.stockProduct : 0);
            formData.append('descriptionProduct', product.descriptionProduct);
            formData.append('categoryProduct', product.categoryProduct?._id || product.categoryProduct);
            formData.append('metadata', JSON.stringify(product.metadata || {}));
            
            if (product.imagesProduct && product.imagesProduct.length > 0) {
                product.imagesProduct.forEach(img => {
                    formData.append('oldImagesProduct', img);
                });
            }

            await updateProduct(product._id, formData);
            message.success(`Đã cập nhật mức giảm giá cho ${product.nameProduct}!`);
            setEditingDiscountId(null);
            fetchProducts();
        } catch (err) {
            console.error('Error updating discount:', err);
            message.error('Không thể cập nhật giảm giá: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRemoveFromSale = async (product) => {
        await handleUpdateProductDiscount(product, 0);
    };

    const handleBatchApplyDiscount = async () => {
        if (!selectedSaleProductKeys.length) {
            message.warning('Vui lòng chọn ít nhất 1 sản phẩm để áp dụng giảm giá!');
            return;
        }
        setIsApplyingSale(true);
        try {
            const targets = products.filter(p => selectedSaleProductKeys.includes(p._id));
            for (const prod of targets) {
                const formData = new FormData();
                formData.append('nameProduct', prod.nameProduct);
                formData.append('priceProduct', prod.priceProduct);
                formData.append('discountProduct', Number(bulkDiscountValue) || 0);
                formData.append('stockProduct', prod.stockProduct !== undefined ? prod.stockProduct : 0);
                formData.append('descriptionProduct', prod.descriptionProduct);
                formData.append('categoryProduct', prod.categoryProduct?._id || prod.categoryProduct);
                formData.append('metadata', JSON.stringify(prod.metadata || {}));
                if (prod.imagesProduct && prod.imagesProduct.length > 0) {
                    prod.imagesProduct.forEach(img => formData.append('oldImagesProduct', img));
                }
                await updateProduct(prod._id, formData);
            }
            message.success(`Đã áp dụng giảm ${bulkDiscountValue}% cho ${targets.length} sản phẩm thành công!`);
            setSelectedSaleProductKeys([]);
            setBulkDiscountModalVisible(false);
            fetchProducts();
        } catch (err) {
            console.error('Error batch updating discount:', err);
            message.error('Có lỗi xảy ra khi áp dụng giảm giá hàng loạt.');
        } finally {
            setIsApplyingSale(false);
        }
    };

    const handleBatchRemoveFromSale = async () => {
        if (!selectedSaleProductKeys.length) {
            message.warning('Vui lòng chọn ít nhất 1 sản phẩm để gỡ khỏi Flash Sale!');
            return;
        }
        setIsApplyingSale(true);
        try {
            const targets = products.filter(p => selectedSaleProductKeys.includes(p._id));
            for (const prod of targets) {
                const formData = new FormData();
                formData.append('nameProduct', prod.nameProduct);
                formData.append('priceProduct', prod.priceProduct);
                formData.append('discountProduct', 0);
                formData.append('stockProduct', prod.stockProduct !== undefined ? prod.stockProduct : 0);
                formData.append('descriptionProduct', prod.descriptionProduct);
                formData.append('categoryProduct', prod.categoryProduct?._id || prod.categoryProduct);
                formData.append('metadata', JSON.stringify(prod.metadata || {}));
                if (prod.imagesProduct && prod.imagesProduct.length > 0) {
                    prod.imagesProduct.forEach(img => formData.append('oldImagesProduct', img));
                }
                await updateProduct(prod._id, formData);
            }
            message.success(`Đã gỡ ${targets.length} sản phẩm ra khỏi chương trình Flash Sale!`);
            setSelectedSaleProductKeys([]);
            fetchProducts();
        } catch (err) {
            console.error('Error batch removing from sale:', err);
            message.error('Có lỗi xảy ra khi gỡ sản phẩm khỏi Sale.');
        } finally {
            setIsApplyingSale(false);
        }
    };

    const handleAddSelectedProductsToSale = async () => {
        if (!selectedProductsToAdd.length) {
            message.warning('Vui lòng tích chọn ít nhất 1 sản phẩm để thêm vào Flash Sale!');
            return;
        }
        setIsApplyingSale(true);
        try {
            const targets = products.filter(p => selectedProductsToAdd.includes(p._id));
            for (const prod of targets) {
                const formData = new FormData();
                formData.append('nameProduct', prod.nameProduct);
                formData.append('priceProduct', prod.priceProduct);
                formData.append('discountProduct', Number(defaultDiscountToAdd) || 10);
                formData.append('stockProduct', prod.stockProduct !== undefined ? prod.stockProduct : 0);
                formData.append('descriptionProduct', prod.descriptionProduct);
                formData.append('categoryProduct', prod.categoryProduct?._id || prod.categoryProduct);
                formData.append('metadata', JSON.stringify(prod.metadata || {}));
                if (prod.imagesProduct && prod.imagesProduct.length > 0) {
                    prod.imagesProduct.forEach(img => formData.append('oldImagesProduct', img));
                }
                await updateProduct(prod._id, formData);
            }
            message.success(`Đã thêm ${targets.length} sản phẩm vào Flash Sale với mức giảm ${defaultDiscountToAdd}%!`);
            setSelectedProductsToAdd([]);
            setAddSaleModalVisible(false);
            fetchProducts();
        } catch (err) {
            console.error('Error adding products to sale:', err);
            message.error('Có lỗi xảy ra khi thêm sản phẩm vào Sale.');
        } finally {
            setIsApplyingSale(false);
        }
    };

    const openSizeStockModal = (product) => {
        setSelectedSizeProduct(product);
        let stockMap = {};
        if (product.metadata?.sizeStock && typeof product.metadata.sizeStock === 'object') {
            stockMap = { ...product.metadata.sizeStock };
        } else {
            const sizeList = (product.metadata?.size || '38, 39, 40, 41, 42, 43')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            
            const total = product.stockProduct || 0;
            const perSize = sizeList.length > 0 ? Math.floor(total / sizeList.length) : 0;
            const remainder = sizeList.length > 0 ? total % sizeList.length : 0;
            
            sizeList.forEach((s, idx) => {
                stockMap[s] = perSize + (idx === 0 ? remainder : 0);
            });
        }
        setSizeStockMap(stockMap);
        setSizeModalVisible(true);
    };

    const handleSaveSizeStock = async () => {
        if (!selectedSizeProduct) return;
        setSavingSizeStock(true);
        try {
            const newTotalStock = Object.values(sizeStockMap).reduce((sum, val) => sum + (Number(val) || 0), 0);
            const sizeKeys = Object.keys(sizeStockMap).sort((a, b) => parseFloat(a) - parseFloat(b));
            
            const formData = new FormData();
            formData.append('nameProduct', selectedSizeProduct.nameProduct);
            formData.append('priceProduct', selectedSizeProduct.priceProduct);
            formData.append('costPrice', selectedSizeProduct.costPrice || 0);
            formData.append('discountProduct', selectedSizeProduct.discountProduct || 0);
            formData.append('stockProduct', newTotalStock);
            formData.append('descriptionProduct', selectedSizeProduct.descriptionProduct);
            formData.append('categoryProduct', selectedSizeProduct.categoryProduct?._id || selectedSizeProduct.categoryProduct);
            
            const newMetadata = {
                ...(selectedSizeProduct.metadata || {}),
                sizeStock: sizeStockMap,
                size: sizeKeys.join(', ')
            };
            formData.append('metadata', JSON.stringify(newMetadata));

            if (selectedSizeProduct.imagesProduct && selectedSizeProduct.imagesProduct.length > 0) {
                selectedSizeProduct.imagesProduct.forEach(img => {
                    formData.append('oldImagesProduct', img);
                });
            }

            await updateProduct(selectedSizeProduct._id, formData);
            message.success(`Đã cập nhật tồn kho chi tiết cho ${selectedSizeProduct.nameProduct}! Tổng tồn: ${newTotalStock} đôi`);
            setSizeModalVisible(false);
            fetchProducts();
        } catch (err) {
            console.error('Error saving size stock:', err);
            message.error('Không thể lưu tồn kho theo size');
        } finally {
            setSavingSizeStock(false);
        }
    };

    const handleAddNewSize = () => {
        const trimmed = newSizeName.trim();
        if (!trimmed) return;
        if (sizeStockMap[trimmed] !== undefined) {
            message.warning(`Size ${trimmed} đã có trong danh sách!`);
            return;
        }
        setSizeStockMap(prev => ({ ...prev, [trimmed]: 0 }));
        setNewSizeName('');
    };

    const handleRemoveSize = (sizeKey) => {
        setSizeStockMap(prev => {
            const next = { ...prev };
            delete next[sizeKey];
            return next;
        });
    };

    const renderInventory = () => {
        const totalPairs = products.reduce((sum, p) => sum + (Number(p.stockProduct) || 0), 0);
        const totalCostInventory = products.reduce((sum, p) => {
            const cost = Number(p.costPrice) || Math.round((Number(p.priceProduct) || 0) * 0.6);
            return sum + cost * (Number(p.stockProduct) || 0);
        }, 0);
        const outOfStockCount = products.filter(p => (Number(p.stockProduct) || 0) === 0).length;
        const lowStockCount = products.filter(p => {
            const s = Number(p.stockProduct) || 0;
            return s > 0 && s < 5;
        }).length;

        // Filter inventory
        const filteredInventory = products.filter(p => {
            const matchesSearch = !inventorySearch.trim() || 
                p.nameProduct?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                p.metadata?.sku?.toLowerCase().includes(inventorySearch.toLowerCase());
            
            const matchesCat = inventoryCategoryFilter === 'all' || 
                (p.categoryProduct?._id || p.categoryProduct) === inventoryCategoryFilter;
            
            const stock = Number(p.stockProduct) || 0;
            let matchesStatus = true;
            if (inventoryStatusFilter === 'out_of_stock') matchesStatus = stock === 0;
            else if (inventoryStatusFilter === 'low_stock') matchesStatus = stock > 0 && stock < 5;
            else if (inventoryStatusFilter === 'in_stock') matchesStatus = stock >= 5;

            return matchesSearch && matchesCat && matchesStatus;
        });

        const columns = [
            {
                title: 'Hình ảnh',
                dataIndex: 'imagesProduct',
                key: 'imagesProduct',
                width: 70,
                render: (images) => (
                    <img
                        src={images?.[0] || 'https://via.placeholder.com/50'}
                        alt="sneaker"
                        className="w-12 h-12 object-cover rounded-lg border bg-gray-50 shadow-2xs"
                    />
                )
            },
            {
                title: 'Mẫu giày & SKU',
                key: 'nameProduct',
                width: 250,
                render: (_, record) => {
                    const cat = categories.find(c => c._id === (record.categoryProduct?._id || record.categoryProduct));
                    return (
                        <div className="space-y-0.5">
                            <span className="font-bold text-gray-900 block text-xs line-clamp-1">{record.nameProduct}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {cat && <Tag color="blue" className="text-[10px] px-1.5 py-0 border-none font-medium">{cat.nameCategory}</Tag>}
                                <span className="text-[11px] font-mono text-gray-500">
                                    SKU: {record.metadata?.sku || record.metadata?.author || record._id.slice(-6).toUpperCase()}
                                </span>
                            </div>
                            {(record.metadata?.colorway || record.metadata?.author) && (
                                <span className="text-[11px] text-gray-500 block">
                                    Màu: {record.metadata.colorway || record.metadata.author}
                                </span>
                            )}
                        </div>
                    );
                }
            },
            {
                title: 'Giá bán / Giá vốn',
                key: 'pricing',
                width: 150,
                render: (_, record) => {
                    const cost = Number(record.costPrice) || Math.round((Number(record.priceProduct) || 0) * 0.6);
                    return (
                        <div>
                            <span className="font-bold text-gray-900 block text-xs">{formatPrice(record.priceProduct)}</span>
                            <span className="text-[11px] text-gray-500">
                                Giá vốn: <span className="font-medium text-gray-700">{formatPrice(cost)}</span>
                            </span>
                        </div>
                    );
                }
            },
            {
                title: 'Tồn kho theo Size (Size Matrix)',
                key: 'sizeStock',
                render: (_, record) => {
                    const sizeStock = record.metadata?.sizeStock;
                    if (sizeStock && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0) {
                        const sortedSizes = Object.keys(sizeStock).sort((a, b) => parseFloat(a) - parseFloat(b));
                        return (
                            <div className="flex flex-wrap gap-1 max-w-sm">
                                {sortedSizes.map(sz => {
                                    const qty = Number(sizeStock[sz]) || 0;
                                    const isZero = qty === 0;
                                    const isLow = qty > 0 && qty < 3;
                                    return (
                                        <span
                                            key={sz}
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono border ${
                                                isZero 
                                                    ? 'bg-red-50 text-red-600 border-red-200 font-bold' 
                                                    : isLow 
                                                    ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' 
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                                            }`}
                                            title={`Size ${sz}: ${qty} đôi`}
                                        >
                                            <span className="font-bold">{sz}:</span>
                                            <span>{qty}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        );
                    }
                    const sizes = record.metadata?.size ? record.metadata.size.split(',').map(s => s.trim()).filter(Boolean) : [];
                    return (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 italic">
                                {sizes.length > 0 ? `${sizes.length} sizes: ${sizes.join(', ')}` : 'Chưa phân size'}
                            </span>
                            <Button 
                                size="small" 
                                type="link" 
                                onClick={() => openSizeStockModal(record)} 
                                className="text-blue-600 text-xs p-0 font-bold"
                            >
                                Phân bổ size ngay
                            </Button>
                        </div>
                    );
                }
            },
            {
                title: 'Tổng tồn',
                key: 'stockProduct',
                width: 120,
                render: (_, record) => {
                    const isEditing = editingStockId === record._id;
                    return isEditing ? (
                        <div className="flex items-center gap-1">
                            <InputNumber
                                min={0}
                                value={tempStockValue}
                                onChange={(value) => setTempStockValue(value || 0)}
                                className="w-16"
                                size="small"
                            />
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => handleUpdateStock(record._id, record)}
                                className="bg-black text-white hover:bg-zinc-800 border-none rounded px-2"
                            >
                                ✓
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setEditingStockId(null)}
                                className="rounded px-2"
                            >
                                ✕
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 group">
                            <span className="font-mono font-extrabold text-sm text-gray-900">{record.stockProduct || 0}</span>
                            <span className="text-xs text-gray-500">đôi</span>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined className="text-gray-400 group-hover:text-black" />}
                                onClick={() => {
                                    setEditingStockId(record._id);
                                    setTempStockValue(record.stockProduct || 0);
                                }}
                            />
                        </div>
                    );
                }
            },
            {
                title: 'Trạng thái',
                key: 'stockStatus',
                width: 110,
                render: (_, record) => {
                    const stock = Number(record.stockProduct) || 0;
                    if (stock === 0) {
                        return <Tag color="error" className="font-semibold rounded-full border px-2 py-0.5">Hết hàng</Tag>;
                    } else if (stock < 5) {
                        return <Tag color="warning" className="font-semibold rounded-full border px-2 py-0.5">Sắp hết ({stock})</Tag>;
                    } else {
                        return <Tag color="success" className="font-semibold rounded-full border px-2 py-0.5">Còn hàng</Tag>;
                    }
                }
            },
            {
                title: 'Thao tác',
                key: 'actions',
                width: 120,
                render: (_, record) => (
                    <Button
                        size="small"
                        type="default"
                        onClick={() => openSizeStockModal(record)}
                        className="bg-gray-100 hover:bg-black hover:text-white text-gray-800 font-bold border-gray-300 rounded-lg text-xs"
                    >
                        Quản lý size
                    </Button>
                )
            }
        ];

        return (
            <div className="space-y-6">
                {/* 1. Inventory Top KPI Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng tồn kho toàn shop</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Layers className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mt-2">{totalPairs.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-gray-500">đôi giày</span></h3>
                        <p className="text-[11px] text-gray-500 mt-1">Đang quản lý trên {products.length} mã sản phẩm</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng vốn tồn kho</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <DollarSign className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{formatPrice(totalCostInventory)}</h3>
                        <p className="text-[11px] text-gray-500 mt-1">Dựa trên giá vốn nhập hàng thực tế</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mẫu giày sắp hết</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <WarningOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-amber-600 mt-2">{lowStockCount} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-amber-700 font-medium mt-1">⚠️ Dưới 5 đôi, cần lên đơn nhập thêm</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mẫu giày đã hết hàng</span>
                            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                                <CloseOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-red-600 mt-2">{outOfStockCount} <span className="text-sm font-semibold text-gray-500">mẫu</span></h3>
                        <p className="text-[11px] text-red-700 font-medium mt-1">❌ Kho = 0 đôi, khách không thể đặt</p>
                    </div>
                </div>

                {/* 2. Inventory Filter and Search Bar */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Báo cáo tồn kho & Phân bổ Size giày</h3>
                            <p className="text-xs text-gray-500">Kiểm soát chi tiết số lượng từng size (36-45), giá vốn và tình trạng lưu kho</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1 max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên giày hoặc mã SKU..."
                                value={inventorySearch}
                                onChange={(e) => setInventorySearch(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black w-full"
                            />
                        </div>
                        <Select
                            value={inventoryCategoryFilter}
                            style={{ width: 180 }}
                            onChange={setInventoryCategoryFilter}
                            className="text-xs"
                        >
                            <Option value="all">Tất cả thương hiệu</Option>
                            {categories.map(cat => (
                                <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                            ))}
                        </Select>
                        <Select
                            value={inventoryStatusFilter}
                            style={{ width: 160 }}
                            onChange={setInventoryStatusFilter}
                            className="text-xs"
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="in_stock">🟢 Còn hàng (≥ 5)</Option>
                            <Option value="low_stock">🟡 Sắp hết hàng (&lt; 5)</Option>
                            <Option value="out_of_stock">🔴 Đã hết hàng (= 0)</Option>
                        </Select>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredInventory}
                        rowKey="_id"
                        loading={loadingProducts}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden mt-3"
                    />
                </div>
            </div>
        );
    };

    const renderComplaints = () => {
        const totalComplaints = complaints.length;
        const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
        const processingComplaints = complaints.filter(c => c.status === 'processing').length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        const rejectedComplaints = complaints.filter(c => c.status === 'rejected').length;
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

        const filteredComplaints = complaints.filter(c => {
            const matchesStatus = complaintStatusFilter === 'all' || c.status === complaintStatusFilter;
            const searchLower = (complaintSearch || '').toLowerCase().trim();
            if (!searchLower) return matchesStatus;

            const customerName = (c.userId?.fullName || '').toLowerCase();
            const customerEmail = (c.userId?.email || '').toLowerCase();
            const orderId = (c.paymentId?._id || '').toLowerCase();
            const reason = (c.reason || '').toLowerCase();
            const content = (c.content || '').toLowerCase();

            return matchesStatus && (
                customerName.includes(searchLower) ||
                customerEmail.includes(searchLower) ||
                orderId.includes(searchLower) ||
                reason.includes(searchLower) ||
                content.includes(searchLower)
            );
        });

        const columns = [
            {
                title: 'Khách hàng',
                key: 'user',
                render: (_, record) => {
                    const user = record.userId || {};
                    return (
                        <div>
                            <p className="font-bold text-gray-900">{user.fullName || 'Khách vãng lai'}</p>
                            <p className="text-xs text-gray-400">{user.email || 'Chưa có email'}</p>
                            {user.phoneNumber && <p className="text-xs text-gray-500 font-mono mt-0.5">📞 {user.phoneNumber}</p>}
                        </div>
                    );
                }
            },
            {
                title: 'Mã đơn hàng',
                dataIndex: 'paymentId',
                key: 'paymentId',
                render: (payment) => (
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded font-semibold">
                            #{payment?._id?.slice(-8) || 'N/A'}
                        </span>
                        {payment?._id && (
                            <button
                                type="button"
                                title="Sao chép toàn bộ mã đơn"
                                onClick={() => {
                                    navigator.clipboard.writeText(payment._id);
                                    message.success('Đã chép mã đơn hàng');
                                }}
                                className="text-gray-400 hover:text-black transition"
                            >
                                <CopyOutlined className="text-xs" />
                            </button>
                        )}
                    </div>
                )
            },
            {
                title: 'Phân loại & Lý do',
                key: 'category_reason',
                render: (_, record) => {
                    const reason = (record.reason || '').toLowerCase();
                    const content = (record.content || '').toLowerCase();
                    const isSize = reason.includes('size') || reason.includes('chật') || reason.includes('rộng') || content.includes('size') || content.includes('chật') || content.includes('rộng');
                    const isDefect = reason.includes('lỗi') || reason.includes('keo') || reason.includes('rách') || reason.includes('bong') || reason.includes('đế') || content.includes('keo');
                    const isShipping = reason.includes('giao') || reason.includes('chậm') || reason.includes('móp') || reason.includes('hộp');

                    return (
                        <div className="space-y-1">
                            {isSize && <Tag color="blue" className="font-bold text-[11px] rounded-full">👟 Đổi Size</Tag>}
                            {isDefect && <Tag color="red" className="font-bold text-[11px] rounded-full">⚠️ Lỗi Sản Phẩm</Tag>}
                            {isShipping && <Tag color="orange" className="font-bold text-[11px] rounded-full">🚚 Vận Chuyển</Tag>}
                            {!isSize && !isDefect && !isShipping && <Tag color="purple" className="font-bold text-[11px] rounded-full">📦 Khiếu Nại</Tag>}
                            <p className="font-semibold text-gray-800 text-xs mt-0.5">{record.reason}</p>
                        </div>
                    );
                }
            },
            {
                title: 'Chi tiết khiếu nại',
                dataIndex: 'content',
                key: 'content',
                render: (text) => (
                    <Popover content={<div className="max-w-sm text-xs text-gray-800 whitespace-pre-wrap">{text}</div>} title="Nội dung khiếu nại">
                        <span className="text-xs text-gray-700 block max-w-xs truncate cursor-help hover:text-blue-600 transition">
                            {text}
                        </span>
                    </Popover>
                )
            },
            {
                title: 'Bằng chứng ảnh',
                dataIndex: 'images',
                key: 'images',
                render: (imgs) => {
                    const list = imgs || [];
                    if (list.length === 0) return <span className="text-xs text-gray-400 italic">Không có ảnh</span>;
                    return (
                        <div className="flex gap-1.5 flex-wrap">
                            {list.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt="evidence"
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 hover:shadow transition"
                                    onClick={() => window.open(img)}
                                    title="Nhấn để xem kích thước đầy đủ"
                                />
                            ))}
                        </div>
                    );
                }
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                    const colors = {
                        pending: 'warning',
                        processing: 'processing',
                        resolved: 'success',
                        rejected: 'error'
                    };
                    const texts = {
                        pending: 'Chờ xử lý',
                        processing: 'Đang xử lý',
                        resolved: 'Đã giải quyết',
                        rejected: 'Từ chối'
                    };
                    return (
                        <Tag color={colors[status] || 'default'} className="font-bold text-xs px-2.5 py-0.5 rounded-full">
                            {texts[status] || status}
                        </Tag>
                    );
                }
            },
            {
                title: 'Phản hồi từ shop',
                key: 'adminReply',
                render: (_, record) => {
                    if (record.adminResponse) {
                        return (
                            <Popover content={<div className="max-w-xs text-xs text-gray-800 whitespace-pre-wrap">{record.adminResponse}</div>} title="Nội dung shop phản hồi">
                                <Tag color="green" className="cursor-help font-semibold text-[11px] rounded-full">
                                    ✓ Đã phản hồi
                                </Tag>
                            </Popover>
                        );
                    }
                    return (
                        <Tag color="orange" className="font-semibold text-[11px] rounded-full">
                            Chưa phản hồi
                        </Tag>
                    );
                }
            },
            {
                title: 'Hành động',
                key: 'actions',
                render: (_, record) => (
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedComplaint(record);
                            setAdminReplyText(record.adminResponse || '');
                            setResponseModalVisible(true);
                        }}
                        className="bg-black hover:bg-zinc-800 text-white font-medium flex items-center justify-center border-none rounded-lg px-3"
                    >
                        Xử lý ngay
                    </Button>
                )
            }
        ];

        return (
            <div className="space-y-6">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tổng khiếu nại</span>
                            <span className="p-2 bg-zinc-100 text-zinc-800 rounded-xl">
                                <MessageSquare className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-gray-900">{totalComplaints}</div>
                            <p className="text-xs text-gray-400 mt-0.5">Toàn bộ yêu cầu bảo hành & đổi hàng</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Cần xử lý gấp</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-amber-600">{pendingComplaints}</div>
                            <p className="text-xs text-amber-700 font-medium mt-0.5">Đơn khiếu nại đang chờ shop duyệt</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Đang giải quyết</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <ReloadOutlined className="text-base" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-blue-600">{processingComplaints}</div>
                            <p className="text-xs text-blue-700 font-medium mt-0.5">Đang liên hệ khách hoặc kiểm tra giày</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Tỷ lệ giải quyết</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-emerald-600">{resolutionRate}%</div>
                            <p className="text-xs text-emerald-700 font-medium mt-0.5">{resolvedComplaints} khiếu nại xử lý thỏa đáng</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Complaint Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-955">Hộp thư Khiếu nại & Đổi hàng Sneaker</h3>
                            <p className="text-xs text-gray-500">Tiếp nhận, thẩm định bằng chứng và phản hồi yêu cầu đổi size hoặc lỗi kỹ thuật</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Input
                                placeholder="Tìm theo tên khách, email, mã đơn..."
                                value={complaintSearch}
                                onChange={(e) => setComplaintSearch(e.target.value)}
                                prefix={<SearchIcon className="w-4 h-4 text-gray-400 mr-1" />}
                                className="w-64 rounded-xl"
                                allowClear
                            />

                            <Select
                                value={complaintStatusFilter}
                                onChange={setComplaintStatusFilter}
                                style={{ width: 170 }}
                                className="light-select"
                            >
                                <Option value="all">Tất cả trạng thái</Option>
                                <Option value="pending">🟡 Chờ xử lý</Option>
                                <Option value="processing">🔵 Đang xử lý</Option>
                                <Option value="resolved">🟢 Đã giải quyết</Option>
                                <Option value="rejected">🔴 Từ chối</Option>
                            </Select>

                            {(complaintSearch || complaintStatusFilter !== 'all') && (
                                <Button
                                    onClick={() => {
                                        setComplaintSearch('');
                                        setComplaintStatusFilter('all');
                                    }}
                                    className="rounded-xl"
                                >
                                    Đặt lại
                                </Button>
                            )}
                        </div>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredComplaints}
                        rowKey="_id"
                        loading={loadingComplaints}
                        pagination={{ pageSize: 7, showTotal: (total) => `Tổng cộng ${total} khiếu nại` }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                    />
                </div>
            </div>
        );
    };

    const renderFlashSale = () => {
        const allSaleProducts = products.filter(p => p.discountProduct > 0);
        
        // Filter sale products by search keyword and category
        const filteredSaleProducts = allSaleProducts.filter(p => {
            const matchesSearch = p.nameProduct.toLowerCase().includes(flashSaleSearch.toLowerCase());
            const matchesBrand = flashSaleCategoryFilter === 'all' || 
                (p.categoryProduct?._id || p.categoryProduct) === flashSaleCategoryFilter;
            return matchesSearch && matchesBrand;
        });

        // Non-sale products available to be added to Flash Sale
        const nonSaleProducts = products.filter(p => !p.discountProduct || p.discountProduct === 0);
        const filteredNonSaleProducts = nonSaleProducts.filter(p => {
            const matchesSearch = p.nameProduct.toLowerCase().includes(searchAddProduct.toLowerCase());
            const matchesBrand = brandAddProduct === 'all' || 
                (p.categoryProduct?._id || p.categoryProduct) === brandAddProduct;
            return matchesSearch && matchesBrand;
        });

        // Statistics
        const totalSaleCount = allSaleProducts.length;
        const avgDiscount = totalSaleCount > 0 
            ? Math.round(allSaleProducts.reduce((sum, p) => sum + (p.discountProduct || 0), 0) / totalSaleCount)
            : 0;
        const maxDiscountProduct = totalSaleCount > 0
            ? [...allSaleProducts].sort((a, b) => b.discountProduct - a.discountProduct)[0]
            : null;

        // Campaign live status calculation
        const now = Date.now();
        const startTimeMs = flashSaleData?.startTime ? new Date(flashSaleData.startTime).getTime() : now;
        const endTimeMs = flashSaleData?.endTime ? new Date(flashSaleData.endTime).getTime() : now;
        const isCampaignActive = flashSaleData?.isActive !== false;

        let statusKey = 'paused';
        let statusBadge = { text: 'Tạm dừng', color: 'border-red-300 bg-red-50 text-red-700', dot: 'bg-red-500' };
        if (!isCampaignActive) {
            statusKey = 'paused';
            statusBadge = { text: 'Tạm dừng', color: 'border-red-300 bg-red-50 text-red-700', dot: 'bg-red-500' };
        } else if (now < startTimeMs) {
            statusKey = 'scheduled';
            statusBadge = { text: 'Sắp diễn ra (Hẹn giờ)', color: 'border-blue-300 bg-blue-50 text-blue-700', dot: 'bg-blue-500' };
        } else if (now >= startTimeMs && now < endTimeMs) {
            statusKey = 'live';
            statusBadge = { text: 'Đang diễn ra (LIVE)', color: 'border-emerald-300 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500 animate-pulse' };
        } else {
            statusKey = 'expired';
            statusBadge = { text: 'Đã kết thúc', color: 'border-gray-300 bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
        }

        // Countdown string
        let countdownStr = '00:00:00';
        if (statusKey === 'live') {
            const distance = endTimeMs - now;
            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // Toggle select all sale products
        const handleSelectAllSale = (e) => {
            if (e.target.checked) {
                setSelectedSaleProductKeys(filteredSaleProducts.map(p => p._id));
            } else {
                setSelectedSaleProductKeys([]);
            }
        };

        const handleSelectSaleProduct = (id) => {
            if (selectedSaleProductKeys.includes(id)) {
                setSelectedSaleProductKeys(selectedSaleProductKeys.filter(k => k !== id));
            } else {
                setSelectedSaleProductKeys([...selectedSaleProductKeys, id]);
            }
        };

        return (
            <div className="space-y-6 font-sans">
                {/* 1. Header Title */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <ThunderboltOutlined className="text-amber-500" />
                            <span>Cấu hình sự kiện Flash Sale & Khuyến mãi</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Thiết lập thời gian đếm ngược, theo dõi hiệu quả và quản lý danh sách sản phẩm giảm giá trực tiếp
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadge.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
                            {statusBadge.text}
                        </span>
                    </div>
                </div>

                {/* 2. TOP METRIC CARDS (3 Stat Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Trạng thái & Đếm ngược */}
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Tiến độ chiến dịch
                        </span>
                        <div className="flex items-baseline justify-between pt-1">
                            <div>
                                <span className="text-xl font-black text-gray-900 font-mono">
                                    {statusKey === 'live' ? countdownStr : statusBadge.text}
                                </span>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {statusKey === 'live' ? 'Đang đếm ngược trực tiếp trên trang chủ' : 'Chiến dịch chưa chạy hoặc đã kết thúc'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Số sản phẩm đang Sale */}
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <FireOutlined className="text-red-500" />
                            Quy mô sự kiện
                        </span>
                        <div className="flex items-baseline justify-between pt-1">
                            <div>
                                <span className="text-xl font-black text-gray-900">
                                    {totalSaleCount} <span className="text-xs font-normal text-gray-500">mẫu giày</span>
                                </span>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Mức giảm trung bình: <strong className="text-red-600 font-bold">{avgDiscount}%</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Sản phẩm giảm sâu nhất */}
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            Giảm giá sâu nhất
                        </span>
                        <div className="flex items-baseline justify-between pt-1">
                            {maxDiscountProduct ? (
                                <div className="truncate max-w-[240px]">
                                    <span className="text-xl font-black text-red-600">
                                        -{Math.round(maxDiscountProduct.discountProduct)}%
                                    </span>
                                    <p className="text-[11px] text-gray-600 truncate mt-0.5 font-medium">
                                        {maxDiscountProduct.nameProduct}
                                    </p>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">Chưa có sản phẩm</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. MAIN WORKSPACE: Left (Settings) & Right (Products Management) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Campaign Settings Form */}
                    <div className="lg:col-span-4 bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-5">
                        <div className="border-b pb-3">
                            <h4 className="font-extrabold text-base text-gray-900">Cài đặt chiến dịch</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Thiết lập tiêu đề và thời gian hiển thị đồng hồ</p>
                        </div>

                        <Form
                            form={flashSaleForm}
                            layout="vertical"
                            onFinish={handleFlashSaleSubmit}
                            className="space-y-4"
                        >
                            <Form.Item
                                label={<span className="font-semibold text-xs text-gray-700">Tiêu đề chiến dịch</span>}
                                name="title"
                                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chiến dịch' }]}
                            >
                                <Input placeholder="Ví dụ: FLASH SALE CUỐI TUẦN" className="rounded-xl py-2 font-medium" />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-xs text-gray-700">Thời gian bắt đầu (Hẹn giờ)</span>}
                                name="startTime"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
                            >
                                <Input type="datetime-local" className="rounded-xl py-2" />
                            </Form.Item>

                            <Form.Item
                                label={<span className="font-semibold text-xs text-gray-700">Thời gian kết thúc (Đếm ngược)</span>}
                                name="endTime"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
                            >
                                <Input type="datetime-local" className="rounded-xl py-2" />
                            </Form.Item>

                            {/* Quick duration buttons */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] font-bold uppercase text-gray-500">Đặt thời gian nhanh:</label>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(2)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition border border-gray-200"
                                    >
                                        +2h
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(6)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition border border-gray-200"
                                    >
                                        +6h
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(12)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition border border-gray-200"
                                    >
                                        +12h
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(24)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition border border-gray-200"
                                    >
                                        +24h
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickDuration(72)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition border border-gray-200"
                                    >
                                        3 Ngày
                                    </button>
                                </div>
                            </div>

                            <Form.Item
                                label={<span className="font-semibold text-xs text-gray-700">Trạng thái kích hoạt</span>}
                                name="isActive"
                                rules={[{ required: true }]}
                            >
                                <Select className="rounded-xl font-medium" style={{ height: 40 }}>
                                    <Option value={true}>🟢 Đang hoạt động (Kích hoạt đếm ngược)</Option>
                                    <Option value={false}>🔴 Tạm dừng chiến dịch</Option>
                                </Select>
                            </Form.Item>

                            {/* Demo Banner Preview */}
                            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Xem trước trên trang chủ:</span>
                                <div className="bg-white border border-gray-200 p-3 rounded-lg text-center shadow-2xs space-y-1">
                                    <h5 className="font-black text-xs uppercase tracking-widest text-black">
                                        {flashSaleForm.getFieldValue('title') || 'FLASH SALE CHỚP NHOÁNG'}
                                    </h5>
                                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-red-600">
                                        <span>⚡ Kết thúc sau:</span>
                                        <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono text-[10px]">02</span>:
                                        <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono text-[10px]">45</span>:
                                        <span className="bg-black text-white px-1.5 py-0.5 rounded font-mono text-[10px]">19</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submittingFlashSale}
                                className="w-full bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold h-11 border-none rounded-xl shadow-xs text-sm"
                            >
                                Lưu cấu hình chiến dịch
                            </Button>
                        </Form>
                    </div>

                    {/* RIGHT COLUMN: Products in Flash Sale Management */}
                    <div className="lg:col-span-8 bg-white border border-gray-200 p-6 rounded-2xl shadow-xs space-y-4">
                        {/* Header & Quick Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                            <div>
                                <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                                    <span>Sản phẩm đang giảm giá ({filteredSaleProducts.length})</span>
                                    {selectedSaleProductKeys.length > 0 && (
                                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                                            Đã chọn {selectedSaleProductKeys.length}
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500">Quản lý và điều chỉnh mức giá ưu đãi trực tiếp</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddSaleModalVisible(true)}
                                    className="bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl h-8 border-none flex items-center"
                                >
                                    + Thêm giày vào Sale
                                </Button>

                                <Button
                                    disabled={!selectedSaleProductKeys.length}
                                    onClick={() => setBulkDiscountModalVisible(true)}
                                    className="font-semibold text-xs rounded-xl h-8 border-gray-300 hover:border-black text-gray-700"
                                >
                                    Giảm giá hàng loạt
                                </Button>

                                <Popconfirm
                                    title={`Bạn có chắc muốn gỡ ${selectedSaleProductKeys.length} sản phẩm khỏi Flash Sale?`}
                                    okText="Đồng ý gỡ"
                                    cancelText="Hủy"
                                    disabled={!selectedSaleProductKeys.length}
                                    onConfirm={handleBatchRemoveFromSale}
                                >
                                    <Button
                                        danger
                                        disabled={!selectedSaleProductKeys.length}
                                        className="font-semibold text-xs rounded-xl h-8"
                                    >
                                        Gỡ khỏi Sale
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-1">
                            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
                                <Input
                                    placeholder="Tìm theo tên giày đang sale..."
                                    value={flashSaleSearch}
                                    onChange={(e) => setFlashSaleSearch(e.target.value)}
                                    prefix={<SearchIcon className="w-4 h-4 text-gray-400 mr-1" />}
                                    allowClear
                                    className="rounded-xl text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select
                                    value={flashSaleCategoryFilter}
                                    onChange={setFlashSaleCategoryFilter}
                                    style={{ width: 170 }}
                                    className="text-xs rounded-xl"
                                >
                                    <Option value="all">Tất cả thương hiệu</Option>
                                    {categories.map(cat => (
                                        <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        {/* Table / List of Products with Select All Checkbox */}
                        {filteredSaleProducts.length > 0 && (
                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl text-xs text-gray-600 font-medium">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={selectedSaleProductKeys.length === filteredSaleProducts.length && filteredSaleProducts.length > 0}
                                        onChange={handleSelectAllSale}
                                        className="w-4 h-4 rounded cursor-pointer text-blue-600"
                                    />
                                    <span>Chọn tất cả ({filteredSaleProducts.length} sản phẩm)</span>
                                </label>
                                <span>Thao tác trực tiếp trên từng sản phẩm</span>
                            </div>
                        )}

                        {/* Products List Scrollable Container */}
                        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto pr-1 space-y-1">
                            {filteredSaleProducts.map(p => {
                                const roundedDiscount = Math.round(p.discountProduct || 0);
                                const originalPrice = p.priceProduct || 0;
                                const salePrice = Math.round(originalPrice * (1 - roundedDiscount / 100));
                                const isSelected = selectedSaleProductKeys.includes(p._id);
                                const isEditing = editingDiscountId === p._id;

                                return (
                                    <div
                                        key={p._id}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${
                                            isSelected ? 'bg-blue-50/60 border border-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectSaleProduct(p._id)}
                                            className="w-4 h-4 rounded cursor-pointer text-blue-600 shrink-0"
                                        />

                                        {/* Product Thumbnail */}
                                        <img
                                            src={p.imagesProduct?.[0] || 'https://via.placeholder.com/60'}
                                            alt={p.nameProduct}
                                            className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0 bg-white"
                                        />

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <p className="font-bold text-sm text-gray-900 truncate" title={p.nameProduct}>
                                                {p.nameProduct}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-500">
                                                    Kho: <strong className="text-gray-800">{p.stockProduct || 0}</strong>
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-gray-500">
                                                    Hãng: <strong className="text-gray-800">{p.categoryProduct?.nameCategory || 'Khác'}</strong>
                                                </span>
                                            </div>

                                            {/* Price & Discount Display */}
                                            <div className="flex items-center gap-2 pt-0.5">
                                                <span className="text-sm font-black text-red-600">
                                                    {formatPrice(salePrice)}
                                                </span>
                                                <span className="text-xs text-gray-400 line-through">
                                                    {formatPrice(originalPrice)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Discount Controller */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 bg-white border border-blue-400 p-1 rounded-lg shadow-sm">
                                                    <InputNumber
                                                        min={1}
                                                        max={99}
                                                        value={tempDiscountValue}
                                                        onChange={(v) => setTempDiscountValue(v)}
                                                        className="w-16 text-xs"
                                                        size="small"
                                                        addonAfter="%"
                                                    />
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<CheckOutlined />}
                                                        onClick={() => handleUpdateProductDiscount(p, tempDiscountValue)}
                                                        className="bg-blue-600 border-none h-6 w-6 p-0 flex items-center justify-center rounded"
                                                    />
                                                    <Button
                                                        size="small"
                                                        icon={<CloseOutlined />}
                                                        onClick={() => setEditingDiscountId(null)}
                                                        className="h-6 w-6 p-0 flex items-center justify-center rounded"
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingDiscountId(p._id);
                                                        setTempDiscountValue(roundedDiscount);
                                                    }}
                                                    title="Bấm để chỉnh sửa % giảm giá nhanh"
                                                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition flex items-center gap-1"
                                                >
                                                    <span>-{roundedDiscount}%</span>
                                                    <EditOutlined className="text-[10px]" />
                                                </button>
                                            )}

                                            {/* 1-Click Remove Button */}
                                            <Popconfirm
                                                title="Gỡ khỏi Flash Sale?"
                                                description={`Bạn có chắc muốn gỡ "${p.nameProduct}" khỏi Sale?`}
                                                okText="Gỡ bỏ"
                                                cancelText="Hủy"
                                                onConfirm={() => handleRemoveFromSale(p)}
                                            >
                                                <button
                                                    type="button"
                                                    title="Gỡ sản phẩm ra khỏi sự kiện Sale"
                                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer border-none bg-transparent"
                                                >
                                                    <DeleteOutlined className="text-sm" />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredSaleProducts.length === 0 && (
                                <div className="py-14 text-center space-y-2">
                                    <ThunderboltOutlined className="text-4xl text-gray-300" />
                                    <p className="text-gray-500 font-semibold text-sm">
                                        Không tìm thấy sản phẩm Flash Sale nào phù hợp
                                    </p>
                                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                        Bấm nút <strong>"+ Thêm giày vào Sale"</strong> phía trên để chọn các đôi giày trong kho đưa vào chương trình giảm giá.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL 1: ADD PRODUCTS TO FLASH SALE */}
                <Modal
                    title={
                        <div className="flex items-center gap-2 border-b pb-3">
                            <PlusOutlined className="text-blue-600 font-bold" />
                            <span className="font-extrabold text-base text-gray-900">
                                Thêm sản phẩm vào chương trình Flash Sale
                            </span>
                        </div>
                    }
                    open={addSaleModalVisible}
                    onCancel={() => {
                        setAddSaleModalVisible(false);
                        setSelectedProductsToAdd([]);
                    }}
                    width={750}
                    footer={
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500">
                                Đã chọn: <strong className="text-blue-600">{selectedProductsToAdd.length}</strong> sản phẩm
                            </span>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setAddSaleModalVisible(false)}>
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleAddSelectedProductsToSale}
                                    loading={isApplyingSale}
                                    disabled={!selectedProductsToAdd.length}
                                    className="bg-black hover:bg-zinc-800 text-white font-bold border-none rounded-xl"
                                >
                                    Thêm vào Flash Sale ({selectedProductsToAdd.length})
                                </Button>
                            </div>
                        </div>
                    }
                    destroyOnClose
                >
                    <div className="space-y-4 py-2">
                        {/* Discount setter for added products */}
                        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                                <span className="font-extrabold text-blue-900 block">Thiết lập mức giảm giá ban đầu:</span>
                                <span className="text-blue-700">Mức % này sẽ áp dụng cho tất cả các đôi giày được tích chọn bên dưới</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-gray-700">Mức giảm:</span>
                                <InputNumber
                                    min={1}
                                    max={99}
                                    value={defaultDiscountToAdd}
                                    onChange={v => setDefaultDiscountToAdd(v || 10)}
                                    className="w-20 rounded-lg text-xs"
                                    addonAfter="%"
                                />
                            </div>
                        </div>

                        {/* Search & Filter within Modal */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Tìm giày trong kho để thêm vào Sale..."
                                value={searchAddProduct}
                                onChange={e => setSearchAddProduct(e.target.value)}
                                allowClear
                                className="rounded-xl text-xs"
                            />
                            <Select
                                value={brandAddProduct}
                                onChange={setBrandAddProduct}
                                style={{ width: 170 }}
                                className="rounded-xl text-xs"
                            >
                                <Option value="all">Tất cả thương hiệu</Option>
                                {categories.map(cat => (
                                    <Option key={cat._id} value={cat._id}>{cat.nameCategory}</Option>
                                ))}
                            </Select>
                        </div>

                        {/* Available Products List */}
                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-150 max-h-[350px] overflow-y-auto">
                            {filteredNonSaleProducts.map(p => {
                                const isChecked = selectedProductsToAdd.includes(p._id);
                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => {
                                            if (isChecked) {
                                                setSelectedProductsToAdd(selectedProductsToAdd.filter(k => k !== p._id));
                                            } else {
                                                setSelectedProductsToAdd([...selectedProductsToAdd, p._id]);
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition select-none ${
                                            isChecked ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}}
                                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                        />
                                        <img
                                            src={p.imagesProduct?.[0] || 'https://via.placeholder.com/50'}
                                            alt={p.nameProduct}
                                            className="w-11 h-11 object-cover rounded-lg border bg-white"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-gray-900 truncate">{p.nameProduct}</p>
                                            <p className="text-[11px] text-gray-500">
                                                Kho: {p.stockProduct || 0} | Giá hiện tại: <strong className="text-gray-900">{formatPrice(p.priceProduct)}</strong>
                                            </p>
                                        </div>
                                        <div className="text-right text-xs shrink-0">
                                            <span className="text-emerald-700 font-bold block">
                                                Giá sau sale: {formatPrice(Math.round(p.priceProduct * (1 - defaultDiscountToAdd / 100)))}
                                            </span>
                                            <span className="text-[10px] text-gray-400">(-{defaultDiscountToAdd}%)</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredNonSaleProducts.length === 0 && (
                                <div className="py-8 text-center text-gray-400 text-xs">
                                    Không có sản phẩm nào phù hợp trong kho.
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>

                {/* MODAL 2: BULK DISCOUNT CHANGER */}
                <Modal
                    title="Áp dụng mức giảm giá hàng loạt"
                    open={bulkDiscountModalVisible}
                    onCancel={() => setBulkDiscountModalVisible(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setBulkDiscountModalVisible(false)}>
                            Hủy
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            onClick={handleBatchApplyDiscount}
                            loading={isApplyingSale}
                            className="bg-black hover:bg-zinc-800 text-white font-bold border-none rounded-xl"
                        >
                            Áp dụng cho {selectedSaleProductKeys.length} sản phẩm
                        </Button>
                    ]}
                >
                    <div className="space-y-4 py-3">
                        <p className="text-xs text-gray-600">
                            Bạn đang chuẩn bị thay đổi mức giảm giá cho <strong>{selectedSaleProductKeys.length}</strong> sản phẩm đã chọn trong Flash Sale.
                        </p>
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <span className="font-bold text-sm text-gray-800">Mức % giảm giá mới:</span>
                            <InputNumber
                                min={1}
                                max={99}
                                value={bulkDiscountValue}
                                onChange={v => setBulkDiscountValue(v || 10)}
                                className="w-28 text-base font-bold rounded-lg"
                                addonAfter="%"
                            />
                        </div>
                        <div className="flex gap-2">
                            {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setBulkDiscountValue(pct)}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition cursor-pointer ${
                                        bulkDiscountValue === pct 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            </div>
        );
    };

    const handleRoleChange = async (userId, currentRole, selectedRole) => {
        if (selectedRole !== currentRole) {
            try {
                await requestUpdateRole(userId, selectedRole);
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
            title: 'Họ tên & Email',
            key: 'userInfo',
            render: (_, record) => (
                <div>
                    <span className="font-bold text-gray-900 block text-xs">{record.fullName || 'Thành viên'}</span>
                    <span className="text-gray-400 text-[11px]">{record.email}</span>
                </div>
            )
        },
        {
            title: 'Phân nhóm khách',
            key: 'customerTier',
            render: (_, record) => {
                const isStaffMember = record.role === 'staff';
                const isAdminMember = record.role === 'admin' || record.isAdmin;
                if (isAdminMember) return <Tag color="purple" className="font-bold border-none">Quản trị viên</Tag>;
                if (isStaffMember) return <Tag color="cyan" className="font-bold border-none">Nhân viên CSKH</Tag>;

                const userOrders = orders.filter(o => o.userId?._id === record._id || o.email === record.email);
                const totalSpent = userOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);

                if (totalSpent >= 5000000 || userOrders.length >= 3) {
                    return <Tag color="gold" className="font-extrabold border-amber-300">VIP Member 👑</Tag>;
                } else if (userOrders.length >= 1) {
                    return <Tag color="blue" className="font-semibold border-blue-200">Khách quen ⭐</Tag>;
                } else {
                    return <Tag color="default" className="font-medium text-gray-500">Khách mới 🆕</Tag>;
                }
            }
        },
        {
            title: 'Đơn mua',
            key: 'orderStats',
            render: (_, record) => {
                const userOrders = orders.filter(o => o.userId?._id === record._id || o.email === record.email);
                return (
                    <span className="font-mono font-bold text-xs text-gray-800">
                        {userOrders.length} đơn
                    </span>
                );
            }
        },
        {
            title: 'Tổng chi tiêu (LTV)',
            key: 'totalSpent',
            render: (_, record) => {
                const userOrders = orders.filter(o => o.userId?._id === record._id || o.email === record.email);
                const totalSpent = userOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.finalPrice || o.totalPrice), 0);
                return (
                    <span className="font-bold text-emerald-600 text-xs">
                        {formatPrice(totalSpent)}
                    </span>
                );
            }
        },
        {
            title: 'Vai trò tài khoản',
            key: 'role',
            render: (_, record) => {
                const currentRole = record.role || (record.isAdmin ? 'admin' : 'user');
                return (
                    <Select
                        value={currentRole}
                        onChange={(value) => handleRoleChange(record._id, currentRole, value)}
                        style={{ width: 130 }}
                        size="small"
                        className="text-xs"
                    >
                        <Option value="user">Khách hàng</Option>
                        <Option value="staff">Nhân viên</Option>
                        <Option value="admin">Admin</Option>
                    </Select>
                );
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString('vi-VN')}</span>
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 80,
            render: (_, record) => (
                <Popconfirm
                    title="Bạn có chắc muốn xóa tài khoản này?"
                    onConfirm={() => handleDeleteUser(record._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button type="primary" danger ghost size="small" icon={<DeleteOutlined />} className="rounded" />
                </Popconfirm>
            )
        }
    ];

    const renderUsers = () => {
        const totalUsers = users.length;
        const payingCustomers = users.filter(u => orders.some(o => o.userId?._id === u._id || o.email === u.email)).length;
        const staffAndAdmins = users.filter(u => u.role === 'admin' || u.role === 'staff' || u.isAdmin).length;

        const filteredUsers = users.filter(u => {
            const matchesSearch = !userSearch.trim() || 
                u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase());
            
            const currentRole = u.role || (u.isAdmin ? 'admin' : 'user');
            const matchesRole = userRoleFilter === 'all' || currentRole === userRoleFilter;

            return matchesSearch && matchesRole;
        });

        return (
            <div className="space-y-6">
                {/* 1. Top KPI Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng thành viên đăng ký</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <UsersIcon className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mt-2">{totalUsers} <span className="text-sm font-semibold text-gray-500">tài khoản</span></h3>
                        <p className="text-[11px] text-gray-500 mt-1">Cơ sở dữ liệu khách hàng shop</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng đã mua hàng</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <ShoppingCart className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{payingCustomers} <span className="text-sm font-semibold text-gray-500">khách</span></h3>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">Đã phát sinh ít nhất 1 đơn hàng</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nhân sự vận hành</span>
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <UserOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-purple-600 mt-2">{staffAndAdmins} <span className="text-sm font-semibold text-gray-500">nhân sự</span></h3>
                        <p className="text-[11px] text-purple-700 font-medium mt-1">Tài khoản Quản trị & CSKH</p>
                    </div>
                </div>

                {/* 2. Main Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Danh sách tài khoản & Phân hạng khách hàng</h3>
                            <p className="text-xs text-gray-500">Theo dõi lịch sử mua hàng, tổng chi tiêu trọn đời (LTV) và phân quyền vai trò</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1 max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo họ tên hoặc email khách..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black w-full"
                            />
                        </div>
                        <Select
                            value={userRoleFilter}
                            style={{ width: 170 }}
                            onChange={setUserRoleFilter}
                            className="text-xs"
                        >
                            <Option value="all">Tất cả vai trò</Option>
                            <Option value="user">Khách hàng</Option>
                            <Option value="staff">Nhân viên CSKH</Option>
                            <Option value="admin">Quản trị viên</Option>
                        </Select>
                    </div>

                    <Table
                        columns={userColumns}
                        dataSource={[...filteredUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))}
                        rowKey="_id"
                        loading={loadingUsers}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden mt-3"
                    />
                </div>
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
        const now = new Date();
        const totalCoupons = coupons.length;
        const activeCoupons = coupons.filter(c => new Date(c.endDate) >= now && (c.quantity || 0) > 0).length;
        const expiredCoupons = coupons.filter(c => new Date(c.endDate) < now || (c.quantity || 0) <= 0).length;

        const filteredCoupons = coupons.filter(c => {
            return !couponSearch.trim() || c.nameCoupon?.toLowerCase().includes(couponSearch.toLowerCase());
        });

        const handleCopyCouponCode = (code) => {
            navigator.clipboard.writeText(code);
            message.success(`Đã sao chép mã ${code} vào bộ nhớ tạm!`);
        };

        const couponColumns = [
            {
                title: 'Mã Voucher',
                dataIndex: 'nameCoupon',
                key: 'nameCoupon',
                render: (text) => (
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-300 tracking-wider">
                            {text}
                        </span>
                        <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined className="text-gray-400 hover:text-black" />}
                            title="Sao chép mã"
                            onClick={() => handleCopyCouponCode(text)}
                        />
                    </div>
                )
            },
            {
                title: 'Mức giảm',
                dataIndex: 'discount',
                key: 'discount',
                render: (val) => <Tag color="red" className="font-extrabold text-xs">-{val}%</Tag>
            },
            {
                title: 'Lượt dùng còn lại',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (qty) => (
                    <span className={`font-mono font-bold text-xs ${qty <= 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {qty} lượt
                    </span>
                )
            },
            {
                title: 'Đơn hàng tối thiểu',
                dataIndex: 'minPrice',
                key: 'minPrice',
                render: (val) => <span className="text-xs font-medium text-gray-700">{formatPrice(val)}</span>
            },
            {
                title: 'Thời gian hiệu lực',
                key: 'period',
                render: (_, record) => (
                    <div className="text-[11px] text-gray-600 space-y-0.5">
                        <p>Từ: {record.startDate ? new Date(record.startDate).toLocaleDateString('vi-VN') : 'Ngay bây giờ'}</p>
                        <p>Đến: {record.endDate ? new Date(record.endDate).toLocaleDateString('vi-VN') : 'Không thời hạn'}</p>
                    </div>
                )
            },
            {
                title: 'Trạng thái',
                key: 'status',
                render: (_, record) => {
                    const isExpired = record.endDate && new Date(record.endDate) < now;
                    const isOut = (record.quantity || 0) <= 0;
                    const isScheduled = record.startDate && new Date(record.startDate) > now;

                    if (isOut) return <Tag color="default" className="font-semibold rounded-full border px-2 py-0.5">Hết lượt dùng</Tag>;
                    if (isExpired) return <Tag color="error" className="font-semibold rounded-full border px-2 py-0.5">Đã hết hạn</Tag>;
                    if (isScheduled) return <Tag color="warning" className="font-semibold rounded-full border px-2 py-0.5">Sắp diễn ra</Tag>;
                    return <Tag color="success" className="font-semibold rounded-full border px-2 py-0.5">🟢 Đang hiệu lực</Tag>;
                }
            },
            {
                title: 'Hành động',
                key: 'actions',
                width: 100,
                render: (_, record) => (
                    <div className="flex gap-2">
                        <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditCouponModal(record)}
                            className="rounded"
                        />
                        <Popconfirm
                            title="Bạn có chắc muốn xóa mã giảm giá này?"
                            onConfirm={() => handleDeleteCoupon(record._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="primary" danger ghost size="small" icon={<DeleteOutlined />} className="rounded" />
                        </Popconfirm>
                    </div>
                )
            }
        ];

        return (
            <div className="space-y-6">
                {/* 1. Top KPI Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng mã khuyến mãi</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Layers className="w-5 h-5" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mt-2">{totalCoupons} <span className="text-sm font-semibold text-gray-500">mã voucher</span></h3>
                        <p className="text-[11px] text-gray-500 mt-1">Đã cấu hình trên hệ thống</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mã đang hoạt động</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">{activeCoupons} <span className="text-sm font-semibold text-gray-500">mã sẵn sàng</span></h3>
                        <p className="text-[11px] text-emerald-700 font-medium mt-1">Khách hàng có thể áp dụng khi thanh toán</p>
                    </div>

                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hết hạn / Hết lượt</span>
                            <span className="p-2 bg-gray-50 text-gray-500 rounded-xl">
                                <CloseOutlined className="text-lg" />
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-500 mt-2">{expiredCoupons} <span className="text-sm font-semibold text-gray-500">mã đóng</span></h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-1">Không thể sử dụng thêm</p>
                    </div>
                </div>

                {/* 2. Main Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Danh sách mã giảm giá</h3>
                            <p className="text-xs text-gray-500">Tạo mã voucher khuyến mãi, giới hạn lượt dùng và đơn hàng tối thiểu</p>
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openAddCouponModal}
                            className="bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center border-none"
                        >
                            Tạo mã mới
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1 max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã voucher..."
                                value={couponSearch}
                                onChange={(e) => setCouponSearch(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black w-full"
                            />
                        </div>
                    </div>

                    <Table
                        columns={couponColumns}
                        dataSource={filteredCoupons}
                        rowKey="_id"
                        loading={loadingCoupons}
                        pagination={{ pageSize: 8 }}
                        scroll={{ x: 'max-content' }}
                        className="border border-gray-200 rounded-xl overflow-hidden mt-3"
                    />
                </div>
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
    const fetchMessagesForUser = async (userId) => {
        if (!userId) return;
        try {
            const res = await requestGetMessages(userId);
            setChatMessages(res.metadata || []);
        } catch (error) {
            console.error('Error fetching chat messages for user:', error);
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
            fetchMessagesForUser(selectedUserId);
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
            fetchMessagesForUser(selectedUserId);
            fetchConversations(); // refresh last message
        } catch {
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
            fetchMessagesForUser(userId);
        } catch {
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
        } catch {
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
                    {activeTab === 'staff-mgmt' && renderStaffManagement()}
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'inventory' && renderInventory()}
                    {activeTab === 'complaints' && renderComplaints()}
                    {activeTab === 'flash-sale' && renderFlashSale()}
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
                            label="Đơn giá bán (VNĐ)"
                            rules={[{ required: true, message: 'Vui lòng nhập đơn giá!' }]}
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 1200000" />
                        </Form.Item>

                        <Form.Item
                            name="costPrice"
                            label="Giá vốn nhập hàng (VNĐ)"
                            tooltip="Dùng để tính Lợi nhuận gộp & kiểm soát dòng tiền shop"
                        >
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="Ví dụ: 750000" />
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
                            name="sku"
                            label="Mã SKU / Style Code"
                        >
                            <Input placeholder="Ví dụ: CW2288-111, DD1391-100" />
                        </Form.Item>

                        <Form.Item
                            name="colorway"
                            label="Phối màu (Colorway)"
                        >
                            <Input placeholder="Ví dụ: White/Black, Triple White, Panda" />
                        </Form.Item>

                        <Form.Item
                            name="material"
                            label="Chất liệu"
                        >
                            <Input placeholder="Ví dụ: Da thật, Đế cao su, Vải dệt Mesh" />
                        </Form.Item>

                        <Form.Item
                            name="gender"
                            label="Đối tượng / Giới tính"
                        >
                            <Select placeholder="Chọn giới tính...">
                                <Option value="Unisex">Unisex (Nam & Nữ)</Option>
                                <Option value="Nam">Giày Nam</Option>
                                <Option value="Nữ">Giày Nữ</Option>
                                <Option value="Trẻ em">Trẻ em (Kids)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="size"
                            label="Kích cỡ (Sizes - phân tách bằng dấu phẩy)"
                        >
                            <Input placeholder="Ví dụ: 38, 39, 40, 41, 42, 43" />
                        </Form.Item>

                        <Form.Item name="condition" label="Tình trạng giày">
                            <Select placeholder="Chọn tình trạng...">
                                <Option value="Mới 100% (Fullbox)">Mới 100% (Fullbox)</Option>
                                <Option value="Hàng chính hãng">Hàng chính hãng</Option>
                                <Option value="Hàng trưng bày">Hàng trưng bày (Like New)</Option>
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

                    <Form.Item label="Thêm hình ảnh sản phẩm">
                        <Upload
                            listType="picture-card"
                            fileList={productFileList}
                            beforeUpload={handleBeforeUploadProduct}
                            customRequest={handleCustomUploadProduct}
                            onChange={handleProductUploadChange}
                            multiple
                            maxCount={5}
                        >
                            {productFileList.length < 5 && (
                                <div className="text-center">
                                    <PlusOutlined className="text-lg text-gray-500" />
                                    <div style={{ marginTop: 8 }} className="text-xs text-gray-600 font-medium">Chọn ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <div className="mb-4">
                        <details className="text-xs text-gray-500 cursor-pointer">
                            <summary className="hover:text-black font-medium text-gray-600">Hoặc dán URL ảnh có sẵn (tuỳ chọn thêm)</summary>
                            <div className="mt-2">
                                <Form.Item
                                    name="imageUrlsProduct"
                                    className="mb-0"
                                >
                                    <Input.TextArea rows={2} placeholder="Ví dụ: https://res.cloudinary.com/u1vmfjx6/image/upload/sample1.jpg, https://res.cloudinary.com/u1vmfjx6/image/upload/sample2.jpg" />
                                </Form.Item>
                            </div>
                        </details>
                    </div>

                    <Divider />

                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setProductModalVisible(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submittingProduct}
                            disabled={submittingProduct}
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

                    <Form.Item label="Logo thương hiệu">
                        <Upload
                            listType="picture-card"
                            fileList={categoryFileList}
                            beforeUpload={handleBeforeUploadCategory}
                            customRequest={handleCustomUploadCategory}
                            onChange={handleCategoryUploadChange}
                            maxCount={1}
                        >
                            {categoryFileList.length < 1 && (
                                <div className="text-center">
                                    <PlusOutlined className="text-lg text-gray-500" />
                                    <div style={{ marginTop: 8 }} className="text-xs text-gray-600 font-medium">Chọn ảnh</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    <div className="mb-4">
                        <details className="text-xs text-gray-500 cursor-pointer">
                            <summary className="hover:text-black font-medium text-gray-600">Hoặc dán URL ảnh có sẵn (tuỳ chọn thêm)</summary>
                            <div className="mt-2">
                                <Form.Item
                                    name="imageUrlCategory"
                                    className="mb-0"
                                >
                                    <Input placeholder="Ví dụ: https://res.cloudinary.com/u1vmfjx6/image/upload/sample.jpg" />
                                </Form.Item>
                            </div>
                        </details>
                    </div>

                    <Divider />

                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setCategoryModalVisible(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submittingCategory}
                            disabled={submittingCategory}
                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                        >
                            Lưu thương hiệu
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

            {/* Complaint Response Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2.5 border-b pb-3">
                        <span className="p-1.5 bg-zinc-100 text-zinc-800 rounded-lg">
                            <MessageSquare className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="font-extrabold text-base text-gray-900 block leading-tight">Thẩm định & Phản hồi Khiếu nại Sneaker</span>
                            <span className="text-xs text-gray-400 font-normal">Giải quyết đổi size, bảo hành lỗi keo chỉ hoặc khiếu nại dịch vụ</span>
                        </div>
                    </div>
                }
                open={responseModalVisible}
                onCancel={() => setResponseModalVisible(false)}
                footer={null}
                width={640}
                destroyOnClose
            >
                {selectedComplaint && (
                    <div className="space-y-4 mt-3">
                        {/* Complaint Details Card */}
                        <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl text-xs space-y-2.5">
                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-200">
                                <div>
                                    <span className="text-gray-400 font-medium block">Khách hàng:</span>
                                    <span className="font-bold text-gray-900">{selectedComplaint.userId?.fullName || 'Khách hàng'}</span>
                                    <span className="text-gray-500 block">{selectedComplaint.userId?.email}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 font-medium block">Mã đơn hàng:</span>
                                    <span className="font-mono font-bold text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-300 inline-block mt-0.5">
                                        #{selectedComplaint.paymentId?._id?.slice(-8) || selectedComplaint.paymentId?._id || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-gray-400 font-medium block">Lý do khiếu nại:</span>
                                <span className="text-red-600 font-bold text-sm">{selectedComplaint.reason}</span>
                            </div>

                            <div>
                                <span className="text-gray-400 font-medium block">Nội dung chi tiết:</span>
                                <p className="text-gray-700 bg-white p-2.5 rounded-xl border border-zinc-200 mt-1 leading-relaxed">
                                    {selectedComplaint.content}
                                </p>
                            </div>

                            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                                <div>
                                    <span className="text-gray-400 font-medium block mb-1">Hình ảnh / Bằng chứng khách tải lên ({selectedComplaint.images.length}):</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedComplaint.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={img}
                                                alt="evidence"
                                                className="w-16 h-16 object-cover rounded-xl border border-zinc-200 cursor-pointer hover:scale-105 hover:shadow transition"
                                                onClick={() => window.open(img)}
                                                title="Bấm để mở ảnh lớn"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Reply Templates */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
                                <span>⚡ Mẫu phản hồi nhanh (1-Click Fill):</span>
                                <span className="text-[11px] text-gray-400 lowercase font-normal">chọn để điền tự động nội dung & trạng thái</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminReplyText("Chào bạn, SneakerHub rất tiếc vì đôi giày chưa vừa vặn với chân bạn. Shop hỗ trợ bạn gửi đổi size hoàn toàn miễn phí. Bạn vui lòng giữ nguyên tag và hộp giày giúp shop nhé! Đơn vị vận chuyển sẽ đến tận nơi đổi cho bạn.");
                                        setSelectedComplaint(prev => ({ ...prev, status: 'resolved' }));
                                        message.info('Đã chọn mẫu Đổi Size Miễn Phí');
                                    }}
                                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-800 text-left transition flex items-center gap-2"
                                >
                                    <span className="text-base">👟</span>
                                    <div className="leading-tight">
                                        <p className="font-bold">Đổi Size Miễn Phí</p>
                                        <p className="text-[11px] text-blue-600">Đổi size tận nơi, giữ nguyên hộp</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminReplyText("Chào bạn, SneakerHub chân thành cáo lỗi vì sự cố với sản phẩm. Shop xin gửi tặng bạn mã giảm giá SNEAKERVIP (-10%) cho đơn hàng kế tiếp, đồng thời tiếp nhận bảo hành / đổi mới đôi giày khác cho bạn ngay ạ.");
                                        setSelectedComplaint(prev => ({ ...prev, status: 'resolved' }));
                                        message.info('Đã chọn mẫu Tặng Voucher Bồi Thường');
                                    }}
                                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-left transition flex items-center gap-2"
                                >
                                    <span className="text-base">🎁</span>
                                    <div className="leading-tight">
                                        <p className="font-bold">Tặng Voucher (-10%)</p>
                                        <p className="text-[11px] text-emerald-600">Bồi thường & hỗ trợ đơn mới</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminReplyText("Chào bạn, sản phẩm của bạn đủ điều kiện bảo hành keo chỉ 6 tháng của SneakerHub. Bạn vui lòng đóng gói giày gửi về địa chỉ shop để đội ngũ kỹ thuật xử lý ép keo nhiệt trong 2-3 ngày làm việc nhé!");
                                        setSelectedComplaint(prev => ({ ...prev, status: 'processing' }));
                                        message.info('Đã chọn mẫu Tiếp Nhận Bảo Hành Keo');
                                    }}
                                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 text-left transition flex items-center gap-2"
                                >
                                    <span className="text-base">🛡️</span>
                                    <div className="leading-tight">
                                        <p className="font-bold">Bảo Hành Keo Chỉ</p>
                                        <p className="text-[11px] text-amber-600">Gửi về shop phục hồi 2-3 ngày</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminReplyText("Chào bạn, SneakerHub đã kiểm tra đơn hàng. Rất tiếc thời hạn đổi trả quy định (7 ngày kể từ lúc nhận hàng) đã hết hoặc sản phẩm đã qua sử dụng ngoài trời nên shop chưa thể áp dụng hỗ trợ lần này. Mong bạn thông cảm!");
                                        setSelectedComplaint(prev => ({ ...prev, status: 'rejected' }));
                                        message.info('Đã chọn mẫu Từ Chối Khiếu Nại');
                                    }}
                                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-800 text-left transition flex items-center gap-2"
                                >
                                    <span className="text-base">❌</span>
                                    <div className="leading-tight">
                                        <p className="font-bold">Từ Chối Khiếu Nại</p>
                                        <p className="text-[11px] text-rose-600">Quá thời hạn đổi trả 7 ngày</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Quyết định trạng thái xử lý:</label>
                            <Select
                                value={selectedComplaint.status}
                                onChange={(value) => setSelectedComplaint({ ...selectedComplaint, status: value })}
                                style={{ width: '100%' }}
                                className="light-select"
                                size="large"
                            >
                                <Option value="pending">🟡 Chờ xử lý</Option>
                                <Option value="processing">🔵 Đang xử lý (Đang liên hệ / bảo hành)</Option>
                                <Option value="resolved">🟢 Đã giải quyết (Chấp nhận khiếu nại / Đổi thành công)</Option>
                                <Option value="rejected">🔴 Từ chối khiếu nại (Không đủ điều kiện)</Option>
                            </Select>
                        </div>

                        {/* Reply Textarea */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Lời nhắn phản hồi chính thức đến khách hàng:</label>
                            <Input.TextArea
                                rows={4}
                                placeholder="Nhập lời giải thích, hướng dẫn gửi hàng hoặc chọn mẫu phản hồi nhanh ở trên..."
                                value={adminReplyText}
                                onChange={(e) => setAdminReplyText(e.target.value)}
                                className="rounded-xl text-sm"
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button onClick={() => setResponseModalVisible(false)} size="large" className="rounded-xl">
                                Đóng
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleComplaintReply}
                                loading={submittingReply}
                                size="large"
                                className="bg-black hover:bg-zinc-800 text-white font-bold border-none rounded-xl px-6"
                            >
                                Gửi phản hồi cho khách
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Size Stock Distribution Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 border-b pb-3">
                        <Layers className="text-blue-600 w-5 h-5" />
                        <div>
                            <h4 className="font-extrabold text-base text-gray-900 leading-tight">
                                Quản lý phân bổ Tồn kho theo Size
                            </h4>
                            <p className="text-xs text-gray-500 font-normal">
                                {selectedSizeProduct?.nameProduct}
                            </p>
                        </div>
                    </div>
                }
                open={sizeModalVisible}
                onCancel={() => setSizeModalVisible(false)}
                footer={null}
                width={560}
                destroyOnClose
            >
                <div className="space-y-5 pt-3">
                    <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                            <span className="text-gray-500 block">Tổng số lượng tồn sau khi phân bổ:</span>
                            <span className="text-lg font-black text-gray-900 font-mono">
                                {Object.values(sizeStockMap).reduce((s, v) => s + (Number(v) || 0), 0)} đôi
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Số size có sẵn:</span>
                            <span className="text-lg font-bold text-blue-600 font-mono">
                                {Object.keys(sizeStockMap).length} sizes
                            </span>
                        </div>
                    </div>

                    {/* Sizes Grid */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                            Danh sách số lượng từng size (Đôi):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                            {Object.keys(sizeStockMap).sort((a, b) => parseFloat(a) - parseFloat(b)).map(sz => (
                                <div key={sz} className="border border-gray-200 rounded-xl p-2.5 bg-white space-y-1 relative group hover:border-black transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                            Size {sz}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSize(sz)}
                                            className="text-gray-400 hover:text-red-500 text-xs cursor-pointer"
                                            title="Xóa size này"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <InputNumber
                                        min={0}
                                        value={sizeStockMap[sz]}
                                        onChange={(val) => setSizeStockMap(prev => ({ ...prev, [sz]: Number(val) || 0 }))}
                                        className="w-full text-xs font-mono font-bold"
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add new size input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-150">
                        <Input
                            placeholder="Nhập size mới (ví dụ: 37.5, 42.5, 46)..."
                            value={newSizeName}
                            onChange={(e) => setNewSizeName(e.target.value)}
                            onPressEnter={handleAddNewSize}
                            className="text-xs rounded-xl"
                            style={{ width: 220 }}
                        />
                        <Button
                            onClick={handleAddNewSize}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
                        >
                            + Thêm Size
                        </Button>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button onClick={() => setSizeModalVisible(false)} className="rounded-xl">
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            loading={savingSizeStock}
                            onClick={handleSaveSizeStock}
                            className="bg-black hover:bg-zinc-800 text-white font-bold border-none rounded-xl"
                        >
                            Lưu phân bổ kho
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* SneakerHub Shipping Label / Invoice Print Modal */}
            <OrderPrintModal
                open={printModalVisible}
                onClose={() => setPrintModalVisible(false)}
                orders={ordersToPrint}
                onPrintSuccess={handlePrintSuccess}
            />
        </div>
    );
}

export default AdminDashboard;
