# MSK Terraform with Auto Account Detection

Minimal Terraform setup for AWS MSK with automatic account switching support.

## Prerequisites

- **Terraform** >= 1.8
- **AWS CLI** configured with credentials
- **uv** (Python package manager) - Install: `curl -LsSf https://astral.sh/uv/install.sh | sh`

## Quick Start

```bash
# 1. Plan infrastructure (auto-detects AWS account & generates config)
make plan

# 2. Deploy
make apply

# 3. Get connection info
make output

# 4. Destroy when done to clean up resources and avoid costs
make destroy
```

That's it! The precheck script automatically handles account detection and configuration.

## How It Works

When you run `make plan` or `make init`:

1. **Precheck runs automatically** and:
   - Detects your current AWS account ID
   - Cleans any old Terraform state files (prevents account conflicts)
   - Finds your VPC and subnets
   - Creates/finds MSK security group
   - Generates `terraform.tfvars` with discovered resources
   - Backs up previous config (if switching accounts)

2. **Terraform initializes** with the correct provider

3. **Plan is created** and saved to `plan.out`

4. **Apply uses the saved plan** - exactly what you reviewed gets deployed

## Switching AWS Accounts

Just change your AWS credentials and run `make plan`:

```bash
# Switch account (any method)
export AWS_PROFILE=different-account

# Run plan - precheck detects new account automatically
make plan
make apply
```

The precheck script handles all cleanup and reconfiguration automatically.

## Commands

| Command | What It Does |
|---------|-------------|
| `make plan` | Auto-configures for current AWS account, creates plan |
| `make apply` | Applies the saved plan.out |
| `make destroy` | Destroys all infrastructure |
| `make output` | Shows connection strings |
| `make clean` | Removes all Terraform state/cache files |

## What Gets Created

## What Gets Created

- **MSK Cluster** - 3 brokers, Kafka 3.6.0, IAM auth, TLS encryption
- **CloudWatch Log Group** - 7-day retention for broker logs
- **Security Group** - Allows Kafka traffic (ports 9092, 9094, 9096)

Default sizing: `kafka.t3.small` instances with 10 GB EBS per broker.

## Configuration Files

- `terraform.tfvars` - Auto-generated for current AWS account
- `terraform.tfvars.backup.<account-id>` - Backups when switching accounts
- `plan.out` - Saved plan file (auto-deleted after apply)

## Troubleshooting

**Problem:** AWS credentials error  
**Solution:** Run `aws sts get-caller-identity` to verify credentials

**Problem:** No VPC/subnets found  
**Solution:** Ensure your AWS account has a VPC with at least 2 subnets

**Problem:** State conflicts  
**Solution:** Run `make clean && make plan`

## Advanced

To manually run just the precheck without planning:
```bash
make precheck
```