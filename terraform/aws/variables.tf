# Basic project configuration
variable "project" {
  description = "Project name used for tagging and resource naming"
  type        = string
  default     = "kayak"
}

variable "environment" {
  description = "Environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region for the MSK cluster"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Additional tags applied to all resources"
  type        = map(string)
  default     = {}
}

# Networking
variable "broker_subnet_ids" {
  description = "Private subnet IDs where MSK brokers will run"
  type        = list(string)

  validation {
    condition     = length(var.broker_subnet_ids) > 0
    error_message = "Provide at least one subnet ID for the MSK brokers."
  }
}

variable "broker_security_group_ids" {
  description = "Security group IDs that allow broker traffic"
  type        = list(string)

  validation {
    condition     = length(var.broker_security_group_ids) > 0
    error_message = "Provide at least one security group ID for the brokers."
  }
}

# Cluster sizing
variable "msk_instance_type" {
  description = "MSK broker instance type"
  type        = string
  default     = "kafka.t3.small"
}

variable "msk_broker_count" {
  description = "Number of MSK brokers"
  type        = number
  default     = 3
}

variable "msk_ebs_volume_size" {
  description = "EBS volume size per broker in GB"
  type        = number
  default     = 10
}

variable "msk_kafka_version" {
  description = "Apache Kafka version for the cluster"
  type        = string
  default     = "3.6.0"
}

variable "msk_kms_key_arn" {
  description = "Optional custom KMS key ARN for MSK encryption at rest"
  type        = string
  default     = ""
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention for broker logs"
  type        = number
  default     = 7
}
