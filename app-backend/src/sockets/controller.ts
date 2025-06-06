import { IMessagePayload } from "./types"

export const sendMessageController = (message: IMessagePayload, messages: IMessagePayload[]) => {
    messages.push(message);
}