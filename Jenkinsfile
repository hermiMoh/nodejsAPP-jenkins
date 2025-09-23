pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'medhermi/calc-api'
        BUILD_TAGE = '$env.BUILD_ID'
    }

    options {
        timestamps()
        ansiColor('xterm')
    }

    stages {
        stage('checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies'){
            steps {
                 sh 'npm ci'
            }
        }
        stage('Lint') {
            steps{
                sh 'npm run lint'
            }
        }
        stage('Unit Test'){
            steps{
                sh 'npm test'
                junit 'test-results/**/*.xml'
            }
        }
        stage('Security Scan'){
            steps {
                sh 'npm audit || echo "Audit failed or vulnerabilities found. "'

            }
        }
        stage('Build Docker Image'){
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_TAG} ."
            }
        }
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-repo', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${DOCKER_IMAGE}:${BUILD_TAG}
                    """
                }
            }
        }

        stage('Deliver to Staging') {
            steps {
                echo "Simulating deployment of ${DOCKER_IMAGE}:${BUILD_TAG} to staging..."
                sleep 15
            }
        }
    }
    post {
         always {
            echo "Build #${env.BUILD_ID} - ${currentBuild.currentResult}"
            cleanWs()
        }
        success {
            emailext (
                subject: "SUCCESS: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Build succeeded. View details at ${env.BUILD_URL}",
                to: "your.email@example.com"
            )
        }
        failure {
            emailext (
                subject: "FAILURE: ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                body: "Build failed. View details at ${env.BUILD_URL}",
                to: "your.email@example.com"
            )
        }
    }
}