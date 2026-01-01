# Production Deployment Checklist

Use this checklist before deploying Apricity to production.

## 🔒 Security (CRITICAL)

### Database

- [ ] ✅ Using MongoDB Atlas (managed service) - **REQUIRED**
- [ ] ✅ MongoDB connection string stored in secrets manager - **REQUIRED**
- [ ] ⚠️ Not using self-hosted MongoDB (unless properly hardened)
- [ ] Enabled MongoDB encryption at rest
- [ ] Enabled MongoDB encryption in transit (TLS)
- [ ] Configured MongoDB network access (IP whitelist or VPC peering)
- [ ] Created separate DB user for application (not admin)
- [ ] Enabled automated backups (MongoDB Atlas default)
- [ ] Tested backup restoration procedure

### Secrets Management

- [ ] ✅ JWT_SECRET stored in secrets manager (AWS/GCP/Vault) - **REQUIRED**
- [ ] ✅ MongoDB URI stored in secrets manager - **REQUIRED**
- [ ] ✅ ML model paths stored in secrets manager - **REQUIRED**
- [ ] Removed all secrets from .env files
- [ ] Removed all secrets from code
- [ ] Never committed secrets to git
- [ ] Rotated all default secrets/passwords
- [ ] Setup secrets rotation policy (e.g., every 90 days)
- [ ] Limited secret access to specific IAM roles

**Secrets Manager Options:**

- AWS Secrets Manager: `aws secretsmanager create-secret --name apricity/jwt-secret`
- GCP Secret Manager: `gcloud secrets create apricity-jwt-secret`
- HashiCorp Vault: `vault kv put secret/apricity/jwt-secret`

### HTTPS/TLS

