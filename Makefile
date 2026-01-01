# Apricity Docker Makefile
# Convenient commands for managing Docker services

.PHONY: help up down restart logs build clean status health shell-backend shell-mongo backup

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Apricity Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

up: ## Start all services (without frontend)
	@echo "$(BLUE)Starting Apricity services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started! Check status with 'make status'$(NC)"

up-full: ## Start all services including frontend
	@echo "$(BLUE)Starting Apricity services with frontend...$(NC)"
	docker-compose --profile full up -d
	@echo "$(GREEN)Services started! Check status with 'make status'$(NC)"

down: ## Stop all services
	@echo "$(BLUE)Stopping Apricity services...$(NC)"
	docker-compose down
	@echo "$(GREEN)Services stopped$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting Apricity services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)Services restarted$(NC)"

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-ml: ## View ML service logs
	docker-compose logs -f ml_service

logs-mongo: ## View MongoDB logs
	docker-compose logs -f mongo

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

build: ## Build all service images
	@echo "$(BLUE)Building service images...$(NC)"
	docker-compose build
	@echo "$(GREEN)Build complete$(NC)"

rebuild: ## Rebuild and restart all services
	@echo "$(BLUE)Rebuilding and restarting services...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)Services rebuilt and restarted$(NC)"

clean: ## Stop services and remove volumes (WARNING: deletes data!)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)Cleaned up services and volumes$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

clean-all: ## Remove services, volumes, and images
	@echo "$(RED)WARNING: This will delete all data and images!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --rmi all; \
		echo "$(GREEN)Cleaned up everything$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	@docker-compose ps

health: ## Check service health
	@echo "$(BLUE)Backend Health:$(NC)"
	@curl -f http://localhost:5000/health 2>/dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(BLUE)ML Service Health:$(NC)"
	@curl -f http://localhost:8000/health 2>/dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "$(BLUE)MongoDB Health:$(NC)"
	@docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1 && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-mongo: ## Open MongoDB shell
	docker-compose exec mongo mongosh apricity

shell-ml: ## Open shell in ML service container
	docker-compose exec ml_service sh

backup: ## Backup MongoDB data
	@echo "$(BLUE)Backing up MongoDB data...$(NC)"
	@mkdir -p ./backups
	docker-compose exec -T mongo mongodump --archive=/tmp/mongo-backup.archive --db=apricity
	docker cp apricity-mongo:/tmp/mongo-backup.archive ./backups/mongo-backup-$$(date +%Y%m%d-%H%M%S).archive
	@echo "$(GREEN)Backup saved to ./backups/$(NC)"

restore: ## Restore MongoDB from latest backup (use BACKUP=filename to specify)
	@if [ -z "$(BACKUP)" ]; then \
		LATEST=$$(ls -t ./backups/mongo-backup-*.archive 2>/dev/null | head -1); \
		if [ -z "$$LATEST" ]; then \
			echo "$(RED)No backups found$(NC)"; \
			exit 1; \
		fi; \
		echo "$(BLUE)Restoring from $$LATEST$(NC)"; \
		docker cp $$LATEST apricity-mongo:/tmp/restore.archive; \
	else \
		echo "$(BLUE)Restoring from $(BACKUP)$(NC)"; \
		docker cp $(BACKUP) apricity-mongo:/tmp/restore.archive; \
	fi
	docker-compose exec -T mongo mongorestore --archive=/tmp/restore.archive
	@echo "$(GREEN)Restore complete$(NC)"

stats: ## Show resource usage
	docker stats --no-stream

top: ## Show running processes in containers
	docker-compose top

prune: ## Clean up unused Docker resources
	@echo "$(BLUE)Cleaning up unused Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)Cleanup complete$(NC)"

env: ## Create .env file from example
	@if [ -f .env ]; then \
		echo "$(RED).env file already exists$(NC)"; \
	else \
		cp .env.example .env; \
		echo "$(GREEN).env file created from .env.example$(NC)"; \
		echo "$(BLUE)Please edit .env with your values$(NC)"; \
	fi
