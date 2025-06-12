const { Queue } = require('bullmq');

const connection = {
  host: 'redis',
  port: 6379
};

const imageQueue = new Queue('image-processing', { connection });

export default imageQueue;