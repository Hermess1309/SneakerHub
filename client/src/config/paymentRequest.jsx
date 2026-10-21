import request from './request';
import { apiClient } from './axiosClient';

const apiPayment = '/api/payment';

export const requestPayment = async (data) => {
    const res = await apiClient.post(`${apiPayment}/create`, data);
    return res.data;
};

export const requestPaymentById = async (orderId) => {
    const res = await apiClient.get(`${apiPayment}/order/${orderId}`);
    return res.data;
};

export const requestPaymentsAdmin = async () => {
    const res = await apiClient.get(`${apiPayment}/admin/list`);
    return res.data;
};

export const requestUpdatePaymentStatus = async (orderId, status, internalNote) => {
    const payload = {};
    if (status !== undefined) payload.status = status;
    if (internalNote !== undefined) payload.internalNote = internalNote;
    const res = await apiClient.put(`${apiPayment}/admin/update/${orderId}`, payload);
    return res.data;
};

export const requestPaymentsUser = async () => {
    const res = await apiClient.get(`${apiPayment}/user/list`);
    return res.data;
};
