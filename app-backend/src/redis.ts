import { Redis } from 'ioredis';

export const redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy(times) {
        const delay = Math.min(times * 100, 60000);
        return delay;
    }
});

export const pubClient = redis.duplicate();
export const subClient = pubClient.duplicate();

// Attach listeners
pubClient.on("error", (err) => {
    console.error('pubclient error', err);
});
pubClient.on("reconnecting", () => {
    console.warn("pubClient reconnecting...");
});
pubClient.on("ready", async () => {
    console.log("pubClient is ready.");
    
    await new Promise<void>((resolve, reject) => {
        if (subClient.status === 'ready') {
            return resolve();
        }

        subClient.on('ready', resolve);
        subClient.on('error', reject);
    });
});

subClient.on("error", (err) => {
    console.error("Sub Client Error: " + err.message);
});
subClient.on("reconnecting", () => {
    console.warn("Sub subClient reconnecting...");
});
subClient.on("ready", () => {
    console.log("Sub subClient is ready.");
});

redis.on("error", (err) => {
    console.error("ioredis error: " + err.message);
});
redis.on("reconnecting", () => {
    console.warn("ioredis reconnecting...");
});
redis.on("ready", () => {
    console.log("ioredis is ready.");
});