#!/bin/bash

# SmartFarm AI - Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="smartfarm-app"
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Deploying SmartFarm AI to $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_status "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_status "Docker Compose is installed"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env with your configuration before continuing"
    exit 1
fi
print_status ".env file found"

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build and deploy
echo "🔨 Building and deploying..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check backend
if curl -s http://localhost:5000/health > /dev/null; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed"
    docker-compose -f $COMPOSE_FILE logs backend
fi

# Check frontend
if curl -s http://localhost > /dev/null; then
    print_status "Frontend is healthy"
else
    print_warning "Frontend health check failed"
    docker-compose -f $COMPOSE_FILE logs frontend
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Access your application:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:5000"
echo "   API:      http://localhost:5000/api"
echo ""
echo "📊 View logs:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f $COMPOSE_FILE down"