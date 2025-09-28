pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'devops-pipeline-jenkins'
        DOCKER_TAG = "${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = 'devops-pipeline-jenkins'
    }
    
    tools {
        nodejs "${NODE_VERSION}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from repository..."
                    checkout scm
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Branch: ${env.BRANCH_NAME}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    echo "Installing npm dependencies..."
                    sh 'npm --version'
                    sh 'node --version'
                    sh 'npm ci'
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        script {
                            echo "Running ESLint..."
                            sh 'npm run lint'
                        }
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        script {
                            echo "Running security audit..."
                            sh 'npm audit --audit-level moderate'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                script {
                    echo "Running tests with coverage..."
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'coverage/lcov.info'
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Build') {
            steps {
                script {
                    echo "Building application..."
                    sh 'npm run build'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }
        
        stage('Docker Test') {
            steps {
                script {
                    echo "Testing Docker container..."
                    sh "docker run --rm -d --name test-container -p 3001:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    sleep(time: 10, unit: 'SECONDS')
                    sh "curl -f http://localhost:3001/health || exit 1"
                    sh "docker stop test-container"
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Deploying to staging environment..."
                    sh "docker run --rm -d --name staging-app -p 3002:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    echo "Staging deployment completed at http://localhost:3002"
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Running integration tests..."
                    sleep(time: 5, unit: 'SECONDS')
                    sh "curl -f http://localhost:3002/health"
                    sh "curl -f http://localhost:3002/api/users"
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    not { changeRequest() }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    echo "Deploying to production environment..."
                    sh "docker run --rm -d --name production-app -p 3000:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    echo "Production deployment completed at http://localhost:3000"
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Cleaning up..."
                sh 'docker container prune -f'
                sh 'docker image prune -f'
            }
            cleanWs()
        }
        success {
            script {
                echo "Pipeline completed successfully!"
                emailext (
                    subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    body: "Success: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' completed successfully.",
                    to: "${env.CHANGE_AUTHOR_EMAIL}"
                )
            }
        }
        failure {
            script {
                echo "Pipeline failed!"
                emailext (
                    subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    body: "Failed: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' failed.",
                    to: "${env.CHANGE_AUTHOR_EMAIL}"
                )
            }
        }
    }
}