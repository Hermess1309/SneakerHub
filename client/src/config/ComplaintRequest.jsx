import request from './request';

const apiComplaint = '/api/complaint';

export const createComplaint = async (formData) => {
    const res = await request.post(`${apiComplaint}/create`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const listUserComplaints = async () => {
    const res = await request.get(`${apiComplaint}/user-list`);
    return res.data;
};

export const listAllComplaints = async () => {
    const res = await request.get(`${apiComplaint}/list`);
    return res.data;
};

export const respondToComplaint = async (id, data) => {
    const res = await request.put(`${apiComplaint}/respond/${id}`, data);
    return res.data;
};
