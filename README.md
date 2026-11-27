# Critic's Frame

A movie retrospective and review web application developed as a final project for Software Quality Engineering at CIIT College of Arts and Technology.

Critic's Frame allows users to discover movies, explore movie information, submit ratings, and share reviews. The project implements automated testing, code quality analysis, Continuous Integration (CI), and Continuous Delivery (CD) to establish a reliable software development and deployment process.

## Application Features

- User registration and authentication
- Movie browsing and discovery
- Movie search and filtering
- Movie details and information through the TMDB API
- Movie ratings and reviews
- User session management
- Responsive user interface

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Prisma ORM, PostgreSQL, TMDB API |
| Testing | Vitest, React Testing Library |
| Code Quality | SonarQube, ESLint |
| Version Control | Git, GitHub |
| CI/CD | Jenkins |
| Containerization | Docker |

## Getting Started

### Prerequisites

- Node.js 24
- npm
- Git
- PostgreSQL database
- TMDB API credentials
- Docker and Jenkins for CI/CD deployment
- SonarQube for code quality analysis

### Installation

Clone the repository:

```bash
git clone https://github.com/allizacaberte/sqe-final-project.git
cd sqe-final-project
```

Install the project dependencies:

```bash
npm ci
```

### Environment Variables

Create a `.env` file using `.env.example` as a reference.

```env
DATABASE_URL=your_postgresql_connection_string
TMDB_READ_TOKEN=your_tmdb_read_access_token
```

Use valid database and TMDB credentials. Ensure that the PostgreSQL database schema is configured for the application.

Generate the Prisma client:

```bash
npx prisma generate
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

Actual credentials must not be committed to the repository.

## Git Branching Strategy

The project follows a structured branching strategy to support collaborative development, integration, testing, and release management.

| Branch | Purpose |
|---|---|
| main | Stable application version and release artifact generation |
| develop | Integration and testing of completed features |
| feature/vhiane | Frontend development and user interface |
| feature/keith | Backend development and application functionality |
| feature/alliza | Automated testing and code coverage |
| feature/cd-pipeline | CD pipeline and Docker deployment |
| feature/failure-demo | Intentional test failure and recovery demonstration |

Feature changes are integrated into develop through pull requests before being merged into main.

The failure demonstration branch is kept separate from the stable application.

## Automated Testing

The project uses Vitest and React Testing Library to validate application functionality.

The automated tests cover:

- Authentication and session management
- Movie rating calculations
- Review management
- Movie search and API interactions
- Input validation and boundary conditions
- User interface components

### Run Automated Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Code Coverage

```bash
npm run coverage
```

The generated LCOV report is located at:

```text
coverage/lcov.info
```

### Automated Testing Results

The validated main branch build achieved the following results:

| Metric | Result |
|---|---:|
| Total Tests Passed | 395/395 |
| Test Files Passed | 13/13 |
| Test Pass Rate | 100% |
| Statement Coverage | 82.06% |
| Branch Coverage | 80.56% |
| Function Coverage | 82.52% |
| Line Coverage | 82.04% |

## Continuous Integration (CI)

The CI pipeline is defined in `Jenkinsfile` and executed through the Jenkins Multibranch Pipeline named `Critics-Frame-CI`.

Jenkins uses periodic repository scanning every five minutes to discover branches and detect changes.

### Branch-Specific Pipeline Execution

| Stage | Feature Branches | Develop | Main |
|---|---|---|---|
| Checkout | Yes | Yes | Yes |
| Install and Test | Yes | Yes | Yes |
| Coverage | Yes | Yes | Yes |
| SonarQube Analysis and Quality Gate | No | No | Yes |
| Build | No | Yes | Yes |
| Archive Artifact | No | No | Yes |

### CI Pipeline Stages

1. **Checkout** - Retrieves the source code from GitHub.
2. **Install and Test** - Installs dependencies, generates the Prisma client, and executes automated tests.
3. **Coverage** - Generates code coverage and the LCOV report.
4. **SonarQube Analysis and Quality Gate** - Performs static code analysis and validates the configured Quality Gate.
5. **Build** - Compiles the application into a production-ready build.
6. **Archive Artifact** - Packages and stores the validated application as a versioned artifact.

Failed automated tests prevent subsequent stages from executing. A failed Quality Gate also prevents the main branch from proceeding to Build and Archive Artifact.

## SonarQube Analysis and Quality Gate

SonarQube is integrated into the main branch CI pipeline through `sonar-project.properties`.

The custom Quality Gate, named `Critics Frame Quality Gate`, requires at least 80% overall code coverage.

Quality Gate validation is enforced using:

```properties
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

### SonarQube Results

| Metric | Result |
|---|---|
| Minimum Required Coverage | 80.0% |
| Overall Coverage | 80.6% |
| Code Duplication | 0.0% |
| Reported Security Issues | 0 |
| Reported Reliability Issues | 0 |
| Reported Maintainability Issues | 0 |
| Quality Gate Status | Passed |

Although the Quality Gate passed, additional automated testing is recommended for uncovered application pages.

## Versioned Build Artifacts

After successfully passing automated tests and Quality Gate validation, the main branch CI pipeline generates and archives a versioned build artifact.

Artifact naming convention:

```text
critics-frame-<BUILD_NUMBER>.tar.gz
```

The artifact contains:

