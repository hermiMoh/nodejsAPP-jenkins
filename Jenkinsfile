pipeline {
    // Use a Node container and bind the host docker socket so we can run docker build/push.
    // If you prefer a different model (dedicated docker agents), change this.
    agent {
        docker {
            image 'node:18' 
            args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        DOCKER_IMAGE        = 'medhermi/calc-api'        // change to your repo
        REGISTRY_CREDENTIAL = 'docker-hub-repo'          // Jenkins credentials id
        // IMAGE_TAG will be calculated from package.json + build number + commit
        IMAGE_TAG           = ''                         // will be set in a script block
    }

    options {
        ansiColor('xterm')                     // readable colored logs (requires AnsiColor plugin)
        timestamps()                           // timestamps on every log line
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipDefaultCheckout()                  // we explicitly checkout in the Checkout stage
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // small scripted bits to capture commit short and package version
                script {
                    env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    // read version from package.json (fallback to 0.0.0 if absent)
                    env.PKG_VERSION = sh(script: "node -e \"console.log(require('./package.json').version||'0.0.0')\"", returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.PKG_VERSION}-${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    if (fileExists('package-lock.json')) {
                        echo "Found package-lock.json — using npm ci"
                        sh 'npm ci'
                    } else {
                        echo "No package-lock.json — using npm install"
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Lint') {
            steps {
                // fail the stage if lint exits non-zero
                sh 'npm run lint'
            }
            post {
                failure {
                    echo "Lint failed — check results."
                }
            }
        }

        stage('Unit & Coverage') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        // retry unit tests once for flakiness
                        retry(1) {
                            sh 'npm test'
                        }
                    }
                    post {
                        always {
                            junit 'test-results/**/*.xml'   // collect junit results
                        }
                    }
                }
                stage('Coverage') {
                    steps {
                        // assume you have a coverage script that emits coverage reports
                        sh 'npm run coverage || true'
                    }
                    post {
                        always {
                            // change path to your coverage report if needed
                            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
                        }
                    }
                }
            }
        }

        stage('Security Audit') {
            steps {
                // fail if high or critical vulnerabilities are present
                sh 'npm audit --audit-level=high'
            }
        }

        stage('Deprecated Package Check') {
            steps {
                // Fail build if deprecated packages are detected (npm-check must be available via npx)
                // npx will fetch locally if not available.
                sh 'npx npm-check --skip-unused --error-level 2'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building docker image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} ."
                }
            }
        }

        stage('Push Image to Registry') {
            when {
                branch 'main'   // only push on main branch (adjust as needed)
            }
            steps {
                withCredentials([usernamePassword(credentialsId: "${REGISTRY_CREDENTIAL}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        set -e
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                // require manual confirmation before deploying to staging
                input message: "Deploy ${DOCKER_IMAGE}:${IMAGE_TAG} to Staging?", ok: 'Deploy'
                // Replace with your real deploy commands (kubectl/helm/ssh/ansible/etc.)
                sh "echo 'Simulating deploy of ${DOCKER_IMAGE}:${IMAGE_TAG} to staging...'"
                sh 'sleep 5'
            }
        }
    }

    post {
        always {
            echo "Build #${env.BUILD_NUMBER} finished with ${currentBuild.currentResult}"
            // best-effort logout from registry and cleanup
            sh 'docker logout || true'
            cleanWs()
        }
        success {
            emailext (
                subject: "SUCCESS: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Build succeeded: ${env.BUILD_URL}",
                to: "your.email@example.com"
            )
        }
        failure {
            emailext (
                subject: "FAILURE: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Build failed: ${env.BUILD_URL}",
                to: "your.email@example.com"
            )
        }
    }
}
