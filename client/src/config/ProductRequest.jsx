import request from './request';

const apiProduct = '/api/product';

export const listProduct = async () => {
    const res = await request.get(`${apiProduct}/list`);
    return res.data;
};

export const listProductByCategory = async (idCategory) => {
    const res = await request.get(`${apiProduct}/list/${idCategory}`);
    return res.data;
};

export const productDetail = async (idProduct) => {
    const res = await request.get(`${apiProduct}/detail/${idProduct}`);
    return res.data;
};

export const createProduct = async (formData) => {
    const res = await request.post(`${apiProduct}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const updateProduct = async (id, formData) => {
    const res = await request.put(`${apiProduct}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const deleteProduct = async (id) => {
    const res = await request.delete(`${apiProduct}/delete/${id}`);
    return res.data;
};

export const uploadProductImage = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await request.post(`${apiProduct}/upload-image`, formData, {
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

