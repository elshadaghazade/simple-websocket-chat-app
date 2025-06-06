import React, { useRef, useState, useEffect, type ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";

type OfferedOrder = {
    orderId: string;
    metadata: Record<string, any>;
};

const Driver: React.FC = () => {
    const socketRef = useRef<Socket | null>(null);
    const [url, setUrl] = useState('http://localhost');
    const [status, setStatus] = useState('');
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [connected, setConnected] = useState(false);
    const [port, setPort] = useState('3001');
    const [token, setToken] = useState("");
    const [driverId, setDriverId] = useState("");
    const [orders, setOrders] = useState<OfferedOrder[]>([]);
    const [orderId, setOrderId] = useState<number>();

    const [outOfDeliveryLat, setOutOfDeliveryLat] = useState(40.696918642769944);
    const [outOfDeliveryLng, setOutOfDeliveryLng] = useState(-73.97736540997262);

    const [onDeliveryLat, setOnDeliveryLat] = useState(40.696918642769944);
    const [onDeliveryLng, setOnDeliveryLng] = useState(-73.97736540997262);

    const connectAndListen = () => {
        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
            socketRef.current.close();
        }

        if (!token || !driverId) return;

        const socket = io(`${url}:${port}/order`, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            auth: { token },
            autoConnect: false,
            rejectUnauthorized: false,
            withCredentials: true,
        });

        socket.on("connect", () => {
            const room = `driver:${driverId}`;
            socket.emit("join_room", { room });
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.onAny((key, data, ...args) => {
            console.log("onAny", key, data, args);
            if (key === 'status') {
                setStatus(data);
            } else if (key === 'offered_order') {
                setOrders(prev => [...prev, data]);
            } else {
                setKey(key);
                args.unshift(data);
                setValue(JSON.stringify(args, null, 2));
            }
        })

        socketRef.current = socket;
        socket.connect();
    };

    const handleAction = (orderId: string, action: "accept_order" | "reject_order", locale: string) => {
        socketRef.current?.emit(action, { driver_id: driverId, order_id: orderId, locale });
        setOrders(prev => prev.filter(order => order.orderId !== orderId));
    };

    const becomeOnline = () => {
        socketRef.current?.emit('set_driver_status', {status: 'available'});
    }

    const becomeOffline = () => {
        socketRef.current?.emit('set_driver_status', {status: 'offline'});
    }

    const getMyStatus = () => {
        socketRef.current?.emit('get_driver_status');
    }

    const updateOutOfDeliveryLocation = () => {
        socketRef.current?.emit('set_driver_current_location_out_of_delivery', {
            lat: outOfDeliveryLat,
            lng: outOfDeliveryLng
        });
    }

    const updateOnDeliveryLocation = () => {
        if (!orderId) {
            alert("set order id");
            return;
        }

        socketRef.current?.emit('set_driver_current_location_on_delivery', {
            lat: onDeliveryLat,
            lng: onDeliveryLng,
            order_id: orderId
        });
    }

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return (
        <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 800 }}>
            <h2>Driver Order Listener {connected ? 'connected' : 'disconnected'}</h2>
            <h3>Status: {status}</h3>

            <div style={{ display: "flex", flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <select onChange={(e: ChangeEvent<HTMLSelectElement>) => setUrl(e.target.value)}>
                    <option value='http://localhost'>http://localhost</option>
                    <option value='https://staging1.ozio.az'>https://staging1.ozio.az</option>
                </select>
                <input placeholder="Port" value={port} onChange={(e: ChangeEvent<HTMLInputElement>) => setPort(e.target.value)} style={{ flex: 2 }} />
                <input
                    placeholder="JWT Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    style={{ flex: 1 }}
                />
                <input
                    placeholder="Driver ID"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button onClick={connectAndListen}>Connect & Listen</button>
            </div>

            <div>
                <button onClick={becomeOnline}>become online</button>
                <button onClick={becomeOffline}>become offline</button>
                <button onClick={getMyStatus}>my status</button>
            </div>

            <div style={{display: 'flex', gap: 5}}>
                <input placeholder="latitude" value={outOfDeliveryLat} onChange={e => setOutOfDeliveryLat(Number(e.target.value))} />
                <input placeholder="longitude" value={outOfDeliveryLng} onChange={e => setOutOfDeliveryLng(Number(e.target.value))} />
                <button onClick={updateOutOfDeliveryLocation}>update out of delivery location</button>
            </div>

            <div style={{display: 'flex', gap: 5}}>
                <input placeholder="order id" value={orderId} onChange={e => setOrderId(Number(e.target.value))} />
                <input placeholder="latitude" value={onDeliveryLat} onChange={e => setOnDeliveryLat(Number(e.target.value))} />
                <input placeholder="longitude" value={onDeliveryLng} onChange={e => setOnDeliveryLng(Number(e.target.value))} />
                <button onClick={updateOnDeliveryLocation}>update on delivery location</button>
            </div>

            <div>
                <h4>any events</h4>
                <div>
                    <pre>
                        key: {key} value: {value}
                    </pre>
                </div>
            </div>

            <div>
                <h4>Offered Orders</h4>
                {orders.map((order, index) => (
                    <div key={index} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
                        <p><b>Order ID:</b> {order.orderId}</p>
                        <pre>{JSON.stringify(order.metadata, null, 2)}</pre>
                        <button onClick={() => handleAction(order.orderId, "accept_order", 'az')}>Accept</button>
                        <button onClick={() => handleAction(order.orderId, "reject_order", 'az')} style={{ marginLeft: 10 }}>
                            Reject
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Driver;