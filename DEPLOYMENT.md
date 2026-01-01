# Apricity Deployment Guide

## 🚀 Production Deployment Overview

This guide covers deploying the Apricity Mental Health Companion to production environments with best practices for security, scalability, and reliability.

## 🏗️ Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Load Balancer │
                                    │   (HTTPS/TLS)   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐
            │   Frontend     │      │    Backend     │      │   ML Service   │
            │   (React)      │      │   (Express)    │      │   (Python)     │
            │   Port 3000    │      │   Port 5000    │      │   Port 8000    │
            └────────────────┘      └───────┬────────┘      └───────┬────────┘
                                            │                        │
                                            │                        │
                                    ┌───────▼────────┐      ┌───────▼────────┐
                                    │   MongoDB      │      │   ML Models    │
                                    │   Atlas        │      │   S3/GCS       │
                                    │   (Managed)    │      │   Storage      │
                                    └────────────────┘      └────────────────┘
```

## 🔒 Security Best Practices

### 1. Database - Use Managed MongoDB Atlas

**⚠️ DO NOT use self-hosted MongoDB in production without proper security hardening.**

**Recommended: MongoDB Atlas (Managed Service)**

**Benefits:**

- ✅ Automated backups and point-in-time recovery
- ✅ Built-in security (encryption at rest/in transit)
- ✅ Auto-scaling and high availability
- ✅ Global distribution options
- ✅ Monitoring and alerting
- ✅ No infrastructure management

**Setup Steps:**

1. **Create MongoDB Atlas Account**

   ```
   https://www.mongodb.com/cloud/atlas
   ```

2. **Create Cluster**

   - Choose tier (M0 Free, M10+ for production)
   - Select region closest to your app servers
   - Enable automatic backups

3. **Configure Network Access**

   ```
   IP Whitelist: Add your application server IPs
   OR
   Use VPC Peering for AWS/GCP/Azure
   ```

4. **Create Database User**

   ```
   Username: apricity_app
   Password: <generate strong password>
   Role: readWrite on apricity database
   ```

5. **Get Connection String**

   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/apricity?retryWrites=true&w=majority
   ```

6. **Store in Secrets Manager** (see below)

### 2. Secrets Management

**⚠️ NEVER commit secrets to version control or use .env files in production.**

#### Option A: AWS Secrets Manager

```bash
# Store JWT secret
aws secretsmanager create-secret \
  --name apricity/jwt-secret \
  --secret-string "your-super-secure-jwt-secret-key-here"

# Store MongoDB URI
aws secretsmanager create-secret \
  --name apricity/mongodb-uri \
  --secret-string "mongodb+srv://user:pass@cluster.mongodb.net/apricity"

# Store ML model path
aws secretsmanager create-secret \
  --name apricity/ml-model-path \
  --secret-string "s3://apricity-ml-models/production/"
```

**Access in application:**

```javascript
// Backend (Node.js)
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();
  return data.SecretString;
}

const JWT_SECRET = await getSecret("apricity/jwt-secret");
const MONGO_URI = await getSecret("apricity/mongodb-uri");
```

#### Option B: GCP Secret Manager

```bash
# Store secrets
echo -n "your-jwt-secret" | gcloud secrets create apricity-jwt-secret --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create apricity-mongodb-uri --data-file=-

# Access in Cloud Run
gcloud run services update apricity-backend \
  --set-secrets=JWT_SECRET=apricity-jwt-secret:latest
```

#### Option C: HashiCorp Vault

```bash
# Store secrets
vault kv put secret/apricity/jwt-secret value="your-secret"
vault kv put secret/apricity/mongodb-uri value="mongodb+srv://..."

# Access via API
curl -H "X-Vault-Token: $VAULT_TOKEN" \
  https://vault.example.com/v1/secret/data/apricity/jwt-secret
```

### 3. HTTPS/TLS Configuration

**⚠️ Always use HTTPS in production. HTTP is not secure for authentication.**

#### Option A: Cloud Provider Load Balancer (Recommended)

**AWS Application Load Balancer (ALB)**

```bash
# ALB automatically handles TLS termination
# Configure SSL certificate via AWS Certificate Manager (ACM)

# Request certificate (free)
aws acm request-certificate \
  --domain-name apricity.yourdomain.com \
  --validation-method DNS

# Attach to ALB
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn>
```

**GCP Load Balancer**

```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create apricity-cert \
  --domains=apricity.yourdomain.com

# Attach to HTTPS load balancer
gcloud compute target-https-proxies create apricity-https-proxy \
  --ssl-certificates=apricity-cert
```

#### Option B: Let's Encrypt with Nginx

