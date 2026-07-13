# Makefile for managing the PostgreSQL stack via docker compose.
# Intended to run from WSL (bash). Requires Docker Desktop with WSL integration
# enabled, or docker + docker compose installed inside the WSL distro.

# Load variables from .env if present (fallback defaults below).
ifneq (,$(wildcard .env))
include .env
export
endif

POSTGRES_USER    ?= app
POSTGRES_DB      ?= purchase_requests
POSTGRES_PORT    ?= 5432
COMPOSE          ?= docker compose
SERVICE          ?= postgres
BACKEND_DIR      ?= backend
FRONTEND_DIR     ?= frontend

.DEFAULT_GOAL := help

.PHONY: help init up down stop start restart ps logs psql shell health wait reset destroy \
	backend-install prisma-generate migrate seed db-reset studio backend-setup \
	frontend-install dev\:all

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

init: ## Create .env from .env.example if it does not exist
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")

up: init ## Start PostgreSQL in the background
	$(COMPOSE) up -d

down: ## Stop and remove containers (keeps the data volume)
	$(COMPOSE) down

stop: ## Stop containers without removing them
	$(COMPOSE) stop

start: ## Start previously stopped containers
	$(COMPOSE) start

restart: ## Restart the PostgreSQL container
	$(COMPOSE) restart $(SERVICE)

ps: ## Show container status
	$(COMPOSE) ps

logs: ## Follow PostgreSQL logs
	$(COMPOSE) logs -f $(SERVICE)

psql: ## Open a psql session inside the container
	$(COMPOSE) exec $(SERVICE) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

shell: ## Open a shell inside the container
	$(COMPOSE) exec $(SERVICE) sh

health: ## Show the container health status
	@$(COMPOSE) ps --format 'table {{.Name}}\t{{.Status}}'

wait: ## Block until PostgreSQL is ready to accept connections
	@echo "Waiting for PostgreSQL..."
	@until $(COMPOSE) exec -T $(SERVICE) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."

reset: down up ## Restart the stack (keeps data)

destroy: ## Stop containers and DELETE the data volume (full DB wipe)
	$(COMPOSE) down -v

# --- Backend / Prisma (NestJS app in $(BACKEND_DIR)) ---

backend-install: ## Install backend dependencies
	cd $(BACKEND_DIR) && npm install

prisma-generate: ## Generate the Prisma client
	cd $(BACKEND_DIR) && npm run prisma:generate

migrate: ## Apply Prisma migrations in dev mode (prisma migrate dev)
	cd $(BACKEND_DIR) && npm run prisma:migrate

seed: ## Seed the database with demo data (prisma db seed)
	cd $(BACKEND_DIR) && npm run prisma:seed

db-reset: ## Reset the DB, re-apply migrations and re-seed (prisma migrate reset)
	cd $(BACKEND_DIR) && npm run prisma:reset

studio: ## Open Prisma Studio
	cd $(BACKEND_DIR) && npm run prisma:studio

backend-setup: up wait backend-install migrate seed ## Bring up the DB, install deps, migrate and seed
	@echo "Database is up, migrated and seeded."

# --- Frontend (Vite/Vue app in $(FRONTEND_DIR)) ---

frontend-install: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

# --- Full local development stack ---

dev\:all: up wait ## Start the DB, then run backend and frontend dev servers together (Ctrl+C stops both)
	@echo "Starting backend ($(BACKEND_DIR)) and frontend ($(FRONTEND_DIR)) dev servers. Press Ctrl+C to stop both."
	@trap 'kill 0' INT TERM EXIT; \
	( cd $(BACKEND_DIR) && npm run start:dev ) & \
	( cd $(FRONTEND_DIR) && npm run dev ) & \
	wait
