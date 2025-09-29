const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let useMemoryServer = true;

beforeAll(async () => {
  try {
    // Try MongoDB Memory Server first (works on x86_64)
    console.log('🔄 Attempting to use MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.6', // Use a version that exists for ARM64
        downloadDir: '/tmp/mongodb-memory-server'
      },
      instance: {
        dbName: 'test-db'
      }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Memory Server connected successfully');
  } catch (error) {
    console.log('⚠️ MongoDB Memory Server failed, falling back to Docker MongoDB...');
    console.log('Error:', error.message);
    
    // Fallback to Docker MongoDB
    useMemoryServer = false;
    const dockerMongoUri = process.env.MONGODB_TEST_URI || 'mongodb://admin:password@mongodb:27017/nodejs-cicd-test?authSource=admin';
    await mongoose.connect(dockerMongoUri);
    console.log('✅ Docker MongoDB connected successfully');
  }
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (useMemoryServer && mongoServer) {
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
