db = db.getSiblingDB('nodejs-cicd');

// Create a user for the application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'nodejs-cicd'
    }
  ]
});

// Create initial collections
db.createCollection('users');

// Insert some sample data
db.users.insertMany([
  {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Database initialized successfully');
