resource "aws_ecs_cluster" "tilelens_ecs" {
  name = var.app_name
}

data "aws_ami" "ecs_ami" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
}

resource "aws_instance" "tilelens_ecs_ec2" {
  ami                         = data.aws_ami.ecs_ami.id
  instance_type               = var.instance_type # it is cheaper to use t3.small running 4 tasks than t3.micro but can only run 1 task which will need to add more ec2 instances
  subnet_id                   = var.public_subnet_a_id
  iam_instance_profile        = var.iam_instance_profile_name
  security_groups             = [var.ecs_sg_id]
  associate_public_ip_address = true

  user_data = <<EOF
  #!/bin/bash
  echo ECS_CLUSTER=${aws_ecs_cluster.tilelens_ecs.name} >> /etc/ecs/ecs.config
  echo "ECS_AVAILABLE_LOGGING_DRIVERS=[\"json-file\",\"awslogs\"]" >> /etc/ecs/ecs.config

  # Install CloudWatch Logs Agent (for Amazon Linux 2)
  yum update -y
  yum install -y awslogs

  # Configure CloudWatch Logs Agent
  cat <<EOT > /etc/awslogs/awslogs.conf
  [general]
  state_file = /var/lib/awslogs/agent-state  

  [/var/log/messages]
  file = /var/log/messages
  log_group_name = ${var.ecs_instance_logs_group_name}
  log_stream_name = {instance_id}/messages
  datetime_format = %b %d %H:%M:%S

  [/var/log/cloud-init-output.log]
  file = /var/log/cloud-init-output.log
  log_group_name = ${var.ecs_instance_logs_group_name}
  log_stream_name = {instance_id}/cloud-init-output
  datetime_format = %Y-%m-%d %H:%M:%S
  EOT

  # Set AWS region in config
  sed -i "s/region = .*/region = ${var.aws_region}/" /etc/awslogs/awscli.conf

  # Enable and start awslogs service
  systemctl enable awslogsd.service
  systemctl start awslogsd.service
  EOF

  tags = {
    Name = "tilelens-ecs-ec2-instance"
  }
}

resource "aws_eip" "tilelens_eip" {
  instance = aws_instance.tilelens_ecs_ec2.id
  domain   = "vpc"
}

resource "aws_ecs_task_definition" "tilelens_app_task" {
  family                   = "tilelens"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  cpu                      = "256"
  memory                   = "512"
  task_role_arn            = var.ecs_task_exec_role_arn

  container_definitions = jsonencode([
    {
      name      = "tilelens",
      image     = var.ecs_image_url,
      essential = true,
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "8000" },
        { name = "JWT_SECRET", value = "tilelens" },
        { name = "JWT_EXPIRES_IN", value = "3" },
        { name = "IMAGE_DIR", value = "assets/images" },
        { name = "TILE_DIR", value = "assets/tiles" },
        { name = "BUCKET_NAME", value = "${var.assets_bucket_name}" },
        { name = "TABLE_NAME", value = "${var.images_dynamodb_table_name}" },
        { name = "ALLOW_ORIGIN", value = "${var.frontend_url}" },
        {
          name  = "DATABASE_URL",
          value = "mysql://${var.db_username}:${var.db_password}@${var.mysqldb_address}:3306/${var.mysqldb_name}"
        },
        { name = "AWS_REGION", value = "${var.aws_region}" },
        {
          name  = "SQS_CLIPPING_QUEUE_URL",
          value = "${var.clipping_queue_url}"
        },
        {
          name  = "SQS_TILING_QUEUE_URL",
          value = "${var.tiling_queue_url}"
        },
        {
          name  = "SQS_BLENDING_QUEUE_URL",
          value = "${var.blending_queue_url}"
        }
      ],
      portMappings = [{
        containerPort = 8000
        hostPort      = 8000
      }],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = var.ecs_logs_group_name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "tilelens_service" {
  name            = "tilelens-service"
  cluster         = aws_ecs_cluster.tilelens_ecs.id
  task_definition = aws_ecs_task_definition.tilelens_app_task.arn
  desired_count   = 1
  launch_type     = "EC2"

  load_balancer {
    target_group_arn = var.alb_target_group_arn
    container_name   = "tilelens"
    container_port   = 8000
  }
}
