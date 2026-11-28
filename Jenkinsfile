pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder'
        TMDB_READ_TOKEN = 'placeholder'
    }

    options {
        skipDefaultCheckout(true)
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
                echo "Current branch: ${env.BRANCH_NAME}"
            }
        }

        stage('Install and Test') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
                sh 'npx prisma generate'
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
                anyOf {
                    branch 'main'
                    branch 'feature/sonar-failure-demo'
                }
            }

            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    if (env.BRANCH_NAME == 'feature/sonar-failure-demo') {
                        withSonarQubeEnv(
                            installationName: 'SonarQube-Final',
                            credentialsId: 'sqe-sonar-failure-demo-token'
                        ) {
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    } else {
                        withSonarQubeEnv('SonarQube-Final') {
                            sh "${scannerHome}/bin/sonar-scanner"
                        }
                    }
                }
            }
        }

        stage('Build') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                    branch 'feature/sonar-failure-demo'
                }
            }

            steps {
                sh 'npm run build'
            }
        }

        stage('Archive Artifact') {
            when {
                anyOf {
                    branch 'main'
                    branch 'feature/sonar-failure-demo'
                }
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

                    # Verify that no environment files are included
                    if find artifact -name '.env*' | grep -q .; then
                        echo "ERROR: Environment file detected in artifact."
                        exit 1
                    fi

                    # Verify that no node_modules directories are included
                    if find artifact -name 'node_modules' | grep -q .; then
                        echo "ERROR: node_modules detected in artifact."
                        exit 1
                    fi

                    echo "Artifact security verification passed."

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