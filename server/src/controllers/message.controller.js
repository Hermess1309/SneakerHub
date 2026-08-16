const Message = require('../models/message.model');
const User = require('../models/user.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class MessageController {
    // 1. Get chat messages
    getMessages = async (req, res) => {
        const currentUser = req.user;
        const user = await User.findById(currentUser);
        const isAdmin = user && user.isAdmin;

        let targetUserId = currentUser;
        
        // If Admin is requesting and specifies a user in query params
        if (isAdmin && req.query.userId) {
            targetUserId = req.query.userId;
        }

        // Mark messages as read
        if (isAdmin && req.query.userId) {
            await Message.updateMany(
                { userId: targetUserId, senderId: targetUserId, isRead: false },
                { $set: { isRead: true } }
            );
        } else if (!isAdmin) {
            await Message.updateMany(
                { userId: currentUser, senderId: { $ne: currentUser }, isRead: false },
                { $set: { isRead: true } }
            );
        }

        const messages = await Message.find({ userId: targetUserId })
            .sort({ createdAt: 1 })
            .lean();

        new OK({
            message: 'Get messages successfully',
            metadata: messages
        }).send(res);
    };

    // 2. Send message
    sendMessage = async (req, res) => {
        const currentUser = req.user;
        const user = await User.findById(currentUser);
        const isAdmin = user && user.isAdmin;

        const { content, userId } = req.body;
        if (!content) {
            throw new BadRequestError('Content is required');
        }

        let conversationId;
        let senderId = currentUser;

        if (isAdmin) {
            if (!userId) {
                throw new BadRequestError('User ID is required for Admin reply');
            }
            conversationId = userId;
            
            // Set status to chatting if it was waiting or closed
            const clientUser = await User.findById(userId);
            if (clientUser && clientUser.chatStatus !== 'chatting') {
                clientUser.chatStatus = 'chatting';
                await clientUser.save();
            }
        } else {
            conversationId = currentUser;

            // Set client status to waiting if not chatting
            if (user && user.chatStatus !== 'chatting') {
                user.chatStatus = 'waiting';
                await user.save();
            }
        }

        const newMessage = await Message.create({
            userId: conversationId,
            senderId: senderId,
            content: content,
            isRead: false
        });

        new Created({
            message: 'Message sent successfully',
            metadata: newMessage
        }).send(res);
    };

    // 3. Get unique conversations list (Admin only)
    getConversations = async (req, res) => {
        const conversations = await Message.aggregate([
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$userId",
                    lastMessage: { $last: "$content" },
                    lastMessageTime: { $last: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: [ "$senderId", "$userId" ] },
                                        { $eq: [ "$isRead", false ] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    lastMessageTime: 1,
                    unreadCount: 1,
                    "userInfo.fullName": 1,
                    "userInfo.email": 1,
                    "userInfo.isAdmin": 1,
                    "userInfo.chatStatus": 1
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        new OK({
            message: 'Get conversations successfully',
            metadata: conversations
        }).send(res);
    };

    // 4. Accept chat (Admin only)
    acceptChat = async (req, res) => {
        const { userId } = req.body;
        if (!userId) {
            throw new BadRequestError('User ID is required');
        }

        await User.findByIdAndUpdate(userId, { chatStatus: 'chatting' });

        await Message.create({
            userId: userId,
            senderId: req.user,
            content: 'Nhân viên chăm sóc khách hàng đã chấp nhận yêu cầu và tham gia hỗ trợ.',
            isRead: false
        });

        new OK({
            message: 'Chat accepted successfully'
        }).send(res);
    };

    // 5. Close chat (Admin only)
    closeChat = async (req, res) => {
        const { userId } = req.body;
        if (!userId) {
            throw new BadRequestError('User ID is required');
        }

        await User.findByIdAndUpdate(userId, { chatStatus: 'closed' });

        await Message.create({
            userId: userId,
            senderId: req.user,
            content: 'Cuộc trò chuyện đã được đóng bởi nhân viên hỗ trợ. Xin cảm ơn quý khách!',
            isRead: false
        });

        new OK({
            message: 'Chat closed successfully'
        }).send(res);
    };

    // 6. Get chat stats (Admin only)
    getChatStats = async (req, res) => {
        const activeUserIdsResult = await Message.distinct('userId');
        
        const waitingCount = await User.countDocuments({ _id: { $in: activeUserIdsResult }, chatStatus: 'waiting' });
        const chattingCount = await User.countDocuments({ _id: { $in: activeUserIdsResult }, chatStatus: 'chatting' });
        const closedCount = await User.countDocuments({ _id: { $in: activeUserIdsResult }, chatStatus: 'closed' });

        new OK({
            message: 'Get chat stats successfully',
            metadata: {
                waiting: waitingCount,
                chatting: chattingCount,
                closed: closedCount
            }
        }).send(res);
    };
}

module.exports = new MessageController();
