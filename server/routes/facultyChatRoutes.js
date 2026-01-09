// Faculty Chat Routes - API endpoints for real-time faculty-student chat
import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";
import ChatRoom from "../models/ChatRoom.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = express.Router();

// ==================== FACULTY ENDPOINTS ====================

// GET /api/faculty-chat/faculty-list - Get all available faculty for students
router.get("/faculty-list", protect, async (req, res) => {
  try {
    const faculty = await User.find({
      role: { $in: ["faculty", "admin"] },
    })
      .select("name email department role")
      .sort({ name: 1 });

    // Add online status (would be managed by Socket.IO in production)
    const facultyWithStatus = faculty.map((f) => ({
      ...f.toObject(),
      isOnline: false, // This will be updated by Socket.IO
      subject: f.department || "General",
    }));

    res.json({ success: true, faculty: facultyWithStatus });
  } catch (error) {
    console.error("Error fetching faculty list:", error);
    res
      .status(500)
      .json({ message: "Error fetching faculty list", error: error.message });
  }
});

// GET /api/faculty-chat/student-list - Get all students for faculty
router.get("/student-list", protect, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const students = await User.find({ role: "student" })
      .select("name email rollNumber department role")
      .sort({ name: 1 });

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching student list:", error);
    res
      .status(500)
      .json({ message: "Error fetching student list", error: error.message });
  }
});

// ==================== CHAT ROOM ENDPOINTS ====================

// GET /api/faculty-chat/rooms - Get all chat rooms for current user
router.get("/rooms", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "student") {
      query.student = userId;
    } else {
      query.faculty = userId;
    }

    const rooms = await ChatRoom.find(query)
      .populate("student", "name email rollNumber")
      .populate("faculty", "name email department")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 });

    res.json({ success: true, rooms });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res
      .status(500)
      .json({ message: "Error fetching chat rooms", error: error.message });
  }
});

// POST /api/faculty-chat/rooms - Create or get existing chat room
router.post("/rooms", protect, async (req, res) => {
  try {
    const {
      facultyId,
      studentId: targetStudentId,
      subject,
      category,
    } = req.body;
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    let studentId, facultyIdToUse;

    if (currentUserRole === "student") {
      studentId = currentUserId;
      facultyIdToUse = facultyId;
    } else {
      studentId = targetStudentId;
      facultyIdToUse = currentUserId;
    }

    if (!studentId || !facultyIdToUse) {
      return res
        .status(400)
        .json({ message: "Both student and faculty IDs are required" });
    }

    // Check if both exist
    const [student, faculty] = await Promise.all([
      User.findOne({ _id: studentId, role: "student" }),
      User.findOne({
        _id: facultyIdToUse,
        role: { $in: ["faculty", "admin"] },
      }),
    ]);

    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    // Check if active chat room already exists
    let chatRoom = await ChatRoom.findOne({
      student: studentId,
      faculty: facultyId,
      status: { $in: ["active", "pending"] },
    });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        student: studentId,
        faculty: facultyIdToUse,
        subject:
          subject ||
          (currentUserRole === "student"
            ? "General Doubt"
            : "Student Follow-up"),
        category: category || "general",
        status: "active",
      });
      await chatRoom.save();

      // Create system message
      const systemMessage = new Message({
        chatRoom: chatRoom._id,
        sender: currentUserId,
        senderRole: "system",
        messageType: "system",
        content: `Chat started by ${req.user.name}`,
      });
      await systemMessage.save();
    }

    // Populate and return
    await chatRoom.populate("student", "name email rollNumber");
    await chatRoom.populate("faculty", "name email department");

    res.json({ success: true, chatRoom });
  } catch (error) {
    console.error("Error creating chat room:", error);
    res
      .status(500)
      .json({ message: "Error creating chat room", error: error.message });
  }
});

// GET /api/faculty-chat/rooms/:roomId - Get specific chat room
router.get("/rooms/:roomId", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const chatRoom = await ChatRoom.findById(roomId)
      .populate("student", "name email rollNumber")
      .populate("faculty", "name email department");

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Check access
    const hasAccess =
      chatRoom.student._id.equals(userId) ||
      chatRoom.faculty._id.equals(userId) ||
      req.user.role === "admin";

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Access denied to this chat room" });
    }

    res.json({ success: true, chatRoom });
  } catch (error) {
    console.error("Error fetching chat room:", error);
    res
      .status(500)
      .json({ message: "Error fetching chat room", error: error.message });
  }
});

// PATCH /api/faculty-chat/rooms/:roomId/status - Update chat room status
router.patch("/rooms/:roomId/status", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, facultyNotes } = req.body;
    const userId = req.user._id;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    // Only faculty can change status
    if (!chatRoom.faculty.equals(userId) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only faculty can update chat status" });
    }

    chatRoom.status = status;
    if (facultyNotes) chatRoom.facultyNotes = facultyNotes;

    if (status === "resolved") {
      chatRoom.resolvedAt = new Date();
    } else if (status === "closed") {
      chatRoom.closedAt = new Date();
    }

    await chatRoom.save();

    // Create system message
    const systemMessage = new Message({
      chatRoom: chatRoom._id,
      sender: userId,
      senderRole: "system",
      messageType: "system",
      content: `Chat marked as ${status}`,
    });
    await systemMessage.save();

    res.json({ success: true, chatRoom });
  } catch (error) {
    console.error("Error updating chat status:", error);
    res
      .status(500)
      .json({ message: "Error updating chat status", error: error.message });
  }
});

