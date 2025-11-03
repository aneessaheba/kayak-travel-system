locals {
  name_prefix = "${var.project}-${var.environment}"
}

resource "aws_cloudwatch_log_group" "msk" {
  name              = "/aws/msk/${local.name_prefix}"
  retention_in_days = var.log_retention_in_days

  tags = {
    Name = "${local.name_prefix}-msk"
  }
}

resource "aws_msk_cluster" "this" {
  cluster_name           = local.name_prefix
  kafka_version          = var.msk_kafka_version
  number_of_broker_nodes = var.msk_broker_count

  broker_node_group_info {
    instance_type   = var.msk_instance_type
    client_subnets  = var.broker_subnet_ids
    security_groups = var.broker_security_group_ids

    storage_info {
      ebs_storage_info {
        volume_size = var.msk_ebs_volume_size
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }

    encryption_at_rest_kms_key_arn = var.msk_kms_key_arn != "" ? var.msk_kms_key_arn : null
  }

  client_authentication {
    sasl {
      iam = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
    }
  }

  tags = {
    Name = "${local.name_prefix}-msk"
  }
}
