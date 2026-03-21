'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import './CollaborativeChat.css';

interface Message {
    user: string;
    text: string;
    time: string;
}

export const CollaborativeChat = ({ socket, user }: { socket: Socket | null, user: any }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat_message', (msg: Message) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off('chat_message');
        };
    }, [socket]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const send = () => {
        if (!text.trim() || !socket) return;

        const msg: Message = {
            user: user?.username || 'Guest',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        socket.emit('send_message', msg);

        setMessages(prev => [...prev, msg]);
        setText('');
    };

    return (
        <div className="collab-chat">
            <div className="chat-header">
                <div className="status-dot"></div>
                <span>Session Chat</span>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">Здесь пока нет сообщений...</div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`msg-wrapper ${m.user === user?.username ? 'mine' : ''}`}>
                        <div className="msg-avatar">
                            {m.user.charAt(0).toUpperCase()}
                        </div>
                        <div className="msg-content">
                            <div className="msg-info">
                                <span className="msg-user">{m.user}</span>
                                <span className="msg-time">{m.time}</span>
                            </div>
                            <div className="msg-bubble">
                                {m.text}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <div className="chat-input-container">
                <input
                    className="chat-input-field"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..."
                />
                <button className="chat-send-btn" onClick={send}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};
