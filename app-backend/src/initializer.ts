import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis";



const sleep = (t: number) => new Promise(s => setTimeout(s, t));

const REDIS_CONNECTION_WAIT_TIME_DELAY = 500;

export async function initializeSocket(server: any) {

    let retry = 0;
    while (pubClient.status !== 'ready' || subClient.status !== 'ready') {
        const delay = Math.min(REDIS_CONNECTION_WAIT_TIME_DELAY * retry, 1000);
        await sleep(delay);
        retry++;
    }

    const io = new SocketServer(server, {
        // perMessageDeflate: true,
        // transports: ['websocket', 'polling'],
        cors: { 
            origin: ["*"],
            methods: ['GET', 'POST'],
            credentials: true
        },
    });

    io.adapter(createAdapter(pubClient, subClient));

    return io;
}
