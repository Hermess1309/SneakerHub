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

// 4. Accept chat request (Admin only)
export const requestAcceptChat = async (userId) => {
    const res = await request.post(`${apiMessage}/accept`, { userId });
    return res.data;
};

// 5. Close chat session (Admin only)
export const requestCloseChat = async (userId) => {
    const res = await request.post(`${apiMessage}/close`, { userId });
    return res.data;
};

// 6. Get chat statistics (Admin only)
export const requestGetChatStats = async () => {
    const res = await request.get(`${apiMessage}/stats`);
    return res.data;
};
