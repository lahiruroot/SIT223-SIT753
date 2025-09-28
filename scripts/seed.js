const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nodejs-cicd';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create sample users
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'admin'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        password: 'password123',
        role: 'admin'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    
    // Display created users
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const main = async () => {
  await connectDB();
  await seedUsers();
  await mongoose.connection.close();
  console.log('Seeding completed');
  process.exit(0);
};

main();
