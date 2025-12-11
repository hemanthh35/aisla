/**
 * AISLA AI Chat Widget
 * 
 * Production-ready streaming chat component
 * Connects to SSE endpoint for real-time token streaming
 * ChatGPT-like smooth typing experience
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AIChatWidget.css';

// ============================================
// MARKDOWN RENDERER
// ============================================
const renderMarkdown = (text) => {
    if (!text) return '';

    return text
        // Code blocks (must be first)
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br/>');
};

// ============================================
// MAIN COMPONENT
// ============================================
const AIChatWidget = () => {
    // State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! 👋 I\'m **AISLA AI**, your learning assistant. Ask me anything!',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentModel, setCurrentModel] = useState('');

    // Refs
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // ============================================
    // AUTO-SCROLL
    // ============================================
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // ============================================
    // SEND MESSAGE (STREAMING)
    // ============================================
    const sendMessage = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isStreaming) return;

        // Add user message
        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmedInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);

        // Create placeholder for assistant response
        const assistantId = `assistant-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true
        }]);

        try {
            // Prepare conversation history
            const history = messages.slice(-8).map(m => ({
                role: m.role,
                content: m.content
            }));

            // Create abort controller for cancellation
            abortControllerRef.current = new AbortController();

            // ============================================
            // CONNECT TO SSE STREAM
            // ============================================
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    message: trimmedInput,
                    history
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // ============================================
            // PROCESS SSE STREAM
            // ============================================
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(line.slice(6));

                        switch (data.type) {
                            case 'START':
                                setCurrentModel(data.model);
                                break;

                            case 'TOKEN':
                                // Append token to accumulated content
                                accumulatedContent += data.content;

                                // Update message in state
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantId
                                        ? { ...msg, content: accumulatedContent }
                                        : msg
                                ));
                                break;

                            case 'DONE':
                                // Mark streaming as complete
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantId
                                        ? {
                                            ...msg,
                                            isStreaming: false,
                                            model: data.model,
                                            tokens: data.totalTokens
                                        }
                                        : msg
                                ));
                                break;

                            case 'ERROR':
                                throw new Error(data.error);
                        }
                    } catch (parseError) {
                        // Skip invalid JSON
                    }
                }
            }

        } catch (error) {
            // Handle errors (ignore abort)
            if (error.name !== 'AbortError') {
                console.error('Stream error:', error);
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantId
                        ? {
                            ...msg,
                            content: `⚠️ Error: ${error.message}. Make sure Ollama is running.`,
                            isStreaming: false,
                            isError: true
                        }
                        : msg
                ));
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    // ============================================
    // STOP STREAMING
    // ============================================
    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsStreaming(false);
        }
    };

    // ============================================
    // KEYBOARD HANDLER
    // ============================================
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ============================================
    // FORMAT TIME
    // ============================================
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
            {/* Toggle Button */}
            <button
                className="chat-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="pulse" />
                    </>
                )}
            </button>

            {/* Chat Window */}
            <div className="chat-window">
                {/* Header */}
                <header className="chat-header">
                    <div className="header-info">
                        <div className="avatar">🤖</div>
                        <div className="header-text">
                            <h3>AISLA AI</h3>
                            <span className="status">
                                {isStreaming ? (
                                    <><span className="typing-dot" /> Generating...</>
                                ) : (
                                    <><span className="online-dot" /> Online</>
                                )}
                            </span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                </header>

                {/* Messages */}
                <main className="chat-messages">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`message ${msg.role} ${msg.isStreaming ? 'streaming' : ''} ${msg.isError ? 'error' : ''}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="msg-avatar">🤖</div>
                            )}
                            <div className="msg-content">
                                <div
                                    className="msg-text"
                                    dangerouslySetInnerHTML={{
                                        __html: renderMarkdown(msg.content)
                                    }}
                                />
                                {msg.isStreaming && <span className="cursor">▋</span>}
                                <div className="msg-meta">
                                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                                    {msg.model && (
                                        <span className="msg-model">{msg.model}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                {/* Quick Actions (shown initially) */}
                {messages.length <= 2 && !isStreaming && (
                    <div className="quick-actions">
                        {[
                            '🔬 How do experiments work?',
                            '📝 Help with quizzes',
                            '💡 Study tips'
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(action.slice(3))}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <footer className="chat-input">
                    <div className="input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            rows={1}
                            disabled={isStreaming}
                        />
                        {isStreaming ? (
                            <button
                                className="stop-btn"
                                onClick={stopStreaming}
                                aria-label="Stop generating"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                className="send-btn"
                                onClick={sendMessage}
                                disabled={!input.trim()}
                                aria-label="Send message"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AIChatWidget;
