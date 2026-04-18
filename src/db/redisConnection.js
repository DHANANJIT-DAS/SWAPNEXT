// import { createClient } from 'redis';

// // Create the client
// const redis = createClient({
//     // If running locally, this is usually redis://127.0.0.1:6379
//     url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
// });

// redis.on('error', (err) => console.log('Redis Client Error', err));

// // You must call connect() before using it
// await redis.connect();

// export default redis;