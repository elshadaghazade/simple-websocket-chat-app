import chatHandler from "./sockets";
import { initializeSocket } from "./initializer";
import { Server } from "http";

export default async function setupSocket(server: Server) {
    const io = await initializeSocket(server);

    io.on("connection", socket => chatHandler(socket, io));

    return io;
}