'use client';

import React, { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';

interface Message {
    username: string;
    message: string;
    timestamp: string;
    isSystem?: boolean;
}

export default function ChatPanel({ socket, roomId, username, systemMessages = [] }: any) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        socket.on('receive_battle_chat', (data: Message) => {
            setMessages(prev => [...prev, { ...data, isSystem: false }]);
        });
        return () => { socket.off('receive_battle_chat'); };
    }, [socket]);

    useEffect(() => {
        if (!systemMessages.length) return;
        const last = systemMessages[systemMessages.length - 1];
        setMessages(prev => [...prev, {
            username: 'СИСТЕМА',
            message: last,
            timestamp: new Date().toISOString(),
            isSystem: true,
        }]);
    }, [systemMessages]);

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        socket.emit('send_battle_chat', { roomId, message: input, username });
        setInput('');
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <span className="chat-title">Чат</span>
            </div>
            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="chat-empty">Напишите сопернику...</div>
                )}
                {messages.map((m, i) => {
                    if (m.isSystem) {
                        return (
                            <div key={i} className="message system">
                                <p className="msg-text">{m.message}</p>
                            </div>
                        );
                    }
                    const isOwn = m.username === username;
                    return (
                        <div key={i} className={`message ${isOwn ? 'own' : 'other'}`}>
                            {!isOwn && <span className="msg-user">{m.username}</span>}
                            <p className="msg-text">{m.message}</p>
                            <span className="msg-time">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
            </div>
            <form onSubmit={sendMessage} className="chat-input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Написать сопернику..."
                    autoComplete="off"
                />
                <button type="submit">Отправить</button>
            </form>
        </div>
    );
}
