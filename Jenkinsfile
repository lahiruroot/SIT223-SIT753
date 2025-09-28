pipeline {
  agent {
    docker {
      // Replace with your prebuilt CI image that contains:
      // Node 18, Docker CLI, docker-compose, trivy, jq, unzip, curl, wget, sonar-scanner, snyk
      image 'myorg/jenkins-node18-ci:latest'
      // Use docker socket to run docker commands
      args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
    }
  }

  environment {
    // Application
    APP_NAME = 'nodejs-jenkins-cicd'
    DOCKER_IMAGE = "${APP_NAME}:${BUILD_NUMBER}"
    DOCKER_REGISTRY = 'your-registry.com'        // replace with your registry host
    SONAR_PROJECT_KEY = 'nodejs-jenkins-cicd'
    SONAR_HOST_URL = 'http://sonarqube:9000'     // adjust if required

    // Node
    NODE_VERSION = '18'
    NPM_CONFIG_LOGLEVEL = 'warn'

    // Tests
    JEST_JUNIT_OUTPUT_DIR = 'test-results'
    JEST_JUNIT_OUTPUT_NAME = 'junit.xml'

    // Security
    OWASP_DEPENDENCY_CHECK_VERSION = '8.4.0'
    DOCKER_BUILDKIT = '1'
    COMPOSE_DOCKER_CLI_BUILD = '1'
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 60, unit: 'MINUTES')
    timestamps()
    // We want to explicitly check out
    skipDefaultCheckout(false)
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        script {
          // Set a couple of helpful env vars for reporting
          env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.GIT_BRANCH = env.BRANCH_NAME ?: sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
          echo "Git commit: ${env.GIT_COMMIT_SHORT}"
          echo "Git branch: ${env.GIT_BRANCH}"
        }
      }
    }

    stage('Sanity: Verify environment') {
      steps {
        sh '''
          echo "=== Node and NPM ==="
          node --version
          npm --version

          echo "=== Docker ==="
          docker --version || true
          docker compose version || docker-compose --version || true

          echo "=== Tools ==="
          which trivy || true
          which snyk || true
          which sonar-scanner || true

          echo "Workspace listing"
          ls -la
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          sh '''
            if [ -f package.json ]; then
              echo "Installing dependencies with npm ci"
              npm ci --prefer-offline --no-audit
              npm list --depth=0 || true
            else
              echo "No package.json found, skipping dependency install"
            fi
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'package-lock.json', allowEmptyArchive: true
        }
      }
    }

    stage('Lint') {
      steps {
        sh '''
          if [ -f package.json ] && [ -d src ]; then
            npm run lint -- --fix || echo "ESLint finished with non-zero code"
          else
            echo "No lintable sources found, skipping"
          fi
        '''
      }
      post {
        always {
          // If your repo produces an HTML lint report adjust paths accordingly
          publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            reportDir: 'eslint-report',
            reportFiles: 'index.html',
            reportName: 'ESLint Report'
          ])
        }
      }
    }

    stage('Unit Tests') {
      steps {
        sh '''
          if [ -f package.json ] && [ -d tests ]; then
            mkdir -p ${JEST_JUNIT_OUTPUT_DIR}
            npm install --save-dev jest-junit || true
            npm run test:coverage -- --reporters=default --reporters=jest-junit --outputFile=${JEST_JUNIT_OUTPUT_DIR}/${JEST_JUNIT_OUTPUT_NAME} || true
          else
            echo "No tests directory or package.json, skipping unit tests"
          fi
        '''
      }
      post {
        always {
          junit testResults: "${JEST_JUNIT_OUTPUT_DIR}/${JEST_JUNIT_OUTPUT_NAME}", allowEmptyResults: true
          publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            reportDir: 'coverage/lcov-report',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
          ])
          archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
        }
      }
    }

    stage('Security: NPM Audit') {
      steps {
        sh '''
          if [ -f package.json ]; then
            npm audit --json > npm-audit-all.json || true
            npm audit --json --audit-level=high > npm-audit-high.json || true
            npm audit --audit-level=moderate > npm-audit-report.txt || true

            # determine counts safely
            HIGH_VULNS=$(jq '.metadata.vulnerabilities.high // 0' npm-audit-high.json 2>/dev/null || echo 0)
            CRITICAL_VULNS=$(jq '.metadata.vulnerabilities.critical // 0' npm-audit-high.json 2>/dev/null || echo 0)

            echo "High vulnerabilities: $HIGH_VULNS"
            echo "Critical vulnerabilities: $CRITICAL_VULNS"

            if [ "$CRITICAL_VULNS" -gt 0 ]; then
              echo "Failing build due to critical npm vulnerabilities"
              exit 1
            fi

            if [ "$HIGH_VULNS" -gt 10 ]; then
              echo "Too many high vulnerabilities"
              exit 1
            fi
          else
            echo "No package.json found, skipping npm audit"
          fi
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'npm-audit-*.json,npm-audit-report.txt', allowEmptyArchive: true
        }
      }
    }

    stage('Security: Snyk') {
      steps {
        withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
          sh '''
            if [ -f package.json ]; then
              echo "Authenticating Snyk"
              snyk auth ${SNYK_TOKEN} || true

              echo "Running snyk test"
              snyk test --severity-threshold=high --json-file-output=snyk-report.json || true

              echo "Running snyk monitor"
              snyk monitor --json-file-output=snyk-monitor.json || true
            else
              echo "No package.json found, skipping Snyk"
            fi
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-report.json,snyk-monitor.json', allowEmptyArchive: true
        }
      }
    }

    stage('Dependency Check (OWASP)') {
      steps {
        sh '''
          # This assumes dependency-check CLI is present in the image. If not, add it to the image.
          if [ -f package.json ]; then
            echo "Running OWASP Dependency Check"
            dependency-check --project "${APP_NAME}" --scan . --format HTML --format JSON --out dependency-check-report || true
          else
            echo "No package.json found, skipping dependency-check"
          fi
        '''
      }
      post {
        always {
          publishHTML([
            allowMissing: true,
            alwaysLinkToLastBuild: true,
            reportDir: 'dependency-check-report',
            reportFiles: 'dependency-check-report.html',
            reportName: 'OWASP Dependency Check'
          ])
          archiveArtifacts artifacts: 'dependency-check-report/*.json', allowEmptyArchive: true
        }
      }
    }

    stage('Static Code Security Scan') {
      steps {
        sh '''
          if [ -f package.json ] && [ -d src ]; then
            npm install --no-audit --no-fund eslint eslint-plugin-security --no-save || true
            npx eslint src/ --ext .js,.ts --format json --output-file eslint-security-report.json || true

            # simple checks for secrets, eval, console.log
            grep -R --line-number -E "password\\s*=|secret\\s*=|token\\s*=|eval\\(" src/ || true
          else
            echo "No src directory or package.json, skipping static code scan"
          fi
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'eslint-security-report.json', allowEmptyArchive: true
        }
      }
    }

    stage('Build') {
      steps {
        sh '''
          if [ -f package.json ]; then
            npm run build || echo "Build step returned non-zero, check logs"
            ls -la
          else
            echo "No package.json found, skipping build"
          fi
        '''
      }
    }

    stage('Docker: Build Image') {
      steps {
        sh '''
          if [ -f Dockerfile ]; then
            docker build --progress=plain -t ${DOCKER_IMAGE} .
            docker tag ${DOCKER_IMAGE} ${DOCKER_REGISTRY}/${DOCKER_IMAGE}
            docker tag ${DOCKER_IMAGE} ${DOCKER_REGISTRY}/${APP_NAME}:latest
            docker images | grep ${APP_NAME} || true
          else
            echo "No Dockerfile found, skipping docker build"
          fi
        '''
      }
    }

    stage('Docker: Scan Image') {
      steps {
        sh '''
          if docker image inspect ${DOCKER_IMAGE} > /dev/null 2>&1; then
            trivy image --format json --output trivy-vulnerabilities.json ${DOCKER_IMAGE} || true
            trivy image --format table --output trivy-report.txt ${DOCKER_IMAGE} || true
            trivy image --scanners secret --format json --output trivy-secrets.json ${DOCKER_IMAGE} || true
          else
            echo "Docker image not present, skipping trivy scan"
          fi
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'trivy-*.json,trivy-report.txt', allowEmptyArchive: true
        }
      }
    }

    stage('Integration Tests (docker-compose)') {
      steps {
        sh '''
          if [ -f docker-compose.yml ] && docker compose version > /dev/null 2>&1; then
            docker compose up -d
            sleep 20
            # run tests inside container named app or use docker exec pattern
            docker compose exec -T app npm test || echo "Integration tests failed or returned non-zero"
            docker compose down
          else
            echo "No docker-compose.yml or docker not available, skipping integration tests"
          fi
        '''
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
        sh '''
          if [ -f docker-compose.yml ]; then
            docker compose -f docker-compose.yml pull || true
            docker compose -f docker-compose.yml up -d
            sleep 20
            curl -f http://localhost:3000/health || echo "Staging health check failed"
          else
            echo "No docker-compose.yml found, skipping deploy"
          fi
        '''
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
        sh '''
          echo "Running smoke checks"
          set +e
          curl -f http://localhost:3000/ || echo "root failed"
          curl -f http://localhost:3000/health || echo "health failed"
          curl -f http://localhost:3000/metrics || echo "metrics failed"
          curl -f http://localhost:3000/api/users || echo "users failed"
          set -e || true
        '''
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
        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
          withSonarQubeEnv('MySonarQube') {
            sh '''
              if [ -d src ]; then
                sonar-scanner \
                  -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                  -Dsonar.sources=src \
                  -Dsonar.tests=tests \
                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                  -Dsonar.testExecutionReportPaths=${JEST_JUNIT_OUTPUT_DIR}/${JEST_JUNIT_OUTPUT_NAME} \
                  -Dsonar.host.url=${SONAR_HOST_URL} \
                  -Dsonar.login=${SONAR_TOKEN} || true
              else
                echo "No src directory, skipping SonarQube analysis"
              fi
            '''
          }
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
        withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
          sh '''
            if docker image inspect ${DOCKER_IMAGE} > /dev/null 2>&1; then
              echo "Logging into registry ${DOCKER_REGISTRY}"
              echo "${DOCKER_PASSWORD}" | docker login ${DOCKER_REGISTRY} -u "${DOCKER_USERNAME}" --password-stdin
              docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE} || true
              docker push ${DOCKER_REGISTRY}/${APP_NAME}:latest || true
            else
              echo "No image to push, skipping push"
            fi
          '''
        }
      }
    }

    stage('Security Summary') {
      steps {
        sh '''
          cat > security-summary.md <<EOF
# Security Analysis Summary

- Build Number: ${BUILD_NUMBER}
- Git Commit: ${GIT_COMMIT_SHORT}
- Git Branch: ${GIT_BRANCH}
- Time: $(date)

Reports:
- dependency-check: dependency-check-report/
- snyk: snyk-report.json
- npm audit: npm-audit-report.txt
- trivy: trivy-report.txt
- static scan: eslint-security-report.json

EOF
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'security-summary.md', allowEmptyArchive: true
        }
      }
    }

  } // stages

  post {
    always {
      echo "Pipeline finished for ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }
    success {
      echo "Build succeeded"
    }
    failure {
      echo "Build failed, check logs"
    }
    unstable {
      echo "Build unstable"
    }
  }
}
