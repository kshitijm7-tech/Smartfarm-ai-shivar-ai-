# SmartFarm AI - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)

## Local Deployment with Docker

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd smartfarm-app
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Build and Run
```bash
docker-compose up -d --build
```

### 4. Verify
- Frontend: http://localhost
- Backend API: http://localhost/api
- Backend Health: http://localhost/health

## AWS Deployment Options

### Option 1: AWS Elastic Beanstalk (Recommended for beginners)

1. **Prepare your application**
   ```bash
   # Create a Dockerrun.aws.json file (see below)
   # Zip your application files
   zip smartfarm-deploy.zip . -x "node_modules/*" "venv/*" "*.pyc"
   ```

2. **Create Dockerrun.aws.json**
   ```json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": {
       "Name": "your-ecr-repo/smartfarm-backend:latest",
       "Update": "true"
     },
     "Ports": [
       {
         "ContainerPort": 5000,
         "HostPort": 5000
       }
     ],
     "Logging": "/var/log/containers"
   }
   ```

3. **Deploy via AWS Console**
   - Go to Elastic Beanstalk
   - Create new application
   - Upload your zip file
   - Configure environment (Docker platform)
   - Launch

### Option 2: AWS ECS with Fargate

1. **Push images to Amazon ECR**
   ```bash
   # Authenticate with ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag images
   docker build -t smartfarm-backend ./backend
   docker build -t smartfarm-frontend ./frontend

   # Push to ECR
   docker tag smartfarm-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartfarm-backend:latest
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/smartfarm-backend:latest
   ```

2. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name smartfarm-cluster
   ```

3. **Create Task Definition** (see task-definition.json)

4. **Create Services**
   - Backend service on port 5000
   - Frontend service on port 80 with load balancer

### Option 3: AWS EC2 with Docker

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Open ports 80, 443, 5000 in security group
   - Install Docker

2. **Deploy**
   ```bash
   # SSH into instance
   ssh -i your-key.pem ec2-user@your-instance-ip

   # Clone and deploy
   git clone <your-repo>
   cd smartfarm-app
   cp .env.example .env
   docker-compose up -d --build
   ```

### Option 4: AWS App Runner

1. Push your Docker image to Amazon ECR
2. Go to App Runner in AWS Console
3. Create service from ECR image
4. Configure port (5000 for backend)
5. Deploy

## Environment Variables for Production

Set these in your AWS environment:

```
FLASK_ENV=production
SECRET_KEY=<strong-random-secret-key>
DATABASE_URL=postgresql://user:password@host:5432/database (recommended for production)
CORS_ORIGINS=https://your-domain.com
```

## Database Setup for Production

For production, use Amazon RDS instead of SQLite:

1. Create PostgreSQL RDS instance
2. Update DATABASE_URL in environment
3. Run migrations:
   ```bash
   docker-compose exec backend python init_db.py
   ```

## Domain and SSL

1. **Route 53**: Register domain and create hosted zone
2. **ACM**: Request SSL certificate
3. **Load Balancer**: Create ALB with HTTPS listener
4. **Update DNS**: Point domain to load balancer

## Monitoring

- **CloudWatch**: Set up logs and metrics
- **ECS/EB**: Enable enhanced monitoring
- **Health Checks**: Configure load balancer health checks

## Scaling

- **ECS**: Update desired count in service
- **EB**: Configure scaling policies
- **Auto Scaling**: Set up based on CPU/memory

## Cost Optimization

- Use Fargate for serverless containers
- Right-size EC2 instances
- Use reserved instances for predictable workloads
- Set up billing alerts

## Troubleshooting

### Check logs
```bash
# Docker Compose
docker-compose logs -f

# ECS
aws logs get-log-events --log-group-name /ecs/smartfarm-backend
```

### Common Issues

1. **Port conflicts**: Ensure ports 80, 5000 are not in use
2. **Memory issues**: Increase Docker memory limits
3. **Database connections**: Check RDS security group
4. **CORS errors**: Verify CORS_ORIGINS includes your domain