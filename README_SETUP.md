# Node.js Jenkins CI/CD Pipeline - Setup Guide

This document provides comprehensive setup instructions for the Node.js Jenkins CI/CD pipeline project, designed to achieve a High Distinction for SIT223-SIT753 assignment.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Docker Setup](#docker-setup)
5. [Jenkins Setup](#jenkins-setup)
6. [SonarQube Setup](#sonarqube-setup)
7. [Prometheus & Monitoring Setup](#prometheus--monitoring-setup)
8. [Pipeline Configuration](#pipeline-configuration)
9. [Testing the Pipeline](#testing-the-pipeline)
10. [Troubleshooting](#troubleshooting)
11. [Demo Checklist](#demo-checklist)

## 🎯 Project Overview

This project implements a complete Node.js application with a comprehensive Jenkins CI/CD pipeline including:

- **Node.js Express Application** with REST API endpoints
- **Comprehensive Testing** with Jest unit tests
- **Code Quality** with ESLint and SonarQube
- **Containerization** with multi-stage Docker builds
- **Monitoring** with Prometheus and Grafana
- **CI/CD Pipeline** with Jenkins declarative pipeline
- **Security Scanning** and vulnerability assessment
- **Automated Deployment** to staging environment

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 20GB free space
- **CPU**: 4 cores minimum

### Software Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: Latest version
- **Java**: Version 11 or higher (for Jenkins)

### Optional but Recommended
- **Jenkins**: Version 2.400 or higher
- **SonarQube**: Version 9.x or higher
- **Prometheus**: Version 2.x or higher
- **Grafana**: Version 9.x or higher

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd SIT223-SIT753
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Verify installation
npm --version
node --version
```

### 3. Run the Application Locally
```bash
# Start the application in development mode
npm run dev

# Or start in production mode
npm start
```

### 4. Test the Application
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### 5. Verify Endpoints
Open your browser and test the following endpoints:
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics
- **API Documentation**: http://localhost:3000/
- **Users API**: http://localhost:3000/api/users
- **Stats API**: http://localhost:3000/api/stats

## 🐳 Docker Setup

### 1. Build the Docker Image
```bash
# Build the production image
docker build -t nodejs-app .

# Build with specific target
docker build --target production -t nodejs-app:prod .
docker build --target development -t nodejs-app:dev .
```

### 2. Run the Container
```bash
# Run the application
docker run -p 3000:3000 nodejs-app

# Run with environment variables
docker run -p 3000:3000 -e NODE_ENV=production nodejs-app

# Run in detached mode
docker run -d -p 3000:3000 --name nodejs-app nodejs-app
```

### 3. Test the Container
```bash
# Check container status
docker ps

# View container logs
docker logs nodejs-app

# Test health endpoint
curl http://localhost:3000/health

# Stop and remove container
docker stop nodejs-app
docker rm nodejs-app
```

## 🏗️ Jenkins Setup

### 1. Install Jenkins
```bash
# On Ubuntu/Debian
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins

# On macOS with Homebrew
brew install jenkins

# On Windows
# Download from https://jenkins.io/download/
```

### 2. Start Jenkins
```bash
# Start Jenkins service
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Or start manually
sudo systemctl start jenkins
```

### 3. Access Jenkins
1. Open browser and go to `http://localhost:8080`
2. Get the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Follow the setup wizard
4. Install recommended plugins

### 4. Install Required Plugins
Install the following plugins in Jenkins:
- **Pipeline**: For declarative pipeline support
- **Docker Pipeline**: For Docker integration
- **SonarQube Scanner**: For code quality analysis
- **HTML Publisher**: For test reports
- **JUnit**: For test result publishing
- **Cobertura**: For coverage reports
- **Email Extension**: For notifications
- **Blue Ocean**: For pipeline visualization (optional)

### 5. Configure Global Tools
1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Configure:
   - **NodeJS**: Install Node.js 18.x
   - **Docker**: Configure Docker installation
   - **SonarQube Scanner**: Install SonarQube scanner

### 6. Configure Credentials
1. Go to **Manage Jenkins** → **Manage Credentials**
2. Add credentials for:
   - **Docker Registry** (if using private registry)
   - **SonarQube Token**
   - **Email SMTP** (for notifications)

## 🔍 SonarQube Setup

### 1. Install SonarQube
```bash
# Using Docker (recommended)
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# Or download from https://sonarqube.org/downloads/
```

### 2. Access SonarQube
1. Open browser and go to `http://localhost:9000`
2. Login with default credentials: `admin/admin`
3. Change the default password

### 3. Create Project
1. Go to **Projects** → **Create Project**
2. Choose **Manually**
3. Set project key: `nodejs-jenkins-cicd`
4. Set display name: `Node.js Jenkins CI/CD Pipeline`

### 4. Generate Token
1. Go to **User** → **My Account** → **Security**
2. Generate a new token
3. Copy the token for Jenkins configuration

### 5. Configure Quality Gates
1. Go to **Quality Gates** → **Create**
2. Set up quality gate rules:
   - **Coverage**: > 80%
   - **Duplicated Lines**: < 3%
   - **Maintainability Rating**: A
   - **Reliability Rating**: A
   - **Security Rating**: A

## 📊 Prometheus & Monitoring Setup

### 1. Install Prometheus
```bash
# Using Docker
docker run -d --name prometheus -p 9090:9090 prom/prometheus

# Or download from https://prometheus.io/download/
```

### 2. Install Grafana
```bash
# Using Docker
docker run -d --name grafana -p 3001:3000 grafana/grafana

# Or download from https://grafana.com/grafana/download/
```

### 3. Configure Prometheus
1. Copy `prometheus.yml` to Prometheus configuration directory
2. Restart Prometheus with new configuration
3. Verify targets are being scraped at `http://localhost:9090/targets`

### 4. Configure Grafana
1. Access Grafana at `http://localhost:3001`
2. Login with default credentials: `admin/admin`
3. Add Prometheus as data source
4. Import dashboards for Node.js monitoring

## 🔄 Pipeline Configuration

### 1. Create Jenkins Pipeline Job
1. Go to **New Item** → **Pipeline**
2. Name: `nodejs-jenkins-cicd`
3. Configure:
   - **Pipeline script from SCM**
   - **SCM**: Git
   - **Repository URL**: Your repository URL
   - **Script Path**: `Jenkinsfile`

### 2. Configure Pipeline Parameters
1. Go to **Configure** → **Parameters**
2. Add parameters:
   - **DOCKER_REGISTRY**: Your Docker registry URL
   - **SONAR_TOKEN**: SonarQube token
   - **EMAIL_RECIPIENTS**: Email addresses for notifications

### 3. Configure Webhooks
1. In your Git repository, go to **Settings** → **Webhooks**
2. Add webhook URL: `http://your-jenkins-url/github-webhook/`
3. Select events: **Push** and **Pull Request**

## 🧪 Testing the Pipeline

### 1. Manual Pipeline Trigger
1. Go to your Jenkins job
2. Click **Build Now**
3. Monitor the pipeline execution
4. Check each stage for success/failure

### 2. Test with Git Push
1. Make a small change to the code
2. Commit and push to repository
3. Verify pipeline triggers automatically
4. Check notifications are sent

### 3. Test Different Scenarios
- **Successful build**: Push working code
- **Failed tests**: Push code with failing tests
- **Linting errors**: Push code with ESLint errors
- **Security issues**: Push code with vulnerabilities

## 🔧 Troubleshooting

### Common Issues

#### 1. Jenkins Pipeline Fails
```bash
# Check Jenkins logs
sudo journalctl -u jenkins -f

# Check pipeline console output
# Go to Jenkins job → Build → Console Output
```

#### 2. Docker Build Fails
```bash
# Check Docker daemon
sudo systemctl status docker

# Check Docker logs
docker logs <container-name>

# Test Docker build locally
docker build -t test-app .
```

#### 3. SonarQube Analysis Fails
```bash
# Check SonarQube logs
docker logs sonarqube

# Verify SonarQube is accessible
curl http://localhost:9000/api/system/status

# Check project configuration
# Go to SonarQube → Projects → Your Project
```

#### 4. Prometheus Not Scraping
```bash
# Check Prometheus configuration
curl http://localhost:9090/api/v1/targets

# Check application metrics endpoint
curl http://localhost:3000/metrics

# Verify Prometheus configuration
promtool check config prometheus.yml
```

### Debug Commands
```bash
# Check all running containers
docker ps -a

# Check Docker Compose services
docker-compose ps

# Check Jenkins plugins
# Go to Manage Jenkins → Manage Plugins

# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

## ✅ Demo Checklist

### Pre-Demo Setup
- [ ] All services running (Jenkins, SonarQube, Prometheus, Grafana)
- [ ] Pipeline job created and configured
- [ ] Webhooks configured for automatic triggering
- [ ] Email notifications configured
- [ ] Docker images built and tested

### Demo Flow
1. **Show Project Structure**
   - [ ] Explain each file and its purpose
   - [ ] Show package.json with dependencies
   - [ ] Show Dockerfile with multi-stage build

2. **Demonstrate Local Development**
   - [ ] Run application locally
   - [ ] Show health and metrics endpoints
   - [ ] Run tests and show coverage
   - [ ] Show linting results

3. **Show Docker Integration**
   - [ ] Build Docker image
   - [ ] Run container
   - [ ] Show health checks
   - [ ] Show metrics collection

4. **Demonstrate Jenkins Pipeline**
   - [ ] Trigger pipeline manually
   - [ ] Show each stage execution
   - [ ] Show test results and coverage
   - [ ] Show SonarQube analysis
   - [ ] Show Docker build and security scan

5. **Show Monitoring and Observability**
   - [ ] Show Prometheus metrics
   - [ ] Show Grafana dashboards
   - [ ] Show health check endpoints
   - [ ] Show application logs

6. **Demonstrate CI/CD Flow**
   - [ ] Make code change
   - [ ] Commit and push
   - [ ] Show automatic pipeline trigger
   - [ ] Show deployment to staging
   - [ ] Show notifications

7. **Show Quality Gates**
   - [ ] Show SonarQube quality gate results
   - [ ] Show test coverage reports
   - [ ] Show security scan results
   - [ ] Show code quality metrics

### Post-Demo Cleanup
- [ ] Stop all services
- [ ] Clean up Docker containers and images
- [ ] Reset Jenkins workspace
- [ ] Clear SonarQube project data

## 📚 Additional Resources

### Documentation
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Useful Commands
```bash
# Quick start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build

# Clean up everything
docker-compose down -v --rmi all
```

## 🎓 Assignment Submission

### Files to Submit
1. **Source Code**: All source files in `src/` directory
2. **Tests**: All test files in `tests/` directory
3. **Configuration**: All configuration files (`.eslintrc.json`, `sonar-project.properties`, etc.)
4. **Docker**: `Dockerfile` and `docker-compose.yml`
5. **Pipeline**: `Jenkinsfile`
6. **Documentation**: `README_SETUP.md` and `README.md`

### Key Features Demonstrated
- ✅ **Complete Node.js Application** with REST API
- ✅ **Comprehensive Testing** with Jest and Supertest
- ✅ **Code Quality** with ESLint and SonarQube
- ✅ **Containerization** with multi-stage Docker builds
- ✅ **CI/CD Pipeline** with Jenkins declarative pipeline
- ✅ **Monitoring** with Prometheus and Grafana
- ✅ **Security Scanning** and vulnerability assessment
- ✅ **Automated Deployment** to staging environment
- ✅ **Health Checks** and metrics collection
- ✅ **Error Handling** and logging

This setup provides a production-ready CI/CD pipeline that demonstrates best practices for modern software development and deployment.

---

**Note**: This project is designed for educational purposes as part of the SIT223-SIT753 assignment. Ensure all credentials and sensitive information are properly secured in production environments.
