import request from './request';

const apiCategory = '/api/category';

export const listCategory = async () => {
    const res = await request.get(`${apiCategory}/list`);
    return res.data;
};

export const createCategory = async (formData) => {
    const res = await request.post(`${apiCategory}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const updateCategory = async (id, formData) => {
    const res = await request.put(`${apiCategory}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const deleteCategory = async (id) => {
    const res = await request.delete(`${apiCategory}/delete/${id}`);
    return res.data;
};
