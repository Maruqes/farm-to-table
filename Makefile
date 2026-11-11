DEV = docker compose -f compose.yaml -f compose.dev.yaml

.PHONY: help dev up down logs install sync-deps seed setup
dev:  ## hot-reload stack: web :5173, api :3000, backoffice :8081
	$(DEV) up --build
up:   ## production-like stack
	docker compose up --build -d
down:
	$(DEV) down
logs:
	docker compose logs -f
install:  ## install JS deps on the host (api + web) for typecheck, tests and seed
	cd apps/api && npm install --no-audit --no-fund
	cd apps/web && npm install --no-audit --no-fund
sync-deps:  ## reinstall deps inside the running dev containers (run after adding a dependency: /app/node_modules volumes survive --build)
	$(DEV) exec api npm install --no-audit --no-fund
	$(DEV) exec web npm install --no-audit --no-fund
seed: install  ## seed demo users/products/orders/auctions (fills blank SEED_* passwords in .env, never touches set ones)
	for v in SEED_ADMIN_PASSWORD SEED_USER_PASSWORD; do \
	  if ! grep -q "^$$v=.\+" .env 2>/dev/null; then \
	    pw=$$(openssl rand -hex 12); \
	    if grep -q "^$$v=" .env 2>/dev/null; then \
	      sed -i "s/^$$v=.*/$$v=$$pw/" .env; \
	    else \
	      printf '%s=%s\n' "$$v" "$$pw" >> .env; \
	    fi; \
	    echo "generated $$v"; \
	  fi; \
	done
	cd apps/api && npm run seed
setup: install  ## first-time bootstrap: host deps, dev stack, container deps, seed
	$(DEV) up -d --build
	$(MAKE) sync-deps seed
	@echo 'done: web :5173, api :3000, backoffice :8081'
help:  ## list targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  %-10s %s\n", $$1, $$2}'
