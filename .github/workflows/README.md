# GitHub Actions CI/CD Pipeline

This document describes the continuous integration and deployment pipeline for Apricity.

## Pipeline Overview

The CI/CD pipeline runs automatically on:

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

## Pipeline Jobs

### 1. Backend Lint & Test

**Job:** `backend-lint-test`

- ✅ Installs Node.js 18
- ✅ Caches npm dependencies
- ✅ Runs ESLint on backend code
- ✅ Executes Jest test suite with coverage
- ✅ Uploads coverage reports as artifacts

**Requirements:**

- `npm run lint` must pass
- `npm test` must pass
- Coverage reports are retained for 7 days

### 2. Frontend Lint & Test

**Job:** `frontend-lint-test`

- ✅ Installs Node.js 18
- ✅ Caches npm dependencies
- ✅ Runs ESLint on frontend code
- ✅ Executes frontend tests (if configured)
- ✅ Builds production bundle

**Requirements:**

- `npm run lint` must pass
- `npm run build` must succeed

### 3. ML Service Test

**Job:** `ml-service-test`

- ✅ Installs Python 3.10
- ✅ Caches pip dependencies
- ✅ Runs Flake8 linter for Python code style
- ✅ Executes pytest with coverage
- ✅ Uploads coverage reports as artifacts

**Requirements:**

- Flake8 critical errors must not exist
- `python -m pytest` must pass
- Coverage reports are retained for 7 days

### 4. Docker Build

**Job:** `docker-build`

Runs after all lint/test jobs pass.

- ✅ Builds Docker images for all services (backend, frontend, ml_service)
- ✅ Uses BuildKit with layer caching
- ✅ Tags images with commit SHA
- ✅ Validates Dockerfile syntax and build process

**Strategy:** Matrix build for parallel image building

### 5. Docker Compose Integration Test

**Job:** `docker-compose-test`

Runs after Docker images are built.

- ✅ Creates environment configuration
- ✅ Builds all services via docker-compose
- ✅ Starts complete stack
- ✅ Validates service health endpoints
- ✅ Shows logs on failure
- ✅ Cleans up containers and volumes

**Health Checks:**

- Backend: `GET http://localhost:5000/health`
- ML Service: `GET http://localhost:8000/health`

### 6. Security Scan

**Job:** `security-scan`

- ✅ Runs Trivy vulnerability scanner
- ✅ Scans filesystem for dependencies
- ✅ Reports CRITICAL and HIGH severity issues
- ✅ Uploads results to GitHub Security tab

### 7. Pipeline Summary

**Job:** `pipeline-summary`

Runs after all other jobs complete.

- ✅ Generates summary report
- ✅ Shows commit, branch, and actor information
- ✅ Lists completed jobs

## Workflow Configuration

### Environment Variables

```yaml
NODE_VERSION: "18"
PYTHON_VERSION: "3.10"
```

### Job Dependencies

```
backend-lint-test ──┐
frontend-lint-test ─┼─→ docker-build ──→ docker-compose-test ──→ pipeline-summary
ml-service-test ────┘
```

### Caching Strategy

**Node.js:**

- Cache location: npm cache
- Cache key: `package-lock.json` hash
- Speeds up `npm ci` by ~70%

**Python:**

- Cache location: pip cache
- Cache key: `requirements.txt` hash
- Speeds up pip install by ~60%

**Docker:**

- Cache location: `/tmp/.buildx-cache`
- Cache key: Service name + commit SHA
- Speeds up Docker builds significantly

## Local Testing

### Run Linters Locally

```bash
# Backend
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues

# Frontend
cd frontend
npm run lint

# ML Service
cd ml_service
flake8 .
```

### Run Tests Locally

```bash
# Backend
cd backend
npm test

# ML Service
cd ml_service
python -m pytest -v
```

### Build Docker Images Locally

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend

# Test compose stack
docker-compose up -d
curl http://localhost:5000/health
curl http://localhost:8000/health
docker-compose down
```

## Artifacts

The pipeline generates the following artifacts:

1. **backend-coverage** (7 days)

   - Jest coverage reports
   - HTML and JSON formats

2. **ml-service-coverage** (7 days)

   - Pytest coverage reports
   - HTML coverage viewer

3. **trivy-results.sarif** (GitHub Security)
   - Vulnerability scan results
   - Integrated with GitHub Security tab

## Continuous Deployment

### Current State

- ✅ Continuous Integration (CI) is fully implemented
- ⚠️ Continuous Deployment (CD) is not yet configured

### Future CD Implementation

To add continuous deployment:

1. **Add Docker Registry Login**

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

2. **Push Docker Images**

```yaml
- name: Push Docker image
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: |
      username/apricity-${{ matrix.service }}:latest
      username/apricity-${{ matrix.service }}:${{ github.sha }}
```

3. **Deploy to Server**

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_KEY }}
    script: |
      cd /opt/apricity
      docker-compose pull
      docker-compose up -d
```

## Required Secrets

For full CI/CD, configure these secrets in GitHub:

### Current (CI Only)

- None required for current setup

### Future (CD)

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `DEPLOY_HOST` - Production server hostname
- `DEPLOY_USER` - SSH username for deployment
- `DEPLOY_KEY` - SSH private key for deployment

## Troubleshooting

### Pipeline Failing on Lint

**Backend ESLint errors:**

```bash
cd backend
npm run lint:fix  # Auto-fix
git add .
git commit -m "fix: eslint issues"
```

**ML Service Flake8 errors:**

```bash
cd ml_service
flake8 . --show-source
# Fix issues manually
```

### Pipeline Failing on Tests

**Check test logs:**

- Click on failed job in GitHub Actions
- Expand test step to see output
- Download coverage artifacts for details

**Run tests locally:**

```bash
# Backend
cd backend
npm test -- --verbose

# ML Service
cd ml_service
python -m pytest -v -s
```

### Pipeline Failing on Docker Build

**Check Dockerfile syntax:**

```bash
docker build -t test-image ./backend
```

**Check build context:**

- Ensure `.dockerignore` files exist
- Verify all required files are in context
- Check file permissions

### Docker Compose Integration Test Failing

**Services not healthy:**

```bash
# Check logs locally
docker-compose up
docker-compose logs backend
docker-compose logs ml_service
```

**Health endpoint not responding:**

- Increase wait time in workflow (currently 30s)
- Check service startup logs
- Verify health check endpoints work locally

## Best Practices

1. **Always run linters before committing:**

   ```bash
   npm run lint        # Backend/Frontend
   flake8 .           # ML Service
   ```

2. **Run tests locally before pushing:**

   ```bash
   npm test           # Backend/Frontend
   python -m pytest   # ML Service
   ```

3. **Test Docker builds locally:**

   ```bash
   docker-compose build
   docker-compose up -d
   # Test manually
   docker-compose down
   ```

4. **Keep dependencies updated:**

   - Regularly update `package.json` dependencies
   - Update `requirements.txt` for Python
   - Update base Docker images

5. **Monitor pipeline performance:**
   - Check pipeline duration trends
   - Optimize slow steps
   - Use caching effectively

## Pipeline Status Badge

Add to README.md:

```markdown
![CI Pipeline](https://github.com/username/apricity/actions/workflows/ci.yml/badge.svg)
```

## Support

For pipeline issues:

1. Check this documentation
2. Review GitHub Actions logs
3. Test locally first
4. Check [GitHub Actions documentation](https://docs.github.com/en/actions)
