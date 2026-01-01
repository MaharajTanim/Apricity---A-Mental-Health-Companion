# GitHub Actions CI/CD Pipeline Status

## Pipeline Status

![CI Pipeline](https://github.com/YOUR_USERNAME/apricity/actions/workflows/ci.yml/badge.svg)

## Quick Links

- [View Pipeline Runs](https://github.com/YOUR_USERNAME/apricity/actions/workflows/ci.yml)
- [View Latest Run](https://github.com/YOUR_USERNAME/apricity/actions/workflows/ci.yml?query=branch%3Omain)
- [Security Alerts](https://github.com/YOUR_USERNAME/apricity/security)

## Pipeline Jobs

| Job                  | Description              | Status        |
| -------------------- | ------------------------ | ------------- |
| Backend Lint & Test  | ESLint + Jest tests      | Required      |
| Frontend Lint & Test | ESLint + Build           | Required      |
| ML Service Test      | Flake8 + Pytest          | Required      |
| Docker Build         | Build all images         | Required      |
| Docker Compose Test  | Integration test         | Required      |
| Security Scan        | Trivy vulnerability scan | Informational |

## Coverage Reports

Coverage reports are uploaded as artifacts for each pipeline run:

- **Backend Coverage**: Jest HTML reports (7 days retention)
- **ML Service Coverage**: Pytest HTML reports (7 days retention)

To view coverage:

1. Go to [Actions](https://github.com/YOUR_USERNAME/apricity/actions)
2. Click on a workflow run
3. Download coverage artifacts from the bottom of the page

## Running Pipeline Checks Locally

Before pushing code, run these commands locally:

```bash
# Backend
cd backend
npm run lint
npm test

# Frontend
cd frontend
npm run lint
npm run build

# ML Service
cd ml_service
flake8 .
python -m pytest -v

# Docker
docker-compose build
docker-compose up -d
curl http://localhost:5000/health
curl http://localhost:8000/health
docker-compose down
```

## Pipeline Configuration

- **Trigger**: Push to `main`/`develop` or PRs targeting these branches
- **Node.js Version**: 18
- **Python Version**: 3.10
- **Docker**: BuildKit with layer caching enabled

## Troubleshooting

If the pipeline fails:

1. **Check the logs**: Click on the failed job to view detailed logs
2. **Run locally**: Use the commands above to reproduce the issue
3. **Check artifacts**: Download test coverage or error logs
4. **Review changes**: Ensure all files are committed and .gitignore is correct

## Contributing

Before submitting a PR:

1. ✅ All linters pass locally
2. ✅ All tests pass locally
3. ✅ Docker builds successfully
4. ✅ Code is formatted consistently
5. ✅ New tests added for new features
6. ✅ Documentation updated if needed

See [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for the PR checklist.
