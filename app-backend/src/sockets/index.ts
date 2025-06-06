import { Socket } from "socket.io";
import { IMessagePayload } from "./types";
import { sendMessageController } from "./controller";

const messages: IMessagePayload[] = [];



export default async function chatHandler(socket: Socket) {
    socket.on("join_room", async ({ room }: { room: string }) => {
        socket.join(room);

        try {
            socket.onAny((event, data: {userId: string, message: string}) => {
                switch (event) {
                    case 'send_message':
                        sendMessageController({
                            userId: data.userId,
                            message: data.message
                        }, messages);
                        socket.to(room).emit('accept_message', {
                            userId: data.userId,
                            message: data.message
                        });
                        break;
                    case 'get_initial_messages':
                        socket.emit('accept_messages', messages);
                        break;
                }
            });
        } catch (err) {
            socket.leave(room);
            socket.disconnect(true);
        }
    });

    socket.on('error', async (error) => {
        console.log("socket error", error);
    })

    socket.on("disconnect", async (reason) => {
        console.log("socket discconnected", reason);
    });
}