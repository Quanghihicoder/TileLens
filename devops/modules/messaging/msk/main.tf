resource "aws_msk_cluster" "cluster" {
  cluster_name           = "${var.project_name}-msk-cluster"
  kafka_version          = "2.8.1"
  number_of_broker_nodes = 2

  broker_node_group_info {
    instance_type = "kafka.t3.small"
    client_subnets = [
      var.private_subnet_a_id,
      var.private_subnet_b_id
    ]
    security_groups = [var.msk_sg_id]
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS_PLAINTEXT"
      in_cluster    = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled = false
      }
      s3 {
        enabled = false
      }
    }
  }
}
