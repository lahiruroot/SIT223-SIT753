const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nodejs-cicd';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected for reset');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const resetDatabase = async () => {
  try {
    // Clear all users
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);
    
    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully');

  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

const main = async () => {
  await connectDB();
  await resetDatabase();
  await mongoose.connection.close();
  console.log('Database reset completed');
  process.exit(0);
};

main();
