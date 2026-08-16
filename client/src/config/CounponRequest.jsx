import request from './request';

const apiCoupon = '/api/coupon';

export const listCoupons = async () => {
    const res = await request.get(`${apiCoupon}/list`);
    return res.data;
};

export const createCoupon = async (data) => {
    const res = await request.post(`${apiCoupon}/create`, data);
    return res.data;
};

export const updateCoupon = async (id, data) => {
    const res = await request.put(`${apiCoupon}/update/${id}`, data);
    return res.data;
};

export const deleteCoupon = async (id) => {
    const res = await request.delete(`${apiCoupon}/delete/${id}`);
    return res.data;
};
