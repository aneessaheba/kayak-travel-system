output "msk_cluster_arn" {
  description = "MSK cluster ARN"
  value       = aws_msk_cluster.this.arn
}

output "msk_cluster_name" {
  description = "MSK cluster name"
  value       = aws_msk_cluster.this.cluster_name
}

output "msk_bootstrap_brokers_sasl_iam" {
  description = "Bootstrap brokers string for IAM-authenticated clients"
  value       = aws_msk_cluster.this.bootstrap_brokers_sasl_iam
  sensitive   = true
}

output "msk_zookeeper_connect_string" {
  description = "Zookeeper connect string"
  value       = aws_msk_cluster.this.zookeeper_connect_string
  sensitive   = true
}

output "msk_log_group_name" {
  description = "CloudWatch log group used for broker logs"
  value       = aws_cloudwatch_log_group.msk.name
}
