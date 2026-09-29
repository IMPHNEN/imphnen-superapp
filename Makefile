APPS := landing backoffice dimentorin gacha hackathon imphnenos infra qrcampaign

.PHONY: help install check lint format typecheck test build ci pages-create $(APPS)

help: ## List the available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-14s %s\n", $$1, $$2}'
	@echo "  <app>          Run one app's dev server: $(APPS)"

install: ## Install workspace dependencies
	pnpm install

$(APPS):
	moon run $@:dev

check: ## Biome check across the workspace
	moon run :check

lint: ## Biome lint across the workspace
	moon run :lint

format: ## Biome format --write across the workspace
	moon run :format

typecheck: ## tsc / astro check, every project
	moon run :typecheck

test: ## Unit tests (ui, dimentorin)
	moon run :test

build: ## Build every app into apps/<app>/dist
	moon run :build

ci: ## What CI runs, on affected projects
	moon ci

pages-create: ## Create the Cloudflare Pages projects (one-off, needs wrangler login)
	@for app in $(APPS); do pnpm exec wrangler pages project create imphnen-$$app --production-branch=develop || true; done
