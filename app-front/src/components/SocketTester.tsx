import React, { useRef, useState, useEffect, useCallback, type ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";

type LogEntry = {
    type: "sent" | "received" | "error";
    event: string;
    data: any;
};

interface HttpError {
    statusCode: number;
    message: string;
    details?: any;
}

const roomOptions: Record<string, { label: string, value: string }[]> = {
    '/order': [
        { label: "/order:[order_id]", value: "order" },
        { label: "/driver:[order_id]", value: "driver" },
        { label: "/picking:[order_id]", value: "picking" }
    ]
};

const eventsMap: Record<string, string[]> = {
    order: ["status"],
    driver: [
        "status",
        "get_status",
        "delivery_info",
        "search_again",
        "current_location",
        "set_driver_current_location_on_delivery",
        "set_driver_status"
    ],
    picking: ["items"],
};

const SocketTester: React.FC = () => {
    const socketRef = useRef<Socket | null>(null);
    const [url, setUrl] = useState('http://localhost');
    const [port, setPort] = useState('3001');
    const [namespace, setNamespace] = useState('');
    const [token, setToken] = useState("");
    const [room, setRoom] = useState('order');
    const [orderId, setOrderId] = useState("123");
    const [status, setStatus] = useState<"disconnected" | "connected" | "error">("disconnected");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [eventName, setEventName] = useState("");
    const [customEventName, setCustomEventName] = useState("");
    const [eventPayload, setEventPayload] = useState("{}");
    const [listenEvent, setListenEvent] = useState("");

    const addLog = (entry: LogEntry) => {
        setLogs(prev => [...prev, entry]);
    };

    const connect = () => {
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current.close();
        }

        if (!namespace) {
            return;
        }

        const socket = io(`${url}:${port}${namespace}`, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            auth: { token },
            autoConnect: false,
            withCredentials: true,
        });

        socket.on("connect", () => {
            setStatus("connected");
            addLog({ type: "received", event: "connect", data: `Connected as ${socket.id}` });

            const roomName = `${room}:${orderId}`;
            socket.emit("join_room", { room: roomName });
            addLog({ type: "sent", event: "join_room", data: { room: roomName } });
        });

        socket.on("disconnect", () => {
            setStatus("disconnected");
            addLog({ type: "received", event: "disconnect", data: "Disconnected" });
        });

        socket.on("connect_error", (err: Error) => {
            setStatus("error");
            addLog({ type: "error", event: "connect_error", data: err.message });
        });

        socket.onAny((event: string, data: any) => {

            console.log("AAA", event, data);
            if (event === 'error') {
                setStatus('error');
                addLog({ type: "error", event: "error", data: data.message });
                return;
            }

            addLog({ type: "received", event, data });
        });

        socketRef.current = socket;
        socket.connect();
    };

    const sendEvent = () => {
        if (!socketRef.current || !socketRef.current.connected) return;
        let payload;
        try {
            payload = JSON.parse(eventPayload);
        } catch (err) {
            return addLog({ type: "error", event: "Invalid JSON", data: err });
        }

        const finalEvent = customEventName || eventName;
        if (!finalEvent) return;

        socketRef.current.emit(finalEvent, payload);
        addLog({ type: "sent", event: finalEvent, data: payload });
    };

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return (
        <div style={{ fontFamily: "sans-serif", padding: 20, width: '75vw', maxWidth: 800, display: 'flex', flexDirection: 'column' }}>
            <h2>Socket.IO Tester</h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setUrl(e.target.value)}>
                    <option value='http://localhost'>http://localhost</option>
                    <option value='https://staging.ozio.az'>https://staging.ozio.az</option>
                    <option value='https://staging1.ozio.az'>https://staging1.ozio.az</option>
                </select>
                <input placeholder="Port" value={port} onChange={(e) => setPort(e.target.value)} style={{ flex: 2 }} />
                <input placeholder="JWT Token" value={token} onChange={(e) => setToken(e.target.value)} style={{ flex: 2 }} />
                <select value={namespace} onChange={(e) => setNamespace(e.target.value)} style={{ flex: 2 }}>
                    <option>--</option>
                    {Object.keys(roomOptions)?.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ flex: 2 }}>
                    {roomOptions[namespace]?.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
                <input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={{ flex: 1 }} />
                <button onClick={connect} style={{ flex: 1 }}>Connect</button>
            </div>

            <p>Status: <b>{status}</b></p>

            <div style={{ marginTop: 20 }}>
                <h4>Send Event</h4>

                <div style={{ display: "flex", gap: 10 }}>
                    <select value={eventName} onChange={(e) => setEventName(e.target.value)} style={{ flex: 1 }}>
                        <option value="">-- Select event --</option>
                        {eventsMap[room]?.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                    <input
                        placeholder="Or enter custom event"
                        value={customEventName}
                        onChange={(e) => setCustomEventName(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </div>

                <textarea
                    placeholder="Payload JSON"
                    value={eventPayload}
                    onChange={(e) => setEventPayload(e.target.value)}
                    style={{ width: "100%", height: 80, marginTop: 10 }}
                />

                <button onClick={sendEvent} style={{ marginTop: 10 }}>
                    Send
                </button>
            </div>

            <div style={{ marginTop: 30 }}>
                <h4>Logs</h4>
                <button onClick={() => setLogs([])}>clear</button>
                <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
                    {logs.map((log, index) => (
                        <div key={index} style={{ marginBottom: 10 }}>
                            <b style={{ color: log.type === "error" ? "red" : log.type === "sent" ? "blue" : "green" }}>
                                [{log.type.toUpperCase()}] {log.event}
                            </b>
                            <pre style={{ margin: 0 }}>{JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SocketTester;
