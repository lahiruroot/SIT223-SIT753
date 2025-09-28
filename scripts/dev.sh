#!/bin/bash

# Development script for Node.js Jenkins CI/CD Pipeline
# This script helps with local development setup and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18.x or higher."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command_exists docker; then
        print_warning "Docker is not installed. Some features may not work."
    fi
    
    if ! command_exists docker-compose; then
        print_warning "Docker Compose is not installed. Some features may not work."
    fi
    
    print_success "Prerequisites check completed."
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully."
}

# Function to run linting
run_lint() {
    print_status "Running ESLint..."
    npm run lint
    print_success "Linting completed successfully."
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    npm test
    print_success "Tests completed successfully."
}

# Function to run tests with coverage
run_tests_coverage() {
    print_status "Running tests with coverage..."
    npm run test:coverage
    print_success "Tests with coverage completed successfully."
}

# Function to start development server
start_dev() {
    print_status "Starting development server..."
    npm run dev
}

# Function to start production server
start_prod() {
    print_status "Starting production server..."
    npm start
}

# Function to build Docker image
build_docker() {
    print_status "Building Docker image..."
    docker build -t nodejs-app .
    print_success "Docker image built successfully."
}

# Function to run Docker container
run_docker() {
    print_status "Running Docker container..."
    docker run -p 3000:3000 nodejs-app
}

# Function to start all services with Docker Compose
start_services() {
    print_status "Starting all services with Docker Compose..."
    docker-compose up -d
    print_success "All services started successfully."
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped successfully."
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
}

# Function to show logs
show_logs() {
    print_status "Showing logs..."
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    docker-compose down -v --rmi all
    docker system prune -f
    print_success "Cleanup completed successfully."
}

# Function to run full test suite
run_full_test() {
    print_status "Running full test suite..."
    run_lint
    run_tests_coverage
    build_docker
    print_success "Full test suite completed successfully."
}

# Function to show help
show_help() {
    echo "Node.js Jenkins CI/CD Pipeline - Development Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check       Check prerequisites"
    echo "  install     Install dependencies"
    echo "  lint        Run ESLint"
    echo "  test        Run tests"
    echo "  test-cov    Run tests with coverage"
    echo "  dev         Start development server"
    echo "  prod        Start production server"
    echo "  build       Build Docker image"
    echo "  run         Run Docker container"
    echo "  start       Start all services with Docker Compose"
    echo "  stop        Stop all services"
    echo "  status      Show service status"
    echo "  logs        Show logs"
    echo "  cleanup     Clean up Docker resources"
    echo "  full-test   Run full test suite"
    echo "  help        Show this help message"
    echo ""
}

# Main script logic
case "${1:-help}" in
    check)
        check_prerequisites
        ;;
    install)
        check_prerequisites
        install_dependencies
        ;;
    lint)
        run_lint
        ;;
    test)
        run_tests
        ;;
    test-cov)
        run_tests_coverage
        ;;
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    build)
        build_docker
        ;;
    run)
        run_docker
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup
        ;;
    full-test)
        check_prerequisites
        install_dependencies
        run_full_test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
