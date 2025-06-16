const { Queue } = require('bullmq');

const connection = {
  host: 'redis',
  port: 6379
};

const clipQueue = new Queue('image-clipping', { connection });

export default clipQueue;