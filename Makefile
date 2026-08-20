.DEFAULT_GOAL := help

.PHONY: help install run test test-watch typecheck lint lint-fix format format-check check

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-14s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	bun install

run: ## Run the chart generator (requires birth environment variables)
	bun run index.ts

test: ## Run the test suite once
	bun run test

test-watch: ## Run tests in watch mode
	bun run test:watch

typecheck: ## Check TypeScript types
	bun run typecheck

lint: ## Check lint rules
	bun run lint

lint-fix: ## Fix lint violations where possible
	bun run lint:fix

format: ## Format project files
	bun run fmt

format-check: ## Check project formatting
	bun run fmt:check

check: typecheck test lint format-check ## Run all verification checks
