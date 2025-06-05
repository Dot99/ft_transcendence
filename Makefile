# Variables
FRONTEND_DIR = Frontend
BACKEND_DIR = Backend

# Colors for terminal output
GREEN = \033[0;32m
RED = \033[0;31m
NC = \033[0m # No Color

# Default target
all: deploy

# Check status of services
status:
	@echo "$(GREEN)Checking project status...$(NC)"
	@echo "$(GREEN)Frontend:$(NC)"
	@cd $(FRONTEND_DIR) && npm list --depth=0
	@echo "$(GREEN)Backend:$(NC)"
	@cd $(BACKEND_DIR) && npm list --depth=0

# Clean build artifacts
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	@tsc --build $(FRONTEND_DIR)/tsconfig.json --clean
	@sudo rm -rf $(FRONTEND_DIR)/dist
	@echo "$(GREEN)Clean complete!$(NC)"

# Full clean including node_modules
fclean: clean
	@echo "$(GREEN)Performing full clean...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/node_modules
	@docker system prune -f -a --volumes
	@echo "$(GREEN)Full clean complete!$(NC)"

# Install dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"


# Deploy using docker-compose
deploy:
	@echo "$(GREEN)Deploying with docker-compose...$(NC)"
	@docker compose up --build

# Stop all services
stop:
	@echo "$(GREEN)Stopping all services...$(NC)"
	@docker-compose down

.PHONY: all status clean fclean install watch build deploy stop