- Compiled Next.js standalone application
- Static and public assets
- Dependency manifests
- Dockerfile
- Docker ignore configuration

Environment files and node_modules are excluded from the archived artifact.

Jenkins fingerprints the artifact for traceability.

The CI artifact selected for the project demonstration was:

```text
critics-frame-3.tar.gz
```

This artifact was generated by Main CI Build #3.

## Continuous Delivery (CD)

The CD pipeline is defined in `Jenkinsfile.cd` and executed through a separate Jenkins Pipeline named `Critics-Frame-CD`.

The pipeline retrieves a previously validated CI artifact and deploys it using Docker without recompiling the original application source code.

### Deployment Parameters

| Parameter | Description |
|---|---|
| CI_BUILD_NUMBER | Identifies the main branch CI artifact to deploy |
| ENVIRONMENT | Selects the target deployment environment |

### Deployment Environments

| Environment | Container Name | Host Port |
|---|---|---:|
| DEV | critics-frame-dev | 8101 |
| TEST | critics-frame-test | 8102 |
| ACC | critics-frame-acc | 8103 |
| PROD | critics-frame-prod | 8104 |

These environments are configured as separate local Docker deployment targets.

### CD Pipeline Stages

1. **Validate Parameters** - Validates the selected CI build number and environment.
2. **Retrieve Artifact** - Retrieves the selected artifact from the main CI pipeline.
3. **Extract Artifact** - Extracts the archived production application.
4. **Build Docker Image** - Packages the pre-built application and production dependencies.
5. **Deploy Container** - Deploys the Docker container to the selected environment.
6. **Verify Deployment** - Checks container status and verifies application accessibility through an HTTP request.

### Demonstrated Deployment

The project successfully deployed Main CI Build #3 through CD Build #2 using the following parameters:

| Parameter | Value |
|---|---|
| CI_BUILD_NUMBER | 3 |
| ENVIRONMENT | DEV |
| Docker Image | critics-frame:3 |
| Docker Container | critics-frame-dev |
| Application URL | http://localhost:8101 |
| Deployment Status | Successful |

Database and TMDB credentials are supplied through Jenkins credentials during deployment.

## Jenkins and SonarQube Services

The following local services were used during the project demonstration:

| Service | URL |
|---|---|
| Jenkins | http://localhost:8085 |
| SonarQube | http://localhost:9005 |
| Deployed DEV Application | http://localhost:8101 |

These addresses refer to the local project environment and require the corresponding services to be running.

## Failure and Recovery Demonstration

An intentional test failure was introduced in the isolated `feature/failure-demo` branch to demonstrate CI failure handling.

The test file is located at:

```text
src/test/failure-demo.test.ts
```

### Intentional Failure

The test calculates the average of three movie ratings: 8, 9, and 10.

The expected result was intentionally set incorrectly:

```typescript
expect(average).toBe(10);
```

Jenkins Build #1 failed during the Install and Test stage, preventing Coverage and subsequent stages from executing.

### Recovery

The incorrect assertion was corrected to:

```typescript
expect(average).toBe(9);
```

After committing and pushing the correction, Jenkins executed Build #2 successfully.

| Build | Result |
|---|---|
| Build #1 | Failed - Intentional assertion mismatch |
| Build #2 | Successful - Corrected assertion |

This demonstrates the CI pipeline's ability to detect failed tests and prevent unsuccessful changes from progressing.

## Dependency Security Audit

The project uses npm audit to identify known dependency vulnerabilities.

Run the security audit using:

```bash
npm audit
```

During development, high-severity vulnerabilities associated with the Effect dependency used by Prisma were identified.

A dependency override was applied to update Effect from version 3.20.0 to the patched version 3.22.1.

The final security audit reported:

```text
found 0 vulnerabilities
```

This result represents the known dependency vulnerabilities reported at the time of the audit.

## Repository Configuration Files

| File | Description |
|---|---|
| Jenkinsfile | Multibranch CI pipeline |
| Jenkinsfile.cd | Parameterized CD pipeline |
| Dockerfile | Production container configuration |
| sonar-project.properties | SonarQube and Quality Gate configuration |
| vitest.config.mjs | Automated testing and coverage configuration |
| package.json | Project dependencies and scripts |
| package-lock.json | Dependency version lock file |
| .env.example | Environment variable template |
| .gitignore | Git exclusion configuration |
| .dockerignore | Docker build context exclusion configuration |
| README.md | Project documentation |

## Contributors

| Name | Responsibilities |
|---|---|
| Alliza Caberte | Automated Testing, Code Coverage, Jenkins, SonarQube, CI/CD, and Docker Deployment |
| Vhiane Gulapa | Frontend Development and User Interface |
| Keith Perdido | Backend Development, Database Integration, and Application Functionality |

## Academic Information

- **Institution:** CIIT College of Arts and Technology
- **Program:** Bachelor of Science in Computer Science
- **Course:** Software Quality Engineering
- **Instructor:** Mr. Jonathan Fuller
- **Academic Year:** 2026-2027

## Conclusion

Critic's Frame demonstrates the application of software quality engineering practices through structured version control, automated testing, code quality validation, versioned artifact management, and automated container deployment.

The project successfully achieved its configured Quality Gate, passed 395 automated tests, demonstrated CI failure recovery, and deployed a validated application artifact to the DEV environment.