- [ ] ✅ All traffic over HTTPS (port 443) - **REQUIRED**
- [ ] ✅ HTTP redirects to HTTPS - **REQUIRED**
- [ ] Obtained SSL/TLS certificate (ACM, Let's Encrypt, or managed)
- [ ] Certificate auto-renewal configured
- [ ] TLS 1.2+ only (disabled TLS 1.0/1.1)
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled (`Strict-Transport-Security`)
- [ ] Tested SSL configuration (SSLLabs.com)

**SSL/TLS Options:**

- AWS ALB: Uses ACM certificates automatically
- GCP Cloud Run: Managed certificates included
- Let's Encrypt: Free, auto-renewing certificates
- Cloudflare: Free SSL proxy

### Application Security

- [ ] CORS configured for specific origins only (not `*`)
- [ ] Rate limiting enabled (prevent brute force)
- [ ] Helmet.js security headers enabled (already in code)
- [ ] Input validation on all endpoints (already in code)
- [ ] SQL/NoSQL injection prevention (using mongoose, already safe)
- [ ] XSS protection enabled
- [ ] CSRF protection for state-changing operations
- [ ] File upload restrictions (if applicable)
- [ ] API authentication required (JWT already implemented)

## ⚙️ Infrastructure

### Deployment Platform

- [ ] Selected deployment platform:
  - [ ] AWS ECS/Fargate (enterprise, $140-520/mo)
  - [ ] GCP Cloud Run (simple, $90-210/mo)
  - [ ] Railway (fastest, $10-30/mo)
  - [ ] Docker Compose on VPS (budget, $24-84/mo)

### Service Configuration

- [ ] Backend service deployed and running
- [ ] ML service deployed and running
- [ ] Frontend service deployed and running
- [ ] Services can communicate with each other
- [ ] Health check endpoints responding (`/health`)
- [ ] Environment variables configured correctly

### Scaling

- [ ] ✅ ML service scaled SEPARATELY from backend - **RECOMMENDED**
  - ML service is CPU/GPU intensive
  - Backend can use lightweight instances
  - Different auto-scaling rules
- [ ] Auto-scaling configured for backend (min 2, max 10 instances)
- [ ] Auto-scaling configured for ML service (min 1, max 5 instances)
- [ ] Load balancer configured (if not using managed platform)
- [ ] Session persistence configured (if needed)

### DNS & Domains

- [ ] Domain purchased and configured
- [ ] DNS A/CNAME records pointing to load balancer
- [ ] Custom domain working (`api.yourdomain.com`)
- [ ] SSL certificate valid for custom domain
- [ ] CDN configured for frontend (optional, CloudFront/Cloudflare)

## 📊 Monitoring & Logging

### Monitoring

- [ ] Application monitoring enabled:
  - [ ] AWS CloudWatch (if using AWS)
  - [ ] GCP Cloud Monitoring (if using GCP)
  - [ ] DataDog / New Relic / Prometheus (multi-cloud)
- [ ] Key metrics tracked:
  - [ ] Request rate (requests/second)
  - [ ] Error rate (4xx, 5xx)
  - [ ] Response time (p50, p95, p99)
  - [ ] CPU utilization
  - [ ] Memory usage
  - [ ] ML inference latency
- [ ] Custom dashboard created
- [ ] Health check monitoring enabled

### Logging

- [ ] Centralized logging configured:
  - [ ] AWS CloudWatch Logs
  - [ ] GCP Cloud Logging
  - [ ] ELK Stack / Splunk / Datadog
- [ ] Log levels configured (INFO in production, DEBUG for troubleshooting)
- [ ] Log retention policy set (30-90 days)
- [ ] Sensitive data NOT logged (passwords, tokens, PII)
- [ ] Log aggregation working across all services

### Alerting

- [ ] Alerts configured for:
  - [ ] Service downtime (>5 minutes)
  - [ ] High error rate (>5% 5xx errors)
  - [ ] High CPU usage (>80% for 5 minutes)
  - [ ] High memory usage (>85%)
  - [ ] ML service failures
  - [ ] Database connection issues
- [ ] Alert notifications configured (email, Slack, PagerDuty)
- [ ] On-call rotation setup (if applicable)

## 🧪 Testing

### Pre-Deployment Testing

- [ ] All unit tests passing (backend + ML service)
- [ ] Integration test passing (`./test-stack.sh`)
- [ ] Load testing completed (expected traffic + 2x)
- [ ] Security scanning completed (no critical vulnerabilities)
- [ ] Manual testing in staging environment
- [ ] Database migrations tested
- [ ] Rollback procedure tested

### Performance

- [ ] Backend response time < 500ms (p95)
- [ ] ML inference time < 5s (p95)
- [ ] Frontend load time < 3s
- [ ] Database query optimization completed
- [ ] CDN configured for static assets (optional)

## 💾 Backup & Recovery

### Backups

- [ ] ✅ MongoDB automated backups enabled (MongoDB Atlas default)
- [ ] Backup frequency: Daily (minimum)
- [ ] Backup retention: 30 days (minimum)
- [ ] Backups encrypted
- [ ] Backups in different region/zone
- [ ] Tested backup restoration (critical!)

### Disaster Recovery

- [ ] Recovery Time Objective (RTO) defined: **\_** hours
- [ ] Recovery Point Objective (RPO) defined: **\_** hours
- [ ] Disaster recovery plan documented
- [ ] Runbook for common incidents created
- [ ] Database restore procedure tested
- [ ] Failover procedure documented
- [ ] Multi-region deployment (optional, for high availability)

## 🚀 CI/CD Pipeline

### Continuous Integration

- [ ] GitHub Actions workflow configured (already done)
- [ ] Automated linting on PR (ESLint, Flake8)
- [ ] Automated tests on PR (Jest, Pytest)
- [ ] Security scanning on PR (Snyk, Trivy)
- [ ] Code coverage reporting
- [ ] Build passing before merge

### Continuous Deployment

- [ ] Automated deployment to staging on merge
- [ ] Manual approval for production deployment
- [ ] Zero-downtime deployment strategy (blue-green or rolling)
- [ ] Automated smoke tests after deployment
- [ ] Rollback procedure documented
- [ ] Deployment notifications (Slack, email)

## 📋 Documentation

### Technical Documentation

- [ ] Architecture diagram updated
- [ ] API documentation current (Swagger/OpenAPI)
- [ ] Database schema documented
- [ ] Deployment guide reviewed ([DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Runbooks created for common tasks
- [ ] Troubleshooting guide created

### Operational Documentation

- [ ] Incident response plan
- [ ] Escalation procedures
- [ ] Contact list (on-call engineers)
- [ ] Service dependencies documented
- [ ] Third-party service credentials secured

## 🔍 Final Checks

### Pre-Launch Verification

- [ ] All services healthy in production
- [ ] Can create new user account
- [ ] Can login with created account
- [ ] Can create diary entry
- [ ] ML emotion analysis working
- [ ] Response times acceptable
- [ ] No errors in logs
- [ ] SSL certificate valid
- [ ] Domain resolving correctly
- [ ] All environment variables correct

### Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor resource usage
- [ ] Check user feedback
- [ ] Verify backups running
- [ ] Verify logs being collected
- [ ] No security alerts

## 🎯 Platform-Specific Checklists

### AWS ECS/Fargate

- [ ] ECR repositories created
- [ ] ECS cluster created
- [ ] Task definitions configured with secrets from Secrets Manager
- [ ] ECS services created with auto-scaling
- [ ] Application Load Balancer configured
- [ ] ACM certificate attached to ALB
- [ ] Security groups configured (backend, ML service)
- [ ] VPC and subnets configured
- [ ] IAM roles configured (task execution role, task role)
- [ ] CloudWatch Logs configured

### GCP Cloud Run

- [ ] Container images pushed to GCR
- [ ] Cloud Run services deployed
- [ ] Secrets configured in Secret Manager
- [ ] Custom domains mapped
- [ ] IAM permissions configured
- [ ] Cloud Monitoring enabled
- [ ] Cloud Logging enabled
- [ ] VPC connector configured (if needed)

### Railway

- [ ] GitHub repository connected
- [ ] Services deployed (backend, ML, frontend)
- [ ] MongoDB provisioned
- [ ] Environment variables configured
- [ ] Custom domain added
- [ ] Monitoring enabled

### Docker Compose on VPS

- [ ] VPS provisioned (DigitalOcean, Linode, Vultr)
- [ ] Docker and Docker Compose installed
- [ ] Nginx reverse proxy configured
- [ ] Let's Encrypt certificates installed
- [ ] Firewall configured (ufw or iptables)
- [ ] SSL renewal cron job configured
- [ ] System monitoring installed (optional: netdata, htop)
- [ ] Automatic security updates enabled

## 📝 Sign-Off

### Team Approval

- [ ] Backend engineer reviewed and approved
- [ ] ML engineer reviewed and approved
- [ ] Security team reviewed and approved
- [ ] DevOps/SRE reviewed and approved
- [ ] Product owner approved for launch

### Final Approval

- [ ] All critical items (✅) completed
- [ ] All security requirements met
- [ ] All tests passing
- [ ] Monitoring and alerting configured
- [ ] Backups and recovery tested

**Deployment Date:** **\*\***\_\_\_**\*\***  
**Deployed By:** **\*\***\_\_\_**\*\***  
**Approved By:** **\*\***\_\_\_**\*\***

---

## ⚠️ CRITICAL ITEMS (Must Complete)

These items are **non-negotiable** for production:

1. ✅ **Use MongoDB Atlas** (managed, secure, backed up)
2. ✅ **Store JWT_SECRET in secrets manager** (AWS/GCP/Vault)
3. ✅ **Store MongoDB URI in secrets manager** (never in code)
4. ✅ **Enable HTTPS/TLS** (443 only, managed certificates)
5. ✅ **Scale ML service separately** (different compute needs)
6. ✅ **Test backup restoration** (verify you can recover data)

Skipping any of these items creates **critical security vulnerabilities** or **data loss risks**.

---

**See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on each item.**
