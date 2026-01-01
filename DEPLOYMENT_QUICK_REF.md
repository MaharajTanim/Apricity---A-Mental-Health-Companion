# 🚀 Apricity Deployment Quick Reference

## ⚠️ CRITICAL: Before Production Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│  🔒 SECURITY REQUIREMENTS (NON-NEGOTIABLE)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. ✅ Use MongoDB Atlas (managed database)                     │
│     ❌ DO NOT use self-hosted MongoDB without hardening         │
│                                                                 │
│  2. ✅ Store JWT_SECRET in secrets manager                      │
│     • AWS Secrets Manager                                       │
│     • GCP Secret Manager                                        │
│     • HashiCorp Vault                                           │
│     ❌ DO NOT use .env files in production                      │
│                                                                 │
│  3. ✅ Store MongoDB URI in secrets manager                     │
│     ❌ DO NOT commit connection strings to git                  │
│                                                                 │
│  4. ✅ Enable HTTPS/TLS (port 443 only)                         │
│     • Use managed certificates (ACM, Let's Encrypt)             │
│     • Redirect HTTP to HTTPS                                    │
│     ❌ DO NOT use HTTP in production                            │
│                                                                 │
│  5. ✅ Scale ML service separately                              │
│     • ML is CPU/GPU intensive                                   │
│     • Backend uses lightweight instances                        │
│     • Different auto-scaling rules                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Deployment Options Comparison

| Platform            | Best For       | Cost/Month | Complexity    | Deploy Time |
| ------------------- | -------------- | ---------- | ------------- | ----------- |
| **Railway**         | Fastest Deploy | $10-30     | ⭐ Easy       | 5 minutes   |
| **GCP Cloud Run**   | Simplicity     | $90-210    | ⭐⭐ Easy     | 15 minutes  |
| **AWS ECS/Fargate** | Enterprise     | $140-520   | ⭐⭐⭐ Medium | 30 minutes  |
| **VPS + Docker**    | Budget         | $24-84     | ⭐⭐⭐⭐ Hard | 60 minutes  |

## 🚀 Quick Deploy Commands

### Railway (Fastest)

```bash
# 1. Connect GitHub repo at https://railway.app
# 2. Railway auto-deploys from Dockerfile
# 3. Add MongoDB with one click
# 4. Set environment variables:
railway variables set JWT_SECRET="your-secret-here"
railway variables set NODE_ENV="production"
```

### GCP Cloud Run

```bash
# 1. Build containers
gcloud builds submit --tag gcr.io/PROJECT_ID/apricity-backend ./backend
gcloud builds submit --tag gcr.io/PROJECT_ID/apricity-ml-service ./ml_service

# 2. Deploy backend
gcloud run deploy apricity-backend \
  --image gcr.io/PROJECT_ID/apricity-backend \
  --set-secrets JWT_SECRET=apricity-jwt-secret:latest,MONGO_URI=apricity-mongodb-uri:latest \
  --memory 1Gi --max-instances 10

# 3. Deploy ML service (separate scaling)
gcloud run deploy apricity-ml-service \
  --image gcr.io/PROJECT_ID/apricity-ml-service \
  --memory 2Gi --cpu 2 --max-instances 5 --timeout 300s
```

### AWS ECS/Fargate

```bash
# 1. Create ECR repos
aws ecr create-repository --repository-name apricity-backend
aws ecr create-repository --repository-name apricity-ml-service

# 2. Push images
docker tag apricity-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/apricity-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/apricity-backend:latest

# 3. Create ECS services with task definitions
# (See DEPLOYMENT.md for complete ECS setup)
```

## 🔐 Secrets Setup

### AWS Secrets Manager

```bash
# Store JWT secret
aws secretsmanager create-secret \
  --name apricity/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"

# Store MongoDB Atlas URI
aws secretsmanager create-secret \
  --name apricity/mongodb-uri \
  --secret-string "mongodb+srv://user:pass@cluster.mongodb.net/apricity"

# Store ML model path
aws secretsmanager create-secret \
  --name apricity/ml-model-path \
  --secret-string "s3://apricity-ml-models/production/"
```

### GCP Secret Manager

```bash
# Store secrets
echo -n "$(openssl rand -base64 32)" | gcloud secrets create apricity-jwt-secret --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create apricity-mongodb-uri --data-file=-
echo -n "gs://bucket/models/" | gcloud secrets create apricity-ml-model-path --data-file=-
```

## 🗄️ MongoDB Atlas Setup

```bash
# 1. Create account: https://www.mongodb.com/cloud/atlas
# 2. Create cluster (M0 Free or M10+ for production)
# 3. Configure network access (IP whitelist or VPC peering)
# 4. Create database user:
#    Username: apricity_app
#    Password: <generate strong password>
#    Role: readWrite on apricity database
# 5. Get connection string:
#    mongodb+srv://apricity_app:<password>@cluster.mongodb.net/apricity?retryWrites=true&w=majority
# 6. Store in secrets manager (never in code!)
```

## 🔒 HTTPS/TLS Setup

### Option 1: Cloud Provider Load Balancer (Easiest)

```bash
# AWS ALB with ACM certificate (free, auto-renewing)
aws acm request-certificate --domain-name api.yourdomain.com --validation-method DNS

# GCP Cloud Run (automatic SSL, just add custom domain)
gcloud run domain-mappings create --service apricity-backend --domain api.yourdomain.com
```

### Option 2: Let's Encrypt (Free)

```bash
# On VPS with Nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
# Auto-renewal via cron (certbot installs this automatically)
```

### Option 3: Cloudflare (Free SSL Proxy)

```
1. Add domain to Cloudflare
2. Set SSL/TLS mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Point DNS to your servers
```

## 📦 ML Model Storage

### Upload Models to S3

```bash
# Upload models
aws s3 sync ./ml_service/models/ s3://apricity-ml-models/production/

# Set environment variable
export MODEL_PATH=s3://apricity-ml-models/production/
```

### Upload Models to GCS

```bash
# Upload models
gsutil -m cp -r ./ml_service/models/* gs://apricity-ml-models/production/

# Set environment variable
export MODEL_PATH=gs://apricity-ml-models/production/
```

## ⚖️ Scaling Configuration

### Backend (Stateless, lightweight)

```yaml
resources:
  cpu: 512 # 0.5 vCPU
  memory: 1024 # 1 GB
scaling:
  min: 2
  max: 10
  target_cpu: 70%
```

### ML Service (Compute-intensive, separate)

```yaml
resources:
  cpu: 2048 # 2 vCPU (or GPU)
  memory: 4096 # 4 GB
scaling:
  min: 1
  max: 5
  target_cpu: 80%
  timeout: 300s # Longer timeout for inference
```

## 📊 Essential Monitoring

### Required Metrics

- ✅ Request rate (requests/second)
- ✅ Error rate (% of 5xx errors)
- ✅ Response time (p95, p99)
- ✅ CPU/Memory usage
- ✅ ML inference latency

### Quick Setup

```bash
# AWS CloudWatch (automatic with ECS)
# GCP Cloud Monitoring (automatic with Cloud Run)
# Railway (built-in monitoring)

# Or use DataDog/New Relic for multi-cloud
```

## ✅ Pre-Deployment Checklist

```
Infrastructure:
[ ] MongoDB Atlas cluster created and configured
[ ] Secrets stored in secrets manager (JWT_SECRET, MONGO_URI)
[ ] HTTPS/TLS certificates obtained and configured
[ ] DNS records configured (A/CNAME to load balancer)
[ ] Firewall rules configured (allow 443, deny all else)

Application:
[ ] All environment variables configured
[ ] CORS configured for production domain (not *)
[ ] Rate limiting enabled
[ ] Health checks responding (/health)
[ ] ML models uploaded to S3/GCS

Testing:
[ ] Integration test passing (./test-stack.sh)
[ ] Manual testing in staging environment
[ ] Load testing completed (2x expected traffic)
[ ] Security scan completed (no critical vulnerabilities)

Monitoring:
[ ] Application monitoring enabled
[ ] Logging configured (centralized logs)
[ ] Alerts configured (downtime, errors, high CPU)
[ ] Dashboards created

Backup & Recovery:
[ ] MongoDB automated backups enabled (Atlas default)
[ ] Backup restoration tested
[ ] Disaster recovery plan documented
```

## 🆘 Quick Troubleshooting

```bash
# Check service health
curl https://api.yourdomain.com/health
curl https://ml.yourdomain.com/health

# View logs (AWS)
aws logs tail /ecs/apricity-backend --follow

# View logs (GCP)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=apricity-backend" --limit 50

# Check secrets
aws secretsmanager get-secret-value --secret-id apricity/jwt-secret
gcloud secrets versions access latest --secret=apricity-jwt-secret

# Test MongoDB connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/apricity"

# Check SSL certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com
```

## 📚 Documentation Links

- **Complete Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Integration Test:** [TEST_STACK_README.md](TEST_STACK_README.md)
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **AWS ECS:** https://docs.aws.amazon.com/ecs/
- **GCP Cloud Run:** https://cloud.google.com/run/docs
- **Railway:** https://docs.railway.app/

## 💡 Pro Tips

1. **Start with Railway or Cloud Run** for MVP (fastest, easiest)
2. **Always test backup restoration** before going live
3. **Enable monitoring on day 1** (not after issues)
4. **Use managed services** (Atlas, Cloud Run) to reduce ops burden
5. **Scale ML separately** (different instance types, scaling rules)
6. **Never commit secrets** to git (use secrets manager)
7. **Enable HTTPS everywhere** (no exceptions)
8. **Set up alerts early** (downtime, errors, high CPU)

---

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed step-by-step guides.