// ==================== MESSAGE ENDPOINTS ====================

// GET /api/faculty-chat/rooms/:roomId/messages - Get messages for a chat room
router.get("/rooms/:roomId/messages", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user._id;

    // Verify access to chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    const hasAccess =
      chatRoom.student.equals(userId) ||
      chatRoom.faculty.equals(userId) ||
      req.user.role === "admin";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Build query
    let query = { chatRoom: roomId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate("sender", "name email role")
      .populate("replyTo", "content sender")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Mark messages as read
    await Message.markAsRead(roomId, userId);

    // Update unread count in chat room
    const unreadField =
      req.user.role === "student"
        ? "unreadCount.student"
        : "unreadCount.faculty";
    await ChatRoom.findByIdAndUpdate(roomId, { [unreadField]: 0 });

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
});

// POST /api/faculty-chat/rooms/:roomId/messages - Send a message
router.post("/rooms/:roomId/messages", protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = "text", file, metadata, replyTo } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Verify access to chat room
    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    const hasAccess =
      chatRoom.student.equals(userId) ||
      chatRoom.faculty.equals(userId) ||
      userRole === "admin";

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if chat is still active
    if (chatRoom.status === "closed") {
      return res
        .status(400)
        .json({ message: "Cannot send messages to a closed chat" });
    }

    // Create message
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

    // Update chat room
    const unreadField =
      userRole === "student" ? "unreadCount.faculty" : "unreadCount.student";
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: {
        content: content || (file ? "Sent a file" : "New message"),
        sender: userId,
        timestamp: new Date(),
      },
      $inc: { [unreadField]: 1 },
      updatedAt: new Date(),
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
});

// PATCH /api/faculty-chat/messages/:messageId/resolve - Mark doubt as resolved
router.patch("/messages/:messageId/resolve", protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only faculty can resolve doubts
    const chatRoom = await ChatRoom.findById(message.chatRoom);
    if (!chatRoom.faculty.equals(userId) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only faculty can resolve doubts" });
    }

    message.metadata.isResolved = true;
    message.metadata.resolvedAt = new Date();
    message.metadata.resolvedBy = userId;
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error resolving doubt:", error);
    res
      .status(500)
      .json({ message: "Error resolving doubt", error: error.message });
  }
});

// PATCH /api/faculty-chat/messages/:messageId/task-status - Update task status
router.patch("/messages/:messageId/task-status", protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { taskStatus } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.messageType !== "task") {
      return res.status(400).json({ message: "This message is not a task" });
    }

    // Only faculty can update task status
    const chatRoom = await ChatRoom.findById(message.chatRoom);
    if (!chatRoom.faculty.equals(userId) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only faculty can update task status" });
    }

    message.metadata.taskStatus = taskStatus;
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error updating task status:", error);
    res
      .status(500)
      .json({ message: "Error updating task status", error: error.message });
  }
});

// ==================== FACULTY DASHBOARD ENDPOINTS ====================

// GET /api/faculty-chat/dashboard/stats - Get faculty chat statistics
router.get("/dashboard/stats", protect, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const facultyId = req.user._id;

    const [
      totalChats,
      activeChats,
      resolvedChats,
      pendingDoubts,
      pendingTasks,
    ] = await Promise.all([
      ChatRoom.countDocuments({ faculty: facultyId }),
      ChatRoom.countDocuments({ faculty: facultyId, status: "active" }),
      ChatRoom.countDocuments({ faculty: facultyId, status: "resolved" }),
      Message.countDocuments({
        chatRoom: {
          $in: await ChatRoom.find({ faculty: facultyId }).distinct("_id"),
        },
        messageType: "doubt",
        "metadata.isResolved": false,
      }),
      Message.countDocuments({
        chatRoom: {
          $in: await ChatRoom.find({ faculty: facultyId }).distinct("_id"),
        },
        messageType: "task",
        "metadata.taskStatus": { $in: ["pending", "in-progress"] },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalChats,
        activeChats,
        resolvedChats,
        pendingDoubts,
        pendingTasks,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
});

// GET /api/faculty-chat/dashboard/pending - Get pending items
router.get("/dashboard/pending", protect, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const facultyId = req.user._id;
    const chatRoomIds = await ChatRoom.find({ faculty: facultyId }).distinct(
      "_id"
    );

    const [pendingDoubts, pendingTasks] = await Promise.all([
      Message.find({
        chatRoom: { $in: chatRoomIds },
        messageType: "doubt",
        "metadata.isResolved": false,
      })
        .populate("sender", "name email")
        .populate("chatRoom", "subject")
        .sort({ createdAt: -1 })
        .limit(20),

      Message.find({
        chatRoom: { $in: chatRoomIds },
        messageType: "task",
        "metadata.taskStatus": { $in: ["pending", "in-progress"] },
      })
        .populate("sender", "name email")
        .populate("chatRoom", "subject")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      success: true,
      pendingDoubts,
      pendingTasks,
    });
  } catch (error) {
    console.error("Error fetching pending items:", error);
    res
      .status(500)
      .json({ message: "Error fetching pending items", error: error.message });
  }
});

export default router;
