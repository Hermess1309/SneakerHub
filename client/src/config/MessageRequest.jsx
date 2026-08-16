import request from './request';

const apiMessage = '/api/message';

// 1. Get chat history
export const requestGetMessages = async (userId = null) => {
    const url = userId ? `${apiMessage}?userId=${userId}` : apiMessage;
    const res = await request.get(url);
    return res.data;
};

// 2. Send message
export const requestSendMessage = async (content, userId = null) => {
    const data = { content };
    if (userId) {
        data.userId = userId;
    }
    const res = await request.post(apiMessage, data);
    return res.data;
};

// 3. Get all conversations (Admin only)
export const requestGetConversations = async () => {
    const res = await request.get(`${apiMessage}/conversations`);
    return res.data;
};
