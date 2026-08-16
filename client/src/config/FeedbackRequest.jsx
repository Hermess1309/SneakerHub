import request from './request';

const apiFeedback = '/api/feedback';

export const createFeedback = async (formData) => {
    const res = await request.post(`${apiFeedback}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};
