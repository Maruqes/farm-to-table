DEV = docker compose -f compose.yaml -f compose.dev.yaml

.PHONY: dev up down logs
dev:  ## hot-reload stack: web :5173, api :3000, backoffice :8081
	$(DEV) up --build
up:   ## production-like stack
	docker compose up --build -d
down:
	$(DEV) down
logs:
	docker compose logs -f
