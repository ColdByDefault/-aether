#!/bin/bash

# Server Dashboard - Quick Start Script
# This script handles building and running the dashboard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PORT=3000
COMMAND="up"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    start)
      COMMAND="up"
      shift
      ;;
    stop)
      COMMAND="down"
      shift
      ;;
    restart)
      COMMAND="restart"
      shift
      ;;
    logs)
      COMMAND="logs"
      shift
      ;;
    build)
      COMMAND="build"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

show_help() {
  cat << EOF
${BLUE}Server Dashboard - Quick Start${NC}

Usage: ./start.sh [COMMAND] [OPTIONS]

Commands:
  start              Start the dashboard (default)
  stop               Stop the dashboard
  restart            Restart the dashboard
  logs               View dashboard logs (live)
  build              Build the Docker image

Options:
  -p, --port PORT    Use a different port (default: 3000)
  -h, --help         Show this help message

Examples:
  ./start.sh                    # Start on port 3000
  ./start.sh -p 8080           # Start on port 8080
  ./start.sh stop               # Stop the dashboard
  ./start.sh logs               # View live logs
  ./start.sh build              # Just build the image

${YELLOW}Requirements:${NC}
  - Docker
  - Docker Compose

${YELLOW}First Time Setup:${NC}
  ./start.sh build
  ./start.sh

${YELLOW}Access the Dashboard:${NC}
  http://localhost:${PORT}

EOF
}

check_requirements() {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
}

start_dashboard() {
  echo -e "${BLUE}Starting Server Dashboard on port ${PORT}...${NC}"
  
  if [ "$PORT" != "3000" ]; then
    # Temporarily modify port in docker-compose
    sed -i.bak "s/- \"3000:3000\"/- \"${PORT}:3000\"/g" docker-compose.yml
    trap "mv docker-compose.yml.bak docker-compose.yml" EXIT
  fi

  docker-compose up -d
  
  # Wait for container to be ready
  echo -e "${BLUE}Waiting for dashboard to be ready...${NC}"
  sleep 3
  
  if docker ps | grep -q server-dashboard; then
    echo -e "${GREEN}✓ Dashboard started successfully${NC}"
    echo -e "${YELLOW}Access the dashboard at: http://localhost:${PORT}${NC}"
    echo -e "${YELLOW}View logs with: docker-compose logs -f dashboard${NC}"
  else
    echo -e "${RED}✗ Failed to start dashboard${NC}"
    docker-compose logs
    exit 1
  fi
}

stop_dashboard() {
  echo -e "${BLUE}Stopping Server Dashboard...${NC}"
  docker-compose down
  echo -e "${GREEN}✓ Dashboard stopped${NC}"
}

restart_dashboard() {
  stop_dashboard
  start_dashboard
}

view_logs() {
  echo -e "${BLUE}Viewing dashboard logs (Ctrl+C to exit)...${NC}"
  docker-compose logs -f dashboard
}

build_image() {
  echo -e "${BLUE}Building Docker image...${NC}"
  docker-compose build
  echo -e "${GREEN}✓ Image built successfully${NC}"
}

# Main execution
check_requirements

case $COMMAND in
  up)
    start_dashboard
    ;;
  down)
    stop_dashboard
    ;;
  restart)
    restart_dashboard
    ;;
  logs)
    view_logs
    ;;
  build)
    build_image
    ;;
  *)
    show_help
    exit 1
    ;;
esac
