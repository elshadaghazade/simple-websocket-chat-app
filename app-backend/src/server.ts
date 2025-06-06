import { createServer } from "http";
import setupSocket from "./socket";
import app from './app';

(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

const server = createServer(app);

setupSocket(server);

server.listen(3000, () => {
    console.log('started');
})