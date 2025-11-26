.PHONY: help precheck init plan apply destroy fmt validate output clean test

help:
	@echo "Minimal MSK Terraform workflow"
	@echo "Targets: test | precheck | init | plan | apply | destroy | fmt | validate | output | clean"
	@echo ""
	@echo "test     - Test AWS connectivity and tool availability"
	@echo "precheck - Run AWS account precheck and generate terraform.tfvars"
	@echo "init     - Initialize Terraform (runs precheck first)"
	@echo "plan     - Plan Terraform changes and save to plan.out"
	@echo "apply    - Apply the saved plan from plan.out"

test:
	@echo "Testing environment setup..."
	@cd scripts && uv run test_setup.py

precheck:
	@echo "Running AWS account precheck..."
	@cd scripts && uv run precheck.py

init: precheck
	@if [ ! -d .terraform ]; then \
		terraform init; \
	else \
		echo "Terraform already initialized. Run 'make clean' to re-initialize."; \
	fi

plan: precheck
	@if [ ! -d .terraform ]; then \
		echo "Initializing Terraform..."; \
		terraform init; \
	fi
	terraform plan -out=plan.out
	@echo ""
	@echo "Plan saved to plan.out. Run 'make apply' to apply it."

apply: plan.out
	terraform apply plan.out
	@rm -f plan.out

plan.out:
	@echo "No plan file found. Running 'make plan' first..."
	@$(MAKE) plan

destroy:
	terraform destroy

fmt:
	terraform fmt -recursive

validate:
	terraform validate

output:
	terraform output

clean:
	rm -rf .terraform .terraform.lock.hcl plan.out terraform.tfstate.backup
