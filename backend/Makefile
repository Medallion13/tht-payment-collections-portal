.PHONY: install lint test format run help

install:
	pnpm install

lint:
	pnpm run lint

test:
	pnpm run test

test-cov:
	pnpm run test:cov

format:
	pnpm run format

format-check:
	pnpm run format:check

run:
	pnpm run start:dev

build:
	pnpm run build

clean:
	rm -rf dist coverage node_modules

help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies"
	@echo "  lint          - Lint code"
	@echo "  test          - Run tests"
	@echo "  test-cov      - Run tests with coverage"
	@echo "  format        - Format code"
	@echo "  format-check  - Check formatting"
	@echo "  run           - Run in dev mode"
	@echo "  build         - Build for production"
	@echo "  clean         - Clean generated files"