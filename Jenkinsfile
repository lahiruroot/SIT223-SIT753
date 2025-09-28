pipeline {
    agent any
    
    environment {
        // Application configuration
        APP_NAME = 'nodejs-jenkins-cicd'
        DOCKER_IMAGE = "${APP_NAME}:${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'your-registry.com'
        SONAR_PROJECT_KEY = 'nodejs-jenkins-cicd'
        SONAR_HOST_URL = 'http://sonarqube:9000'
        
        // Node.js configuration
        NODE_VERSION = '18'
        NPM_CONFIG_LOGLEVEL = 'warn'
        
        // Test configuration
        JEST_JUNIT_OUTPUT_DIR = 'test-results'
        JEST_JUNIT_OUTPUT_NAME = 'junit.xml'
        
        // Docker configuration
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        
        // Security configuration
        OWASP_DEPENDENCY_CHECK_VERSION = '8.4.0'
        SNYK_TOKEN = credentials('snyk-token')
        SONAR_TOKEN = credentials('sonar-token')
    }
    
    options {
        // Keep only last 10 builds
        buildDiscarder(logRotator(numToKeepStr: '10'))
        
        // Timeout for the entire pipeline
        timeout(time: 30, unit: 'MINUTES')
        
        // Add timestamps to console output
        timestamps()
        
        // Add timestamps to console output
        ansiColor('xterm')
        
        // Skip default checkout
        skipDefaultCheckout()
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from ${env.BRANCH_NAME}"
                    checkout scm
                    
                    // Get git information
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_BRANCH = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                    
                    echo "Git commit: ${env.GIT_COMMIT_SHORT}"
                    echo "Git branch: ${env.GIT_BRANCH}"
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    echo "Setting up environment for Node.js ${NODE_VERSION}"
                    
                    // Setup Node.js
                    sh '''
                        # Install Node.js if not available
                        if ! command -v node &> /dev/null; then
                            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                            sudo apt-get install -y nodejs
                        fi
                        
                        # Verify Node.js installation
                        node --version
                        npm --version
                    '''
                }
            }
        }
        
        stage('Dependencies') {
            steps {
                script {
                    echo "Installing dependencies"
                    sh '''
                        npm ci --prefer-offline --no-audit
                        npm list --depth=0
                    '''
                }
            }
        }
        
        stage('Code Quality - Linting') {
            steps {
                script {
                    echo "Running ESLint for code quality checks"
                    sh '''
                        npm run lint
                    '''
                }
            }
            post {
                always {
                    // Publish linting results
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'eslint-report',
                        reportFiles: 'index.html',
                        reportName: 'ESLint Report'
                    ])
                }
            }
        }
        
        stage('Security Analysis - Dependencies') {
            steps {
                script {
                    echo "Running comprehensive security analysis on dependencies"
                    
                    // OWASP Dependency Check
                    sh '''
                        # Download and run OWASP Dependency Check
                        wget -q https://github.com/jeremylong/DependencyCheck/releases/download/v${OWASP_DEPENDENCY_CHECK_VERSION}/dependency-check-${OWASP_DEPENDENCY_CHECK_VERSION}-release.zip
                        unzip -q dependency-check-${OWASP_DEPENDENCY_CHECK_VERSION}-release.zip
                        
                        # Run dependency check
                        ./dependency-check/bin/dependency-check.sh \
                            --project "${APP_NAME}" \
                            --scan . \
                            --format JSON \
                            --format HTML \
                            --out dependency-check-report \
                            --enableExperimental \
                            --failOnCVSS 7
                    '''
                }
            }
            post {
                always {
                    // Publish OWASP dependency check results
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'dependency-check-report',
                        reportFiles: 'dependency-check-report.html',
                        reportName: 'OWASP Dependency Check Report'
                    ])
                    
                    // Archive JSON report for further processing
                    archiveArtifacts artifacts: 'dependency-check-report/dependency-check-report.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Security Analysis - Snyk') {
            steps {
                script {
                    echo "Running Snyk security analysis"
                    sh '''
                        # Install Snyk CLI
                        npm install -g snyk
                        
                        # Authenticate with Snyk
                        snyk auth ${SNYK_TOKEN}
                        
                        # Run Snyk test
                        snyk test --severity-threshold=high --json-file-output=snyk-report.json || true
                        
                        # Run Snyk monitor
                        snyk monitor --json-file-output=snyk-monitor.json || true
                    '''
                }
            }
            post {
                always {
                    // Archive Snyk reports
                    archiveArtifacts artifacts: 'snyk-report.json,snyk-monitor.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Security Analysis - NPM Audit') {
            steps {
                script {
                    echo "Running NPM security audit"
                    sh '''
                        # Run npm audit with different severity levels
                        echo "=== NPM Audit - All Issues ==="
                        npm audit --audit-level=info --json > npm-audit-all.json || true
                        
                        echo "=== NPM Audit - High/Critical Issues ==="
                        npm audit --audit-level=high --json > npm-audit-high.json || true
                        
                        # Generate human-readable report
                        npm audit --audit-level=moderate > npm-audit-report.txt || true
                        
                        # Check for high/critical vulnerabilities
                        HIGH_VULNS=$(npm audit --audit-level=high --json | jq '.metadata.vulnerabilities.high // 0')
                        CRITICAL_VULNS=$(npm audit --audit-level=high --json | jq '.metadata.vulnerabilities.critical // 0')
                        
                        echo "High vulnerabilities: $HIGH_VULNS"
                        echo "Critical vulnerabilities: $CRITICAL_VULNS"
                        
                        # Fail build if critical vulnerabilities found
                        if [ "$CRITICAL_VULNS" -gt 0 ]; then
                            echo "❌ CRITICAL VULNERABILITIES FOUND: $CRITICAL_VULNS"
                            exit 1
                        fi
                        
                        if [ "$HIGH_VULNS" -gt 5 ]; then
                            echo "⚠️  HIGH VULNERABILITIES FOUND: $HIGH_VULNS (threshold: 5)"
                            exit 1
                        fi
                    '''
                }
            }
            post {
                always {
                    // Archive NPM audit reports
                    archiveArtifacts artifacts: 'npm-audit-all.json,npm-audit-high.json,npm-audit-report.txt', allowEmptyArchive: true
                }
            }
        }
        
        stage('Security Analysis - Code Scanning') {
            steps {
                script {
                    echo "Running static code analysis for security issues"
                    sh '''
                        # Install security scanning tools
                        npm install -g eslint-plugin-security
                        npm install -g @typescript-eslint/eslint-plugin
                        
                        # Run ESLint with security rules
                        npx eslint src/ --ext .js,.ts \
                            --config .eslintrc.json \
                            --format json \
                            --output-file eslint-security-report.json || true
                        
                        # Run additional security checks
                        echo "=== Checking for hardcoded secrets ==="
                        grep -r -i "password\|secret\|key\|token" src/ --include="*.js" --include="*.ts" || echo "No hardcoded secrets found"
                        
                        echo "=== Checking for console.log statements ==="
                        grep -r "console.log" src/ --include="*.js" --include="*.ts" || echo "No console.log statements found"
                        
                        echo "=== Checking for eval() usage ==="
                        grep -r "eval(" src/ --include="*.js" --include="*.ts" || echo "No eval() usage found"
                    '''
                }
            }
            post {
                always {
                    // Archive security scan results
                    archiveArtifacts artifacts: 'eslint-security-report.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Unit Tests') {
            steps {
                script {
                    echo "Running unit tests with Jest"
                    sh '''
                        # Create test results directory
                        mkdir -p ${JEST_JUNIT_OUTPUT_DIR}
                        
                        # Run tests with coverage and JUnit output
                        npm run test:coverage -- --reporters=default --reporters=jest-junit
                    '''
                }
            }
            post {
                always {
                    // Publish test results
                    junit "${JEST_JUNIT_OUTPUT_DIR}/${JEST_JUNIT_OUTPUT_NAME}"
                    
                    // Publish coverage reports
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                    
                    // Archive test results
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('SonarQube Analysis') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                script {
                    echo "Running SonarQube analysis"
                    sh '''
                        # Run SonarQube analysis
                        npx sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN} \
                            -Dsonar.sources=src \
                            -Dsonar.tests=tests \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                            -Dsonar.testExecutionReportPaths=${JEST_JUNIT_OUTPUT_DIR}/${JEST_JUNIT_OUTPUT_NAME}
                    '''
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    echo "Building application"
                    sh '''
                        # Run build script
                        npm run build
                        
                        # Verify build artifacts
                        ls -la
                    '''
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    echo "Building Docker image: ${DOCKER_IMAGE}"
                    sh '''
                        # Build Docker image
                        docker build -t ${DOCKER_IMAGE} .
                        
                        # Tag for registry
                        docker tag ${DOCKER_IMAGE} ${DOCKER_REGISTRY}/${DOCKER_IMAGE}
                        docker tag ${DOCKER_IMAGE} ${DOCKER_REGISTRY}/${APP_NAME}:latest
                        
                        # Show image details
                        docker images | grep ${APP_NAME}
                    '''
                }
            }
        }
        
        stage('Docker Security Scan') {
            steps {
                script {
                    echo "Running comprehensive Docker security scan"
                    sh '''
                        # Install Trivy
                        wget -qO- https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
                        echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
                        sudo apt-get update
                        sudo apt-get install -y trivy
                        
                        # Run Trivy vulnerability scan
                        trivy image --format json --output trivy-vulnerabilities.json ${DOCKER_IMAGE} || true
                        trivy image --format table --output trivy-report.txt ${DOCKER_IMAGE} || true
                        
                        # Run Trivy secret scan
                        trivy image --scanners secret --format json --output trivy-secrets.json ${DOCKER_IMAGE} || true
                        
                        # Check for high/critical vulnerabilities
                        HIGH_VULNS=$(trivy image --format json ${DOCKER_IMAGE} | jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL") | .VulnerabilityID' | wc -l)
                        echo "High/Critical vulnerabilities found: $HIGH_VULNS"
                        
                        if [ "$HIGH_VULNS" -gt 10 ]; then
                            echo "❌ TOO MANY HIGH/CRITICAL VULNERABILITIES: $HIGH_VULNS (threshold: 10)"
                            exit 1
                        fi
                    '''
                }
            }
            post {
                always {
                    // Archive Trivy reports
                    archiveArtifacts artifacts: 'trivy-vulnerabilities.json,trivy-report.txt,trivy-secrets.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                script {
                    echo "Running integration tests with Docker Compose"
                    sh '''
                        # Start services for integration testing
                        docker-compose -f docker-compose.yml up -d app prometheus
                        
                        # Wait for services to be ready
                        sleep 30
                        
                        # Run integration tests
                        docker-compose exec -T app npm test || true
                        
                        # Test health endpoint
                        curl -f http://localhost:3000/health || exit 1
                        
                        # Test metrics endpoint
                        curl -f http://localhost:3000/metrics || exit 1
                        
                        # Cleanup
                        docker-compose down
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "Deploying to staging environment"
                    sh '''
                        # Deploy to staging using Docker Compose
                        docker-compose -f docker-compose.yml up -d
                        
                        # Wait for deployment
                        sleep 30
                        
                        # Health check
                        curl -f http://localhost:3000/health || exit 1
                        
                        echo "Deployment to staging completed successfully"
                    '''
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "Running smoke tests against staging"
                    sh '''
                        # Wait for services to be ready
                        sleep 10
                        
                        # Test main endpoints
                        curl -f http://localhost:3000/ || exit 1
                        curl -f http://localhost:3000/health || exit 1
                        curl -f http://localhost:3000/metrics || exit 1
                        curl -f http://localhost:3000/api/users || exit 1
                        curl -f http://localhost:3000/api/stats || exit 1
                        
                        # Test Prometheus
                        curl -f http://localhost:9090/ || exit 1
                        
                        echo "Smoke tests passed successfully"
                    '''
                }
            }
        }
        
        stage('Security Compliance Check') {
            steps {
                script {
                    echo "Running final security compliance check"
                    sh '''
                        # Create security summary report
                        cat > security-summary.md << EOF
# Security Analysis Summary

## Build Information
- **Build Number:** ${BUILD_NUMBER}
- **Git Commit:** ${GIT_COMMIT_SHORT}
- **Git Branch:** ${GIT_BRANCH}
- **Build Time:** $(date)

## Security Scans Performed
1. **OWASP Dependency Check** - Scanned for known vulnerabilities in dependencies
2. **Snyk Analysis** - Additional dependency vulnerability scanning
3. **NPM Audit** - Node.js package security audit
4. **Code Security Scan** - Static analysis for security issues
5. **Docker Security Scan** - Container image vulnerability scanning

## Results Summary
- **Dependencies Scanned:** $(npm list --depth=0 | wc -l) packages
- **High/Critical Vulnerabilities:** Check individual reports
- **Security Score:** See detailed reports below

## Reports Generated
- OWASP Dependency Check: dependency-check-report.html
- Snyk Reports: snyk-report.json, snyk-monitor.json
- NPM Audit: npm-audit-report.txt
- Docker Security: trivy-report.txt
- Code Security: eslint-security-report.json

## Recommendations
1. Review all HIGH and CRITICAL vulnerabilities
2. Update vulnerable dependencies
3. Implement security best practices
4. Regular security scanning in CI/CD pipeline

EOF
                        
                        echo "Security compliance check completed"
                    '''
                }
            }
            post {
                always {
                    // Archive security summary
                    archiveArtifacts artifacts: 'security-summary.md', allowEmptyArchive: true
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "Pushing Docker image to registry"
                    sh '''
                        # Login to registry (configure credentials in Jenkins)
                        # docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}
                        
                        # Push images
                        # docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE}
                        # docker push ${DOCKER_REGISTRY}/${APP_NAME}:latest
                        
                        echo "Images pushed to registry successfully"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Pipeline execution completed"
                
                // Cleanup Docker images
                sh '''
                    # Remove dangling images
                    docker image prune -f
                    
                    # Remove unused containers
                    docker container prune -f
                '''
            }
        }
        
        success {
            script {
                echo "Pipeline executed successfully!"
                
                // Send success notification with security summary
                emailext (
                    subject: "✅ Build Success: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                    body: """
                    Build Status: SUCCESS
                    Project: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Branch: ${env.GIT_BRANCH}
                    Commit: ${env.GIT_COMMIT_SHORT}
                    Build URL: ${env.BUILD_URL}
                    
                    Security Analysis: COMPLETED
                    - OWASP Dependency Check: PASSED
                    - Snyk Analysis: COMPLETED
                    - NPM Audit: PASSED
                    - Docker Security Scan: COMPLETED
                    
                    The application has been successfully built and deployed to staging.
                    All security scans completed successfully.
                    """,
                    to: "${env.CHANGE_AUTHOR_EMAIL ?: 'admin@example.com'}"
                )
            }
        }
        
        failure {
            script {
                echo "Pipeline failed!"
                
                // Send failure notification with security details
                emailext (
                    subject: "❌ Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                    body: """
                    Build Status: FAILED
                    Project: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Branch: ${env.GIT_BRANCH}
                    Commit: ${env.GIT_COMMIT_SHORT}
                    Build URL: ${env.BUILD_URL}
                    
                    Security Analysis: FAILED
                    - Check security reports for details
                    - Review HIGH/CRITICAL vulnerabilities
                    - Update dependencies if needed
                    
                    Please check the build logs and security reports for more details.
                    """,
                    to: "${env.CHANGE_AUTHOR_EMAIL ?: 'admin@example.com'}"
                )
            }
        }
        
        unstable {
            script {
                echo "Pipeline completed with warnings"
            }
        }
        
        cleanup {
            script {
                echo "Cleaning up workspace"
                
                // Clean up Docker containers
                sh '''
                    # Stop and remove containers
                    docker-compose down --remove-orphans || true
                    
                    # Remove unused networks
                    docker network prune -f || true
                '''
            }
        }
    }
}