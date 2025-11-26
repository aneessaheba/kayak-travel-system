# Example Terraform variables for the minimal MSK deployment

project     = "kayak"
environment = "dev"
region      = "us-east-1"

tags = {
  Owner = "data-team"
}

# Provide the private subnet IDs that MSK should use
broker_subnet_ids = [
  "subnet-aaa111",
  "subnet-bbb222",
  "subnet-ccc333"
]

# Provide at least one security group that permits broker traffic
broker_security_group_ids = [
  "sg-1234567890abcdef0"
]

# Optional overrides
msk_instance_type     = "kafka.t3.small"
msk_broker_count      = 3
msk_ebs_volume_size   = 10
msk_kms_key_arn       = ""
log_retention_in_days = 7
