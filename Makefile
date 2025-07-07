# Variables
FRONTEND_DIR = Frontend
BACKEND_DIR = Backend
LOCAL_IP = 10.11.9.1

# Colors for terminal output
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
all: network

# Check status of services
status:
	@echo "$(GREEN)Checking project status...$(NC)"
	@echo "$(GREEN)Frontend (container):$(NC)"
	@docker compose exec -T frontend npm list --depth=0 || echo "Container not running"
	@echo "$(GREEN)Backend (container):$(NC)"
	@docker compose exec -T backend npm list --depth=0 || echo "Container not running"
	@echo "$(GREEN)Docker containers:$(NC)"
	@docker ps -a
	@echo "$(GREEN)Docker images:$(NC)"
	@docker images
	@echo "$(GREEN)Docker volumes:$(NC)"
	@docker volume ls
	@echo "$(GREEN)Project status check complete!$(NC)"

# Clean build artifacts
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	# @tsc --build $(FRONTEND_DIR)/tsconfig.json --clean
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(BACKEND_DIR)/Frontend
	@rm -rf $(BACKEND_DIR)/db/data.db
	@echo "$(GREEN)Clean complete!$(NC)"

# Full clean including node_modules
fclean: clean
	@echo "$(GREEN)Performing full clean...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(FRONTEND_DIR)/dist
	@rm -rf $(BACKEND_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/db/data.db
	@docker compose down --volumes --remove-orphans
	@docker system prune -f -a --volumes
	@echo "$(GREEN)Full clean complete!$(NC)"

# Install dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"


# Deploy using docker-compose (local development)
deploy:
	@echo "$(GREEN)🚀 Starting ft_transcendence...$(NC)"
	@docker compose down
	@docker compose up
	@docker exec -it ft_transcendence-frontend-1 sh -c "npm run build"


# Deploy for network access
network: fclean
	@echo "$(GREEN)🚀 Starting ft_transcendence for network access...$(NC)"
	@echo "$(BLUE)📱 Your application will be accessible at:$(NC)"
	@echo "   $(YELLOW)http://$(LOCAL_IP):3001$(NC) (Frontend)"
	@echo "   $(YELLOW)http://$(LOCAL_IP):3000$(NC) (Backend API)"
	@echo ""
	@echo "$(BLUE)🌐 Other devices on your network can access:$(NC)"
	@echo "   $(YELLOW)http://$(LOCAL_IP):3001$(NC)"
	@echo ""
	@touch $(BACKEND_DIR)/db/data.db && chmod 777 $(BACKEND_DIR)/db/data.db
	@docker image prune -f
	@docker compose down --remove-orphans
	@docker compose up --build

# Stop all services
stop:
	@echo "$(GREEN)Stopping all services...$(NC)"
	@docker compose down

.PHONY: all status clean fclean install watch build deploy network stop