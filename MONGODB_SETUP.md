# MongoDB Setup Guide for Node.js Jenkins CI/CD Pipeline

This guide will help you set up MongoDB locally and configure the application to use it.

## 🚀 **Quick Start**

### **1. Install MongoDB Locally**

#### **Option A: Using Docker (Recommended)**
```bash
# Pull MongoDB image
docker pull mongo:7

# Run MongoDB container
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=nodejs-cicd \
  mongo:7

# Verify MongoDB is running
docker ps | grep mongodb
```

#### **Option B: Install MongoDB Directly**

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service

### **2. Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm list mongoose dotenv bcryptjs
```

### **3. Set Up Environment**
```bash
# Copy environment file
cp env.example .env

# Edit .env file with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/nodejs-cicd
```

### **4. Start the Application**
```bash
# Start the application
npm start

# Or start in development mode
npm run dev
```

### **5. Seed the Database**
```bash
# Seed the database with sample data
npm run db:seed

# Reset the database (optional)
npm run db:reset
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Test API Endpoints**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test users endpoint
curl http://localhost:3000/api/users

# Test stats endpoint
curl http://localhost:3000/api/stats

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 🐳 **Docker Setup**

### **Using Docker Compose (Recommended)**
```bash
# Start all services including MongoDB
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### **Individual Docker Commands**
```bash
# Build application image
docker build -t nodejs-app .

# Run MongoDB container
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7

# Run application container
docker run -d --name nodejs-app \
  -p 3000:3000 \
  --link mongodb:mongodb \
  -e MONGODB_URI=mongodb://admin:password@mongodb:27017/nodejs-cicd?authSource=admin \
  nodejs-app
```

## 📊 **MongoDB Management**

### **Connect to MongoDB**
```bash
# Using MongoDB Shell
mongosh mongodb://localhost:27017/nodejs-cicd

# Or with authentication
mongosh mongodb://admin:password@localhost:27017/nodejs-cicd?authSource=admin
```

### **MongoDB Commands**
```javascript
// Show databases
show dbs

// Use database
use nodejs-cicd

// Show collections
show collections

// Find users
db.users.find()

// Count users
db.users.countDocuments()

// Find specific user
db.users.findOne({email: "john@example.com"})

// Update user
db.users.updateOne(
  {email: "john@example.com"}, 
  {$set: {name: "John Updated"}}
)

// Delete user
db.users.deleteOne({email: "john@example.com"})
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/nodejs-cicd

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# JWT (if using authentication)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **MongoDB Connection Options**
```javascript
// In src/config/database.js
const conn = await mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0 // Disable mongoose buffering
});
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. MongoDB Connection Failed**
```bash
# Check if MongoDB is running
docker ps | grep mongodb
# or
brew services list | grep mongodb
# or
sudo systemctl status mongod

# Check MongoDB logs
docker logs mongodb
# or
sudo journalctl -u mongod
```

#### **2. Authentication Failed**
```bash
# Check MongoDB URI format
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI
```

#### **3. Port Already in Use**
```bash
# Check what's using port 27017
lsof -i :27017

# Kill the process
sudo kill -9 <PID>
```

#### **4. Database Not Found**
```bash
# Create database manually
mongosh mongodb://localhost:27017/nodejs-cicd
db.users.insertOne({name: "Test", email: "test@example.com"})
```

### **Debug Commands**
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB version
mongosh --version

# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

## 📈 **Monitoring**

### **MongoDB Metrics**
- **Connection Count**: Number of active connections
- **Query Performance**: Query execution time
- **Memory Usage**: Database memory consumption
- **Index Usage**: Index hit ratio

### **Application Metrics**
- **Database Queries**: Number of database operations
- **Response Time**: API response time
- **Error Rate**: Failed requests percentage
- **Active Users**: Number of active users

## 🔒 **Security**

### **MongoDB Security**
1. **Enable Authentication**: Use username/password
2. **Network Security**: Bind to specific IPs
3. **SSL/TLS**: Use encrypted connections
4. **Access Control**: Limit user permissions

### **Application Security**
1. **Input Validation**: Validate all inputs
2. **Password Hashing**: Use bcrypt for passwords
3. **Rate Limiting**: Limit API requests
4. **CORS**: Configure cross-origin requests

## 📚 **Additional Resources**

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Node.js MongoDB Driver](https://docs.mongodb.com/drivers/node/)
- [Docker MongoDB](https://hub.docker.com/_/mongo)

## ✅ **Verification Checklist**

- [ ] MongoDB is installed and running
- [ ] Application connects to MongoDB successfully
- [ ] Database is seeded with sample data
- [ ] All tests pass
- [ ] API endpoints work correctly
- [ ] Docker Compose starts all services
- [ ] Monitoring and logging work
- [ ] Security measures are in place

---

**Note**: This setup is designed for development and testing. For production, ensure proper security configurations and monitoring are in place.