```nginx
# /etc/nginx/sites-available/apricity
server {
    listen 443 ssl http2;
    server_name apricity.yourdomain.com;

    # Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/apricity.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apricity.yourdomain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Backend proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name apricity.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Option C: Cloudflare (Easiest)

1. Add domain to Cloudflare (free plan available)
2. Enable "Full (strict)" SSL/TLS mode
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"
5. Point DNS to your application servers

### 4. ML Model Storage and Path

**⚠️ Do not bundle large ML models in Docker images.**

#### Recommended: Object Storage

**AWS S3**

```bash
# Upload models to S3
aws s3 sync ./ml_service/models/ s3://apricity-ml-models/production/

# Set environment variable
ML_MODEL_PATH=s3://apricity-ml-models/production/

# Mount in application
# Use boto3 to download models on startup or lazy load
```

**GCP Cloud Storage**

```bash
# Upload models
gsutil -m cp -r ./ml_service/models/* gs://apricity-ml-models/production/

# Set environment variable
ML_MODEL_PATH=gs://apricity-ml-models/production/
```

**Python code to load from S3:**

```python
import boto3
import os

def load_models_from_s3():
    s3 = boto3.client('s3')
    bucket = 'apricity-ml-models'
    prefix = 'production/'

    local_model_dir = '/tmp/models'
    os.makedirs(local_model_dir, exist_ok=True)

    # Download models
    response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    for obj in response.get('Contents', []):
        local_path = os.path.join(local_model_dir, obj['Key'].replace(prefix, ''))
        s3.download_file(bucket, obj['Key'], local_path)

    return local_model_dir
```

## ⚖️ Scaling Strategy

### Scale ML Service Separately

The ML service is CPU/GPU intensive and has different scaling needs than the backend API.

**Why separate scaling?**

- ✅ ML inference requires more compute resources
- ✅ Backend can scale horizontally with lightweight instances
- ✅ ML can use GPU instances when needed
- ✅ Cost optimization (don't pay for GPU on all instances)

**Implementation:**

1. **Backend Scaling (Stateless)**

   - Use auto-scaling based on CPU/memory
   - Target: 50-70% CPU utilization
   - Scale based on request count
   - Lightweight instances (t3.medium, n1-standard-2)

2. **ML Service Scaling (Compute-Intensive)**

   - Separate deployment from backend
   - Use GPU instances for faster inference (optional)
   - Scale based on queue depth
   - Consider async processing with message queue

3. **Architecture Pattern:**
   ```
   Frontend → Backend API → Message Queue → ML Workers
                             (Redis/SQS)    (Auto-scaled)
   ```

## 🌐 Recommended Deployment Platforms

### Option 1: AWS ECS with Fargate (Recommended for Enterprise)

**Pros:**

- ✅ Fully managed container orchestration
- ✅ No server management (serverless containers)
- ✅ Auto-scaling built-in
- ✅ Integration with AWS services (ALB, Secrets Manager, CloudWatch)
- ✅ VPC networking and security groups

**Deployment Steps:**

1. **Create ECR Repositories**

   ```bash
   aws ecr create-repository --repository-name apricity-backend
   aws ecr create-repository --repository-name apricity-ml-service
   aws ecr create-repository --repository-name apricity-frontend
   ```

2. **Build and Push Images**

   ```bash
   # Login to ECR
   aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

   # Tag and push
   docker tag apricity-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/apricity-backend:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/apricity-backend:latest
   ```

3. **Create ECS Task Definitions**

   ```json
   {
     "family": "apricity-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/apricity-backend:latest",
         "portMappings": [{ "containerPort": 5000 }],
         "secrets": [
           { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..." },
           { "name": "MONGO_URI", "valueFrom": "arn:aws:secretsmanager:..." }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/apricity-backend",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

4. **Create ECS Services**

   ```bash
   aws ecs create-service \
     --cluster apricity-cluster \
     --service-name apricity-backend \
     --task-definition apricity-backend \
     --desired-count 2 \
     --launch-type FARGATE \
     --load-balancers targetGroupArn=<alb-target-group-arn>,containerName=backend,containerPort=5000
   ```

5. **Configure Auto-Scaling**

   ```bash
   aws application-autoscaling register-scalable-target \
     --service-namespace ecs \
     --resource-id service/apricity-cluster/apricity-backend \
     --scalable-dimension ecs:service:DesiredCount \
     --min-capacity 2 \
     --max-capacity 10

   aws application-autoscaling put-scaling-policy \
     --service-namespace ecs \
     --resource-id service/apricity-cluster/apricity-backend \
     --scalable-dimension ecs:service:DesiredCount \
     --policy-name cpu-scaling \
     --policy-type TargetTrackingScaling \
     --target-tracking-scaling-policy-configuration \
       'PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization},TargetValue=70.0'
   ```

**ML Service Scaling:**

```bash
# Separate ML service with GPU instances (if needed)
aws ecs create-service \
  --cluster apricity-cluster \
  --service-name apricity-ml-service \
  --task-definition apricity-ml-service-gpu \
  --desired-count 1 \
  --launch-type EC2 \
  --placement-constraints type="memberOf",expression="attribute:gpu == true"
```

**Cost Estimate:**

- Backend (2x t3.medium): ~$60/month
- ML Service (1x g4dn.xlarge): ~$380/month (or t3.large without GPU: ~$60/month)
- MongoDB Atlas (M10): ~$60/month
- Load Balancer: ~$20/month
- **Total: ~$140-520/month** (depending on GPU usage)

---

### Option 2: GCP Cloud Run (Recommended for Simplicity)

**Pros:**

- ✅ Fully serverless (pay per request)
- ✅ Auto-scaling from 0 to thousands
- ✅ Dead simple deployment
- ✅ Built-in HTTPS with managed certificates
- ✅ No infrastructure management

**Deployment Steps:**

1. **Build Container Images**

   ```bash
   # Backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/apricity-backend ./backend

   # ML Service
   gcloud builds submit --tag gcr.io/PROJECT_ID/apricity-ml-service ./ml_service

   # Frontend
   gcloud builds submit --tag gcr.io/PROJECT_ID/apricity-frontend ./frontend
   ```

2. **Deploy Backend**

   ```bash
   gcloud run deploy apricity-backend \
     --image gcr.io/PROJECT_ID/apricity-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-secrets JWT_SECRET=apricity-jwt-secret:latest,MONGO_URI=apricity-mongodb-uri:latest \
     --memory 1Gi \
     --cpu 1 \
     --max-instances 10 \
     --min-instances 1
   ```

3. **Deploy ML Service (Separate)**

   ```bash
   gcloud run deploy apricity-ml-service \
     --image gcr.io/PROJECT_ID/apricity-ml-service \
     --platform managed \
     --region us-central1 \
     --no-allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --max-instances 5 \
     --min-instances 0 \
     --timeout 300s
   ```

4. **Configure Custom Domain**
   ```bash
   gcloud run domain-mappings create \
     --service apricity-backend \
     --domain api.apricity.yourdomain.com
   ```

**Cost Estimate:**

- Backend: ~$10-50/month (pay per request)
- ML Service: ~$20-100/month (pay per request)
- MongoDB Atlas: ~$60/month
- **Total: ~$90-210/month** (scales to $0 with no traffic)

---

### Option 3: Railway (Recommended for Fastest Deploy)

**Pros:**

- ✅ Simplest deployment (git push to deploy)
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ One-click MongoDB provisioning
- ✅ Built-in monitoring
- ✅ No infrastructure knowledge needed

**Deployment Steps:**

1. **Connect GitHub Repository**

   - Go to https://railway.app
   - Connect your GitHub account
   - Select `apricity` repository

2. **Deploy Services**

   ```bash
   # Railway automatically detects Dockerfile and deploys
   # Each service (backend, ml_service, frontend) gets its own Railway service
   ```

3. **Add MongoDB**

   - Click "New" → "Database" → "Add MongoDB"
   - Railway provisions managed MongoDB
   - Connection string automatically added to environment

4. **Configure Environment Variables**

   ```bash
   railway variables set JWT_SECRET="your-secret-here"
   railway variables set NODE_ENV="production"
   ```

5. **Add Custom Domain**
   - Settings → Domains → Add custom domain
   - Railway handles SSL automatically

**Cost Estimate:**

- Free tier: $5 credit/month (good for development)
- Hobby plan: $5/month + usage (~$10-20/month total)
- **Total: ~$10-30/month** (great for small projects)

---

### Option 4: Docker Compose on VPS (Budget Option)

**Pros:**

- ✅ Low cost (single VPS)
- ✅ Full control
- ✅ Simple architecture

**Cons:**

- ❌ Manual scaling
- ❌ No auto-recovery
- ❌ You manage everything

**Deployment Steps:**

1. **Provision VPS**

   - DigitalOcean Droplet (4GB RAM, 2 vCPUs): $24/month
   - Linode (4GB RAM, 2 vCPUs): $24/month
   - Vultr (4GB RAM, 2 vCPUs): $24/month

2. **Install Docker**

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Clone Repository**

   ```bash
   git clone https://github.com/your-org/apricity.git
   cd apricity
   ```

4. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Deploy**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

6. **Setup Nginx + Let's Encrypt**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d apricity.yourdomain.com
   ```

**Cost Estimate:**

- VPS: ~$24/month
- MongoDB Atlas (M0 Free or M10): $0-60/month
- **Total: ~$24-84/month**

---

## 🔐 Production Security Checklist

- [ ] **Use MongoDB Atlas** (not self-hosted without hardening)
- [ ] **Store JWT_SECRET in secrets manager** (AWS/GCP/Vault)
- [ ] **Store MongoDB URI in secrets manager**
- [ ] **Store ML model paths in secrets manager**
- [ ] **Enable HTTPS/TLS** (443 only, redirect HTTP to HTTPS)
- [ ] **Use managed SSL certificates** (ACM, Let's Encrypt, Cloudflare)
- [ ] **Enable CORS only for your domain** (not wildcard \*)
- [ ] **Set secure HTTP headers** (Helmet.js already configured)
- [ ] **Enable rate limiting** (prevent abuse)
- [ ] **Set up monitoring** (CloudWatch, Stackdriver, DataDog)
- [ ] **Enable logging** (centralized logs)
- [ ] **Backup MongoDB** (automated daily backups)
- [ ] **Use environment variables** (never hardcode secrets)
- [ ] **Update dependencies** (npm audit, pip-audit)
- [ ] **Set up alerts** (downtime, errors, high CPU)
- [ ] **Implement health checks** (already configured)
- [ ] **Use load balancer** (distribute traffic)
- [ ] **Scale ML service separately** (different compute needs)
- [ ] **Enable auto-scaling** (handle traffic spikes)
- [ ] **Set up CI/CD** (automated deployments)
- [ ] **Review IAM permissions** (principle of least privilege)

---

## 📊 Monitoring and Observability

### Required Metrics

1. **Backend API**

   - Request rate (requests/second)
   - Error rate (4xx, 5xx)
   - Response time (p50, p95, p99)
   - Database connection pool usage
   - JWT token errors

2. **ML Service**

   - Inference latency
   - Queue depth
   - Model load time
   - Memory usage
   - GPU utilization (if using GPU)

3. **Infrastructure**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network traffic
   - Container restart count

### Recommended Tools

- **AWS:** CloudWatch, X-Ray
- **GCP:** Cloud Monitoring, Cloud Trace
- **Multi-cloud:** DataDog, New Relic, Prometheus + Grafana

---

## 🚢 Deployment Comparison Table

| Feature                  | AWS ECS/Fargate | GCP Cloud Run | Railway    | Docker Compose VPS |
| ------------------------ | --------------- | ------------- | ---------- | ------------------ |
| **Ease of Setup**        | ⭐⭐⭐          | ⭐⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐ | ⭐⭐               |
| **Cost (Low Traffic)**   | $$$             | $             | $          | $$                 |
| **Cost (High Traffic)**  | $$$             | $$$           | $$$        | $$                 |
| **Auto-Scaling**         | ✅              | ✅            | ✅         | ❌                 |
| **Zero Downtime Deploy** | ✅              | ✅            | ✅         | ❌                 |
| **Managed SSL**          | ✅              | ✅            | ✅         | ❌ (DIY)           |
| **Monitoring**           | ✅              | ✅            | ✅         | ❌ (DIY)           |
| **GPU Support**          | ✅              | ✅            | ❌         | ✅ (DIY)           |
| **Free Tier**            | ✅ (12 months)  | ✅            | ✅         | ❌                 |
| **Best For**             | Enterprise      | Simplicity    | Speed      | Budget             |

---

## 🎯 Recommended Deployment by Use Case

### Hobby/Personal Project

→ **Railway** or **GCP Cloud Run**

- Fastest setup
- Lowest cost
- Scales automatically

### Startup/MVP

→ **GCP Cloud Run** or **AWS ECS Fargate**

- Production-ready
- Auto-scaling
- Pay-as-you-grow

### Enterprise

→ **AWS ECS Fargate** or **Kubernetes (EKS/GKE)**

- Maximum control
- Advanced networking
- Compliance requirements

### Budget-Conscious

→ **Docker Compose on VPS**

- Lowest cost
- Simple stack
- Predictable pricing

---

## 📚 Additional Resources

- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **AWS ECS Documentation:** https://docs.aws.amazon.com/ecs/
- **GCP Cloud Run Documentation:** https://cloud.google.com/run/docs
- **Railway Documentation:** https://docs.railway.app/
- **Let's Encrypt:** https://letsencrypt.org/
- **Docker Security:** https://docs.docker.com/engine/security/

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0
