
const Redis = require("ioredis");
// const redis = require('redis');

// const redis = new Redis("rediss://:AVNS_xvzwBAifQfXAIO3-z3w@db-redis-lon1-42423-do-user-3428694-0.b.db.ondigitalocean.com:25061/0");
// const redis = new Redis("rediss://default:AVNS___LxtSjc-t_MFnFL3zL@db-redis-blr1-53787-do-user-13475763-0.b.db.ondigitalocean.com:25061/0");
const redis = new Redis("redis://default:62KoxQzQdoyf4PUGVauC5295t4simMf1@redis-16019.c92.us-east-1-3.ec2.redns.redis-cloud.com:16019/0");

// const client = redis.createClient({
//     url: `rediss://db-redis-lon1-42423-do-user-3428694-0.b.db.ondigitalocean.com:25061`,
//     password: 'AVNS_xvzwBAifQfXAIO3-z3w',
// });
// client.connect().then(() => console.log('connected'));

// let reconnectCount = 0;
// let lastConnect = Date.now();
// client.on('reconnecting', () => {
//   console.log(
//     'reconnecting, count: ',
//     ++reconnectCount,
//     ' last connect is',
//     lastConnect ? Date.now() - lastConnect : 'null',
//     'ms ago',
//   );
//   lastConnect = Date.now();
// });
// client.on('error', (error) => {
//   console.log('error: ', error.toString());
// });

module.exports = redis;