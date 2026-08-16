const Message = require('../models/message.model');
const User = require('../models/user.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');
const mongoose = require('mongoose');

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
            // Admin reading: mark user's messages as read
            await Message.updateMany(
                { userId: targetUserId, senderId: targetUserId, isRead: false },
                { $set: { isRead: true } }
            );
        } else if (!isAdmin) {
            // User reading: mark Admin's replies as read
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
        } else {
            conversationId = currentUser;
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
                    "userInfo.isAdmin": 1
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
}

module.exports = new MessageController();
