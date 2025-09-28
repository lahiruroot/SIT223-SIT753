# SIT223-SIT753: DevOps Pipeline with Jenkins

This repository demonstrates a comprehensive DevOps pipeline implementation using Jenkins, Docker, and Node.js. It includes automated testing, code quality checks, containerization, and deployment stages.

## 🚀 Features

- **Node.js Express Application** - RESTful API with health checks
- **Comprehensive Testing** - Unit tests with Jest and Supertest
- **Code Quality** - ESLint for code linting and style consistency
- **Containerization** - Docker support with multi-stage builds
- **CI/CD Pipeline** - Jenkins pipeline with multiple stages
- **Security** - Security audits and best practices
- **Monitoring** - Health checks and application metrics

## 📋 Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Jenkins (for CI/CD pipeline)
- Git

## 🛠️ Local Development

### 1. Clone the repository
```bash
git clone https://github.com/lahiruroot/SIT223-SIT753.git
cd SIT223-SIT753
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Run tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### 5. Code quality checks
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🐳 Docker Usage

### Build and run with Docker
```bash
# Build the image
docker build -t devops-pipeline-jenkins .

# Run the container
docker run -p 3000:3000 devops-pipeline-jenkins
```

### Using Docker Compose
```bash
# Development
docker-compose up

# Production with nginx
docker-compose --profile production up
```

## 🔄 Jenkins Pipeline

The Jenkins pipeline includes the following stages:

1. **Checkout** - Retrieves source code from repository
2. **Install Dependencies** - Installs npm packages
3. **Code Quality** - Runs linting and security audits in parallel
4. **Test** - Executes unit tests with coverage reporting
5. **Build** - Builds the application
6. **Docker Build** - Creates Docker images
7. **Docker Test** - Tests the containerized application
8. **Deploy to Staging** - Deploys to staging environment (main branch only)
9. **Integration Tests** - Runs integration tests against staging
10. **Deploy to Production** - Manual approval for production deployment

### Pipeline Features

- **Parallel Execution** - Code quality checks run in parallel
- **Branch-based Deployment** - Different actions based on git branch
- **Manual Approval** - Production deployment requires manual approval
- **Notifications** - Email notifications on success/failure
- **Cleanup** - Automatic cleanup of Docker resources
- **Health Checks** - Automated health checks for deployments

## 📊 API Endpoints

- `GET /` - Welcome message with application info
- `GET /health` - Health check endpoint
- `GET /api/users` - Sample users API endpoint

## 🧪 Testing

The application includes comprehensive tests:

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test API endpoints
- **Coverage Reports** - HTML and LCOV coverage reports
- **Health Check Tests** - Validate application health

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key configuration options:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)
- `LOG_LEVEL` - Logging level

### Jenkins Configuration

1. Install required Jenkins plugins:
   - NodeJS Plugin
   - Docker Plugin
   - HTML Publisher Plugin
   - Email Extension Plugin

2. Configure NodeJS tool in Jenkins Global Tool Configuration

3. Create a new Pipeline job and point to this repository

## 🚀 Deployment

### Staging Deployment
Automatically triggered on main branch builds.

### Production Deployment
Requires manual approval through Jenkins interface.

### Health Monitoring
All deployments include automatic health checks to ensure successful deployment.

## 📈 Monitoring and Logging

- Health check endpoint at `/health`
- Application metrics and uptime tracking
- Error handling and logging
- Docker health checks

## 🔒 Security

- Non-root Docker user
- Security audit in CI pipeline
- Environment variable management
- Input validation and error handling

## 📝 Development Workflow

1. Create feature branch from `main`
2. Make changes and add tests
3. Commit changes with descriptive messages
4. Push to repository
5. Create pull request
6. Jenkins automatically runs pipeline
7. Merge after review and successful pipeline

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎓 Academic Context

This project is part of SIT223-SIT753 coursework demonstrating:

- DevOps practices and principles
- CI/CD pipeline implementation
- Infrastructure as Code
- Containerization strategies
- Automated testing and quality assurance
- Deployment automation
- Monitoring and observability

## 📞 Support

For questions or issues related to this project, please create an issue in the repository or contact the development team.
