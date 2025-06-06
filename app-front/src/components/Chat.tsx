import React, { useRef, useState, useEffect, type ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";

const Chat: React.FC = () => {
    const socketRef = useRef<Socket | null>(null);

    const [connected, setConnected] = useState(false);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<{ userId: String, message: string }[]>([]);
    const [userId, setUserId] = useState('');

    const connectAndListen = () => {
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current.close();
        }

        const socket = io(`http://localhost:3000`, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            autoConnect: false,
            rejectUnauthorized: false,
            withCredentials: true,
        });

        socket.on("connect", () => {
            const room = 'chat';
            socket.emit("join_room", { room });
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.onAny((key, data, ...args) => {
            console.log("onAny", key, data, args);
            if (key === 'accept_message') {
                setMessages(messages => [
                    ...messages,
                    data,
                ])
            } else if (key === 'accept_messages') {
                setMessages(data);
            }
        })

        socketRef.current = socket;
        socket.connect();
    };

    const sendMessage = () => {
        socketRef.current?.emit('send_message', { userId, message });
    };

    const getInitialMessages = () => {
        socketRef.current?.emit('get_initial_messages');
    }


    useEffect(() => {

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return (
        <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 800 }}>
            <h2>Chat {connected ? 'connected' : 'disconnected'}</h2>

            <div style={{ display: "flex", flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <button onClick={connectAndListen}>Connect & Listen</button>
                <button onClick={getInitialMessages}>get initial messages</button>
            </div>

            <div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input type="text" placeholder="user id" value={userId} onChange={e => setUserId(e.target.value)} />
                    <input type="text" placeholder="text" value={message} onChange={e => setMessage(e.target.value)} />
                    <button onClick={sendMessage}>send</button>
                </div>
                <div>
                    {messages.map((message, index) => (
                        <div key={`msg-${index}`}>{message.userId}: {message.message}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Chat;