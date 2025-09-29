const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  // Configure MongoDB Memory Server for Debian 12 compatibility
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.3', // Use compatible version for Debian 12
      downloadDir: '/tmp/mongodb-memory-server'
    },
    instance: {
      dbName: 'test-db'
    }
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 10000); // Increase timeout to 10 seconds

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
