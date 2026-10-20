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

export const uploadCategoryImage = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('imageCategory', file);
    const res = await request.post(`${apiCategory}/upload-image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
            if (onProgress && event.total) {
                onProgress({ percent: Math.round((event.loaded / event.total) * 100) });
            }
        },
    });
    return res.data;
};

