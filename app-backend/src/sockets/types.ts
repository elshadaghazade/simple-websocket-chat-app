export interface IMessagePayload {
    userId: string;
    message: string;
}

export type IMessageType = Record<string, IMessagePayload>;