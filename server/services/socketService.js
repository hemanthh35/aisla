// Socket.IO Service for Real-time Chat
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ChatRoom from "../models/ChatRoom.js";
import Message from "../models/Message.js";

// Store online users
const onlineUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const userName = socket.user.name;
    const userRole = socket.user.role;

    console.log(`🔌 User connected: ${userName} (${userRole})`);

    // Add to online users
    onlineUsers.set(userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date(),
    });

    // Broadcast online status
    io.emit("user:online", { userId, userName, userRole });

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // ==================== CHAT ROOM EVENTS ====================

    // Join a chat room
    socket.on("room:join", async ({ roomId }) => {
      try {
        const chatRoom = await ChatRoom.findById(roomId);

        if (!chatRoom) {
          return socket.emit("error", { message: "Chat room not found" });
        }

        // Verify access
        const hasAccess =
          chatRoom.student.equals(userId) ||
          chatRoom.faculty.equals(userId) ||
          userRole === "admin";

        if (!hasAccess) {
          return socket.emit("error", { message: "Access denied" });
        }

        socket.join(`room:${roomId}`);
        console.log(`📥 ${userName} joined room: ${roomId}`);

        // Notify others in room
        socket.to(`room:${roomId}`).emit("room:user_joined", {
          userId,
          userName,
          userRole,
        });

        // Mark messages as read
        await Message.markAsRead(roomId, userId);

        // Update unread count
        const unreadField =
          userRole === "student"
            ? "unreadCount.student"
            : "unreadCount.faculty";
        await ChatRoom.findByIdAndUpdate(roomId, { [unreadField]: 0 });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Leave a chat room
    socket.on("room:leave", ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      console.log(`📤 ${userName} left room: ${roomId}`);

      socket.to(`room:${roomId}`).emit("room:user_left", {
        userId,
        userName,
      });
    });

    // ==================== MESSAGE EVENTS ====================

    // Send a message
    socket.on("message:send", async (data) => {
      try {
        const {
          roomId,
          content,
          messageType = "text",
          file,
          metadata,
          replyTo,
        } = data;

        // Verify access
        const chatRoom = await ChatRoom.findById(roomId);
        if (!chatRoom) {
          return socket.emit("error", { message: "Chat room not found" });
        }

        const hasAccess =
          chatRoom.student.equals(userId) ||
          chatRoom.faculty.equals(userId) ||
          userRole === "admin";

        if (!hasAccess) {
          return socket.emit("error", { message: "Access denied" });
        }

        if (chatRoom.status === "closed") {
          return socket.emit("error", { message: "Chat is closed" });
        }

        // Create and save message
        const message = new Message({
          chatRoom: roomId,
          sender: userId,
          senderRole: userRole,
          messageType,
          content,
          file,
          metadata,
          replyTo,
        });

        await message.save();
        await message.populate("sender", "name email role");
        if (replyTo) {
          await message.populate("replyTo", "content sender");
        }

        // Update chat room
        const recipientRole = userRole === "student" ? "faculty" : "student";
        const unreadField = `unreadCount.${recipientRole}`;

        await ChatRoom.findByIdAndUpdate(roomId, {
          lastMessage: {
            content: content || (file ? "Sent a file" : "New message"),
            sender: userId,
            timestamp: new Date(),
          },
          $inc: { [unreadField]: 1 },
          updatedAt: new Date(),
        });

        // Emit to room
        io.to(`room:${roomId}`).emit("message:new", message);

        // Send notification to recipient if not in room
        const recipientId =
          userRole === "student"
            ? chatRoom.faculty.toString()
            : chatRoom.student.toString();

        io.to(`user:${recipientId}`).emit("notification:new_message", {
          roomId,
          message: {
            content: content?.substring(0, 50) || "New message",
            sender: userName,
            messageType,
          },
        });

        console.log(`💬 Message sent in room ${roomId} by ${userName}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("message:typing", ({ roomId, isTyping }) => {
      socket.to(`room:${roomId}`).emit("message:typing", {
        userId,
        userName,
        isTyping,
      });
    });

    // Mark messages as read
    socket.on("message:read", async ({ roomId }) => {
      try {
        await Message.markAsRead(roomId, userId);

        const unreadField =
          userRole === "student"
            ? "unreadCount.student"
            : "unreadCount.faculty";
        await ChatRoom.findByIdAndUpdate(roomId, { [unreadField]: 0 });

        socket.to(`room:${roomId}`).emit("message:read_receipt", { userId });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    });

    // ==================== DOUBT/TASK EVENTS ====================

    // Resolve doubt
    socket.on("doubt:resolve", async ({ messageId, roomId }) => {
      try {
        if (userRole === "student") {
          return socket.emit("error", {
            message: "Only faculty can resolve doubts",
          });
        }

        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            "metadata.isResolved": true,
            "metadata.resolvedAt": new Date(),
            "metadata.resolvedBy": userId,
          },
          { new: true }
        ).populate("sender", "name email");

        io.to(`room:${roomId}`).emit("doubt:resolved", message);
      } catch (error) {
        console.error("Error resolving doubt:", error);
        socket.emit("error", { message: "Failed to resolve doubt" });
      }
    });

    // Update task status
    socket.on("task:update_status", async ({ messageId, roomId, status }) => {
      try {
        if (userRole === "student") {
          return socket.emit("error", {
            message: "Only faculty can update task status",
          });
        }

        const message = await Message.findByIdAndUpdate(
          messageId,
          { "metadata.taskStatus": status },
          { new: true }
        ).populate("sender", "name email");

        io.to(`room:${roomId}`).emit("task:status_updated", message);
      } catch (error) {
        console.error("Error updating task:", error);
        socket.emit("error", { message: "Failed to update task" });
      }
    });

    // ==================== CHAT ROOM STATUS EVENTS ====================

    // Update room status
    socket.on("room:update_status", async ({ roomId, status }) => {
      try {
        if (userRole === "student") {
          return socket.emit("error", {
            message: "Only faculty can update chat status",
          });
        }

        const updateData = { status };
        if (status === "resolved") updateData.resolvedAt = new Date();
        if (status === "closed") updateData.closedAt = new Date();

        const chatRoom = await ChatRoom.findByIdAndUpdate(roomId, updateData, {
          new: true,
        })
          .populate("student", "name email")
          .populate("faculty", "name email");

        // Create system message
        const systemMessage = new Message({
          chatRoom: roomId,
          sender: userId,
          senderRole: "system",
          messageType: "system",
          content: `Chat marked as ${status} by ${userName}`,
        });
        await systemMessage.save();

        io.to(`room:${roomId}`).emit("room:status_updated", {
          chatRoom,
          systemMessage,
        });
      } catch (error) {
        console.error("Error updating room status:", error);
        socket.emit("error", { message: "Failed to update status" });
      }
    });

    // ==================== UTILITY EVENTS ====================

    // Get online users
    socket.on("users:get_online", () => {
      const online = [];
      onlineUsers.forEach((data, odUserId) => {
        online.push({
          odUserId,
          name: data.user.name,
          role: data.user.role,
        });
      });
      socket.emit("users:online_list", online);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${userName}`);
      onlineUsers.delete(userId);
      io.emit("user:offline", { userId, userName });
    });
  });

  return io;
};

// Helper to check if user is online
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// Helper to get online users count
export const getOnlineUsersCount = () => {
  return onlineUsers.size;
};

// Helper to get online faculty
export const getOnlineFaculty = () => {
  const faculty = [];
  onlineUsers.forEach((data) => {
    if (data.user.role === "faculty" || data.user.role === "admin") {
      faculty.push({
        userId: data.user._id,
        name: data.user.name,
        department: data.user.department,
      });
    }
  });
  return faculty;
};
