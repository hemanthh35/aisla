import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import "./FacultyChat.css";

const FacultyChat = () => {
  const { user } = useContext(AuthContext);
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    markAsRead,
    resolveDoubt,
    updateTaskStatus,
    updateRoomStatus,
    isUserOnline,
  } = useSocket();

  // State
  const [chatRooms, setChatRooms] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showFacultyList, setShowFacultyList] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty" || user?.role === "admin";

  // Fetch initial data
  useEffect(() => {
    fetchChatRooms();
    if (isStudent) {
      fetchFacultyList();
    } else {
      fetchDashboardStats();
      fetchStudentList();
    }
  }, [user, isStudent]);

  // Handle URL room ID
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (urlRoomId && chatRooms.length > 0) {
      const room = chatRooms.find((r) => r._id === urlRoomId);
      if (room) {
        handleSelectRoom(room);
      }
    }
  }, [urlRoomId, chatRooms]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", (message) => {
      if (selectedRoom && message.chatRoom === selectedRoom._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      // Update room's last message in list
      setChatRooms((prev) =>
        prev.map((room) => {
          if (room._id === message.chatRoom) {
            return {
              ...room,
              lastMessage: {
                content: message.content,
                sender: message.sender,
                timestamp: message.createdAt,
              },
            };
          }
          return room;
        })
      );
    });

    socket.on("message:typing", ({ userId, userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.odUserId === userId)) {
            return [...prev, { odUserId: userId, name: userName }];
          }
          return prev;
        });
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.odUserId !== userId));
      }
    });

    socket.on("message:read_receipt", ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          status: msg.sender._id !== userId ? "read" : msg.status,
        }))
      );
    });

    socket.on("doubt:resolved", (message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? message : msg))
      );
    });

    socket.on("task:status_updated", (message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === message._id ? message : msg))
      );
    });

    socket.on("room:status_updated", ({ chatRoom, systemMessage }) => {
      setChatRooms((prev) =>
        prev.map((room) => (room._id === chatRoom._id ? chatRoom : room))
      );
      if (selectedRoom?._id === chatRoom._id) {
        setSelectedRoom(chatRoom);
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    socket.on("room:user_joined", ({ userName }) => {
      // Could show a notification
    });

    return () => {
      socket.off("message:new");
      socket.off("message:typing");
      socket.off("message:read_receipt");
      socket.off("doubt:resolved");
      socket.off("task:status_updated");
      socket.off("room:status_updated");
      socket.off("room:user_joined");
    };
  }, [socket, selectedRoom]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // API calls
  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/faculty-chat/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatRooms(res.data.rooms || []);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/faculty-chat/faculty-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFacultyList(res.data.faculty || []);
    } catch (error) {
      console.error("Error fetching faculty list:", error);
    }
  };

  const fetchStudentList = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/faculty-chat/student-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentList(res.data.students || []);
    } catch (error) {
      console.error("Error fetching student list:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/faculty-chat/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/faculty-chat/rooms/${roomId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handlers
  const handleSelectRoom = async (room) => {
    if (selectedRoom) {
      leaveRoom(selectedRoom._id);
    }

    setSelectedRoom(room);
    setMessages([]);
    joinRoom(room._id);
    await fetchMessages(room._id);
    markAsRead(room._id);

    // Update URL
    navigate(`/faculty-chat/${room._id}`, { replace: true });
  };

  const handleStartChat = async (targetUser) => {
    try {
      const token = localStorage.getItem("token");
      const payload = isStudent
        ? { facultyId: targetUser._id, subject: "General Doubt" }
        : { studentId: targetUser._id, subject: "Academic Support" };

      const res = await axios.post("/api/faculty-chat/rooms", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newRoom = res.data.chatRoom;
      setChatRooms((prev) => {
        const exists = prev.find((r) => r._id === newRoom._id);
        if (exists) return prev;
        return [newRoom, ...prev];
      });
      handleSelectRoom(newRoom);
      setShowFacultyList(false);
      setShowStudentList(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert(error.response?.data?.message || "Failed to start chat");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

    setSendingMessage(true);
    const messageData = {
      roomId: selectedRoom._id,
      content: newMessage.trim(),
      messageType,
    };

    // Optimistic update
    const tempMessage = {
      _id: Date.now().toString(),
      ...messageData,
      sender: { _id: user._id, name: user.name },
      senderRole: user.role,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setMessageType("text");
    scrollToBottom();

    // Send via socket
    sendMessage(messageData);
    setSendingMessage(false);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (selectedRoom) {
      sendTyping(selectedRoom._id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(selectedRoom._id, false);
      }, 2000);
    }
  };

  const handleResolveDoubt = (messageId) => {
    if (selectedRoom) {
      resolveDoubt(messageId, selectedRoom._id);
    }
  };

  const handleUpdateTaskStatus = (messageId, status) => {
    if (selectedRoom) {
      updateTaskStatus(messageId, selectedRoom._id, status);
    }
  };

  const handleUpdateRoomStatus = (status) => {
    if (selectedRoom) {
      updateRoomStatus(selectedRoom._id, status);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  // Filter rooms by search
  const filteredRooms = chatRooms.filter((room) => {
    const otherUser = isStudent ? room.faculty : room.student;
    return (
      otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter faculty by search
  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter students by search
  const filteredStudents = studentList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="faculty-chat-page">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2>{isStudent ? "Ask Faculty" : "Student Chats"}</h2>
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <span className="status-dot"></span>
            {isConnected ? "Online" : "Offline"}
          </div>
        </div>

        {/* Stats for Faculty */}
        {isFaculty && stats && (
          <div className="chat-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.activeChats}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.pendingDoubts}</span>
              <span className="stat-label">Doubts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.pendingTasks}</span>
              <span className="stat-label">Tasks</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={isStudent ? "Search faculty..." : "Search students..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* New Chat Button */}
        <button
          className="new-chat-btn"
          onClick={() =>
            isStudent
              ? setShowFacultyList(!showFacultyList)
              : setShowStudentList(!showStudentList)
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          {(isStudent ? showFacultyList : showStudentList)
            ? "Back to Chats"
            : "New Chat"}
        </button>

        {/* Faculty List (for students starting new chats) */}
        {isStudent && showFacultyList && (
          <div className="faculty-list">
            <h3>Select Faculty</h3>
            {filteredFaculty.length === 0 ? (
              <p className="no-users-list">No faculty found</p>
            ) : (
              filteredFaculty.map((faculty) => (
                <div
                  key={faculty._id}
                  className="faculty-item"
                  onClick={() => handleStartChat(faculty)}
                >
                  <div
                    className={`avatar ${
                      isUserOnline(faculty._id) ? "online" : ""
                    }`}
                  >
                    {getInitials(faculty.name)}
                  </div>
                  <div className="faculty-info">
                    <span className="name">{faculty.name}</span>
                    <span className="department">
                      {faculty.department || "General"}
                    </span>
                  </div>
                  <span
                    className={`status-badge ${
                      isUserOnline(faculty._id) ? "online" : "offline"
                    }`}
                  >
                    {isUserOnline(faculty._id) ? "Online" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Student List (for faculty starting new chats) */}
        {isFaculty && showStudentList && (
          <div className="faculty-list student-list">
            <h3>Select Student</h3>
            {filteredStudents.length === 0 ? (
              <p className="no-users-list">No students found</p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student._id}
                  className="faculty-item student-item"
                  onClick={() => handleStartChat(student)}
                >
                  <div
                    className={`avatar ${
                      isUserOnline(student._id) ? "online" : ""
                    }`}
                  >
                    {getInitials(student.name)}
                  </div>
                  <div className="faculty-info">
                    <span className="name">{student.name}</span>
                    <span className="department">{student.email}</span>
                  </div>
                  <span
                    className={`status-badge ${
                      isUserOnline(student._id) ? "online" : "offline"
                    }`}
                  >
                    {isUserOnline(student._id) ? "Online" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Chat Rooms List */}
        {((isStudent && !showFacultyList) ||
          (isFaculty && !showStudentList)) && (
          <div className="chat-rooms-list">
            {loading ? (
              <div className="loading-chats">
                <div className="loader"></div>
                <span>Loading chats...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="no-chats">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>
                  {isStudent
                    ? "No chats yet. Start a conversation with a faculty member!"
                    : "No student chats yet."}
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const otherUser = isStudent ? room.faculty : room.student;
                const unreadCount = isStudent
                  ? room.unreadCount?.student
                  : room.unreadCount?.faculty;

                return (
                  <div
                    key={room._id}
                    className={`chat-room-item ${
                      selectedRoom?._id === room._id ? "active" : ""
                    } ${room.status !== "active" ? room.status : ""}`}
                    onClick={() => handleSelectRoom(room)}
                  >
                    <div
                      className={`avatar ${
                        isUserOnline(otherUser?._id) ? "online" : ""
                      }`}
                    >
                      {getInitials(otherUser?.name)}
                    </div>
                    <div className="room-info">
                      <div className="room-header">
                        <span className="room-name">{otherUser?.name}</span>
                        <span className="room-time">
                          {room.lastMessage?.timestamp &&
                            formatTime(room.lastMessage.timestamp)}
                        </span>
                      </div>
                      <div className="room-preview">
                        <span className="last-message">
                          {room.lastMessage?.content || room.subject}
                        </span>
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <header className="chat-header">
              <button
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="chat-user-info">
                <div
                  className={`avatar ${
                    isUserOnline(
                      isStudent
                        ? selectedRoom.faculty?._id
                        : selectedRoom.student?._id
                    )
                      ? "online"
                      : ""
                  }`}
                >
                  {getInitials(
                    isStudent
                      ? selectedRoom.faculty?.name
                      : selectedRoom.student?.name
                  )}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {isStudent
                      ? selectedRoom.faculty?.name
                      : selectedRoom.student?.name}
                  </span>
                  <span
                    className={`user-status ${
                      isUserOnline(
                        isStudent
                          ? selectedRoom.faculty?._id
                          : selectedRoom.student?._id
                      )
                        ? "online"
                        : ""
                    }`}
                  >
                    {isUserOnline(
                      isStudent
                        ? selectedRoom.faculty?._id
                        : selectedRoom.student?._id
                    )
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>
              </div>

              <div className="chat-actions">
                {isFaculty && selectedRoom.status === "active" && (
                  <>
                    <button
                      className="action-btn resolve"
                      onClick={() => handleUpdateRoomStatus("resolved")}
                      title="Mark as Resolved"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </button>
                    <button
                      className="action-btn close"
                      onClick={() => handleUpdateRoomStatus("closed")}
                      title="Close Chat"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </button>
                  </>
                )}
                {selectedRoom.status !== "active" && (
                  <span className={`status-label ${selectedRoom.status}`}>
                    {selectedRoom.status}
                  </span>
                )}
              </div>
            </header>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg, index) => {
                const isOwnMessage =
                  msg.sender?._id === user._id || msg.sender === user._id;
                const showDate =
                  index === 0 ||
                  formatDate(messages[index - 1]?.createdAt) !==
                    formatDate(msg.createdAt);

                return (
                  <React.Fragment key={msg._id}>
                    {showDate && (
                      <div className="date-separator">
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                    )}

                    {msg.messageType === "system" ? (
                      <div className="system-message">{msg.content}</div>
                    ) : (
                      <div
                        className={`message ${isOwnMessage ? "own" : "other"} ${
                          msg.messageType
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="message-avatar">
                            {getInitials(msg.sender?.name)}
                          </div>
                        )}
                        <div className="message-bubble">
                          {msg.messageType !== "text" && (
                            <div
                              className={`message-type-badge ${msg.messageType}`}
                            >
                              {msg.messageType === "doubt"
                                ? "❓ Doubt"
                                : msg.messageType === "task"
                                ? "📋 Task"
                                : ""}
                            </div>
                          )}
                          <p className="message-content">{msg.content}</p>
                          <div className="message-meta">
                            <span className="message-time">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOwnMessage && (
                              <span className={`message-status ${msg.status}`}>
                                {msg.status === "read"
                                  ? "✓✓"
                                  : msg.status === "delivered"
                                  ? "✓"
                                  : "○"}
                              </span>
                            )}
                          </div>

                          {/* Doubt/Task Actions for Faculty */}
                          {isFaculty && !isOwnMessage && (
                            <>
                              {msg.messageType === "doubt" &&
                                !msg.metadata?.isResolved && (
                                  <button
                                    className="resolve-btn"
                                    onClick={() => handleResolveDoubt(msg._id)}
                                  >
                                    ✓ Mark Resolved
                                  </button>
                                )}
                              {msg.messageType === "task" && (
                                <div className="task-actions">
                                  <select
                                    value={
                                      msg.metadata?.taskStatus || "pending"
                                    }
                                    onChange={(e) =>
                                      handleUpdateTaskStatus(
                                        msg._id,
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="in-progress">
                                      In Progress
                                    </option>
                                    <option value="under-review">
                                      Under Review
                                    </option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}

                          {/* Resolved/Status badges */}
                          {msg.metadata?.isResolved && (
                            <span className="resolved-badge">✓ Resolved</span>
                          )}
                          {msg.messageType === "task" &&
                            msg.metadata?.taskStatus && (
                              <span
                                className={`task-status-badge ${msg.metadata.taskStatus}`}
                              >
                                {msg.metadata.taskStatus}
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <span>
                    {typingUsers.map((u) => u.name).join(", ")} is typing...
                  </span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {selectedRoom.status === "active" && (
              <form className="message-form" onSubmit={handleSendMessage}>
                <div className="message-type-selector">
                  <button
                    type="button"
                    className={`type-btn ${
                      messageType === "text" ? "active" : ""
                    }`}
                    onClick={() => setMessageType("text")}
                    title="Normal Message"
                  >
                    💬
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${
                      messageType === "doubt" ? "active" : ""
                    }`}
                    onClick={() => setMessageType("doubt")}
                    title="Ask a Doubt"
                  >
                    ❓
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${
                      messageType === "task" ? "active" : ""
                    }`}
                    onClick={() => setMessageType("task")}
                    title="Send Task Request"
                  >
                    📋
                  </button>
                </div>

                <div className="input-wrapper">
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder={
                      messageType === "doubt"
                        ? "Type your doubt..."
                        : messageType === "task"
                        ? "Describe the task..."
                        : "Type a message..."
                    }
                    value={newMessage}
                    onChange={handleTyping}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </form>
            )}

            {selectedRoom.status !== "active" && (
              <div className="chat-closed-notice">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>This chat has been {selectedRoom.status}</span>
              </div>
            )}
          </>
        ) : (
          <div className="no-chat-selected">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Select a chat to start messaging</h3>
            <p>
              {isStudent
                ? "Choose a faculty member to ask your doubts"
                : "Select a student conversation to respond"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyChat;
