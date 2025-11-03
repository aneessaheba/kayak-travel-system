# AWS Precheck Scripts

This directory contains scripts for managing AWS account switching and Terraform configuration.

## Scripts

### precheck.py

Automatically detects the current AWS account and generates `terraform.tfvars` with the appropriate VPC, subnets, and security groups.

**Features:**
- Detects current AWS account ID
- Cleans old Terraform state files to prevent account conflicts
- Finds or creates VPC and subnets
- Creates or reuses security groups for MSK
- Generates `terraform.tfvars` with current account configuration
- Backs up existing `terraform.tfvars` files

**Usage:**
```bash
# From the scripts directory
uv run precheck.py

# Or use the Makefile target
make precheck
```

## Setup

The script uses `uv` for Python environment management. Dependencies are minimal (only standard library).

## Requirements

- AWS CLI configured with valid credentials
- `uv` installed (for Python environment management)
- Appropriate AWS permissions to:
  - Describe VPCs, subnets, security groups
  - Create security groups (if needed)
  - Get caller identity
