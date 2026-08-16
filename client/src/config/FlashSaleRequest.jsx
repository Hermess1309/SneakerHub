import request from './request';

const apiFlashSale = '/api/flashsale';

export const getFlashSaleConfig = async () => {
    const res = await request.get(`${apiFlashSale}/config`);
    return res.data;
};

export const setFlashSaleConfig = async (data) => {
    const res = await request.post(`${apiFlashSale}/set`, data);
    return res.data;
};
