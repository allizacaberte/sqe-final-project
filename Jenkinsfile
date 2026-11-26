pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Current branch: ${env.BRANCH_NAME}"
            }
        }

        stage('Install and Test') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
                sh 'npm test'
            }
        }

        stage('Coverage') {
            steps {
                sh 'npm run coverage'
                sh 'test -f coverage/lcov.info'
            }
        }

        stage('SonarQube Analysis and Quality Gate') {
            when {
                branch 'main'
            }

            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube-Final') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Build') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }

            steps {
                sh 'npm run build'
            }
        }

        stage('Archive Artifact') {
        when {
            branch 'main'
        }

        steps {
            sh '''
                rm -rf artifact
                mkdir -p artifact/.next/standalone
                mkdir -p artifact/.next/static

                tar --exclude=node_modules \
                    --exclude=.env \
                    --exclude='.env.*' \
                    -C .next/standalone -cf - . \
                    | tar -C artifact/.next/standalone -xf -

                cp -r .next/static/. artifact/.next/static/
                cp -r public artifact/
                cp package.json package-lock.json artifact/
                cp Dockerfile .dockerignore artifact/

                test -f artifact/.next/standalone/server.js

                tar -czf critics-frame-${BUILD_NUMBER}.tar.gz -C artifact .
            '''

            archiveArtifacts(
                artifacts: "critics-frame-${env.BUILD_NUMBER}.tar.gz",
                fingerprint: true
            )
        }
    }
    }

    post {
        success {
            echo 'CI pipeline completed successfully.'
        }

        failure {
            echo 'CI pipeline failed. Check the console output.'
        }

        always {
            echo "Pipeline finished for branch: ${env.BRANCH_NAME}"
        }
    }
}