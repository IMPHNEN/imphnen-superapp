APPS := api landing backoffice dimentorin gacha hackathon imphnenos infra qrcampaign

.PHONY: help install check lint format typecheck test build ci deploy-all promote $(APPS)

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

deploy-all: ## Build and deploy every Worker with your wrangler login (API included)
	moon run $(addsuffix :deploy,$(APPS))

ROLE ?= admin
promote: ## Give a signed-up production user a role: make promote EMAIL=you@example.com [ROLE=admin|superadmin|mentor|user]
	@test -n "$(EMAIL)" || { echo "usage: make promote EMAIL=you@example.com [ROLE=admin]"; exit 1; }
	@echo "$(EMAIL)" | grep -Eq '^[^@'"'"' ]+@[^@'"'"' ]+$$' || { echo "invalid email"; exit 1; }
	@echo "$(ROLE)" | grep -Eq '^(superadmin|admin|mentor|user)$$' || { echo "ROLE must be superadmin, admin, mentor or user"; exit 1; }
	pnpm --dir apps/api exec wrangler d1 execute DB --remote --command "UPDATE user SET role = '$(ROLE)' WHERE email = '$(EMAIL)'"
