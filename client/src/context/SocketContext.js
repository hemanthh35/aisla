// Socket Context for real-time chat functionality
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");

      const socketUrl =
        process.env.REACT_APP_API_URL ||
        (window.location.hostname === "localhost"
          ? "http://localhost:5000"
          : `${window.location.protocol}//${window.location.hostname}:5000`);

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        console.log("🔌 Connected to chat server");
        setIsConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("🔌 Disconnected from chat server");
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        setIsConnected(false);
      });

      // Online/Offline events
      newSocket.on("user:online", ({ userId, userName, userRole }) => {
        setOnlineUsers((prev) => {
          if (prev.find((u) => u.userId === userId)) return prev;
          return [...prev, { userId, userName, userRole }];
        });
      });

      newSocket.on("user:offline", ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
      });

      newSocket.on("users:online_list", (users) => {
        setOnlineUsers(users);
      });

      // Notification events
      newSocket.on("notification:new_message", (data) => {
        setNotifications((prev) => [
          ...prev,
          { ...data, id: Date.now(), read: false },
        ]);
      });

      setSocket(newSocket);

      // Request online users list
      newSocket.emit("users:get_online");

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Join a chat room
  const joinRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) {
        socket.emit("room:join", { roomId });
      }
    },
    [socket, isConnected]
  );

  // Leave a chat room
  const leaveRoom = useCallback(
    (roomId) => {
      if (socket && isConnected) {
        socket.emit("room:leave", { roomId });
      }
    },
    [socket, isConnected]
  );

  // Send a message
  const sendMessage = useCallback(
    (data) => {
      if (socket && isConnected) {
        socket.emit("message:send", data);
      }
    },
    [socket, isConnected]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (roomId, isTyping) => {
      if (socket && isConnected) {
        socket.emit("message:typing", { roomId, isTyping });
      }
    },
    [socket, isConnected]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (roomId) => {
      if (socket && isConnected) {
        socket.emit("message:read", { roomId });
      }
    },
    [socket, isConnected]
  );

  // Resolve doubt
  const resolveDoubt = useCallback(
    (messageId, roomId) => {
      if (socket && isConnected) {
        socket.emit("doubt:resolve", { messageId, roomId });
      }
    },
    [socket, isConnected]
  );

  // Update task status
  const updateTaskStatus = useCallback(
    (messageId, roomId, status) => {
      if (socket && isConnected) {
        socket.emit("task:update_status", { messageId, roomId, status });
      }
    },
    [socket, isConnected]
  );

  // Update room status
  const updateRoomStatus = useCallback(
    (roomId, status) => {
      if (socket && isConnected) {
        socket.emit("room:update_status", { roomId, status });
      }
    },
    [socket, isConnected]
  );

  // Clear notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Check if user is online
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.some((u) => u.userId === userId);
    },
    [onlineUsers]
  );

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markAsRead,
    resolveDoubt,
    updateTaskStatus,
    updateRoomStatus,
    clearNotification,
    isUserOnline,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
