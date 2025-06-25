terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

######################
# Locals and Settings
######################

locals {
  s3_buckets = {
    frontend = {
      name            = "tilelens-frontend"
      domain          = "tilelens.quangtechnologies.com"
      origin_id       = "tilelensfrontendS3Origin"
      oac_name        = "tilelens-frontend-oac"
      oac_description = "OAC for TileLens Frontend"
    }
    assets = {
      name            = "tilelens-assets"
      domain          = "assets.tilelens.quangtechnologies.com"
      origin_id       = "tilelensassetsS3Origin"
      oac_name        = "tilelens-assets-oac"
      oac_description = "OAC for TileLens Assets"
    }
  }
}

####################
# S3 Buckets Config
####################

# Create buckets with website hosting and public access policy
resource "aws_s3_bucket" "buckets" {
  for_each      = local.s3_buckets
  bucket        = each.value.name
  force_destroy = true
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "public_policy" {
  for_each   = aws_s3_bucket.buckets
  depends_on = [aws_s3_bucket_public_access_block.public_access]

  bucket = each.value.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.buckets[each.key].arn}/*"
    }]
  })
}

# Only apply website config to frontend
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.buckets["frontend"].id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

##########################
# CloudFront Distributions
##########################

# Route53 Zone
data "aws_route53_zone" "main" {
  zone_id = var.hosted_zone_id
}

# Origin Access Control
resource "aws_cloudfront_origin_access_control" "oac" {
  for_each = local.s3_buckets

  name                              = each.value.oac_name
  description                       = each.value.oac_description
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distributions
resource "aws_cloudfront_distribution" "cdn" {
  for_each = local.s3_buckets

  origin {
    domain_name              = aws_s3_bucket.buckets[each.key].bucket_regional_domain_name
    origin_id                = each.value.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.oac[each.key].id
  }

  enabled         = true
  is_ipv6_enabled = true

  default_root_object = each.key == "frontend" ? "index.html" : null

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = each.value.origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  dynamic "custom_error_response" {
    for_each = each.key == "frontend" ? [403, 404] : []
    content {
      error_code         = custom_error_response.value
      response_code      = 200
      response_page_path = "/index.html"
    }
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = [each.value.domain]

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

#####################
# DNS Records
#####################

resource "aws_route53_record" "dns" {
  for_each = local.s3_buckets

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn[each.key].domain_name
    zone_id                = aws_cloudfront_distribution.cdn[each.key].hosted_zone_id
    evaluate_target_health = false
  }
}

#####################
# DynamoDB
#####################

resource "aws_dynamodb_table" "images_data" {
  name         = "images"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "tilelens-dynamodb"
  }
}

#####################
# VPC
#####################

resource "aws_subnet" "public_a" {
  vpc_id                  = var.vpc_id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = var.aza
  map_public_ip_on_launch = true

  tags = {
    Name = "tilelens-public-subnet"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = var.vpc_id
  cidr_block              = "10.0.5.0/24"
  availability_zone       = var.azb
  map_public_ip_on_launch = true

  tags = {
    Name = "tilelens-public-subnet"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = var.vpc_id
  cidr_block        = "10.0.3.0/24"
  availability_zone = var.aza

  tags = {
    Name = "tilelens-private-subnet"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = var.vpc_id
  cidr_block        = "10.0.4.0/24"
  availability_zone = var.azb

  tags = {
    Name = "tilelens-private-subnet"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = var.public_route_table_id
}


#####################
# Security groups
#####################


# Security group for RDS
resource "aws_security_group" "rds_sg" {
  name        = "tilelens-rds-sg"
  description = "Allow MySQL access from Tilelens ECS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tilelens-rds-sg"
  }
}

# Security group for ECS (allow all outbound)
resource "aws_security_group" "ecs_sg" {
  name        = "tilelens-ecs-ec2-sg"
  description = "SG for ECS EC2"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    cidr_blocks     = ["0.0.0.0/0"]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
    cidr_blocks     = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tilelens-ecs-ec2-sg"
  }
}

# Subnet group for RDS 
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "tilelens-rds-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "tilelens-rds-subnet-group"
  }
}

#####################
# RDS
#####################

resource "aws_db_instance" "tilelens_mysql" {
  identifier             = "tilelens-mysqldb"
  db_name                = "tilelens"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  username               = var.db_username
  password               = var.db_password
  allocated_storage      = 20
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  skip_final_snapshot = true
  publicly_accessible = false

  tags = {
    Name = "tilelens-mysqldb"
  }
}

#####################
# SQS
#####################

resource "aws_sqs_queue" "tiling_queue" {
  name = "tiling-queue"

  visibility_timeout_seconds = 65
}

resource "aws_sqs_queue" "clipping_queue" {
  name = "clipping-queue"

  visibility_timeout_seconds = 65
}

#####################
# IAM
#####################

resource "aws_iam_role" "lambda_exec" {
  name = "lambda-sqs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_exec_permissions" {
  name = "lambda-exec-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "${aws_sqs_queue.clipping_queue.arn}",
          "${aws_sqs_queue.tiling_queue.arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "${aws_s3_bucket.buckets["assets"].arn}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.buckets["assets"].arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "${aws_dynamodb_table.images_data.arn}"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "lambda_policy" {
  name       = "lambda-sqs-policy-attachment"
  roles      = [aws_iam_role.lambda_exec.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_attach_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_exec_permissions.arn
}

#####################
# Lambda
#####################

resource "aws_lambda_function" "tiling_lambda" {
  function_name    = "tiling-lambda"
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_exec.arn
  filename         = "${path.module}/build/tiling_lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/build/tiling_lambda.zip")

  memory_size = 1024
  timeout     = 60

  environment {
    variables = {
      IMAGE_DIR   = "assets/images",
      TILE_DIR    = "assets/tiles",
      BUCKET_NAME = local.s3_buckets.assets.name
      TABLE_NAME  = aws_dynamodb_table.images_data.name
    }
  }
}

resource "aws_lambda_event_source_mapping" "tiling_lambda_trigger" {
  event_source_arn = aws_sqs_queue.tiling_queue.arn
  function_name    = aws_lambda_function.tiling_lambda.arn
  batch_size       = 10
  enabled          = true

  depends_on = [aws_iam_role_policy_attachment.lambda_attach_policy]
}

resource "aws_lambda_function" "clipping_lambda" {
  function_name    = "clipping-lambda"
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_exec.arn
  filename         = "${path.module}/build/clipping_lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/build/clipping_lambda.zip")

  memory_size = 1024
  timeout     = 60

  environment {
    variables = {
      IMAGE_DIR            = "assets/images",
      TILE_DIR             = "assets/tiles",
      BUCKET_NAME          = local.s3_buckets.assets.name
      TABLE_NAME           = aws_dynamodb_table.images_data.name
      SQS_TILING_QUEUE_URL = aws_sqs_queue.tiling_queue.url
    }
  }
}

resource "aws_lambda_event_source_mapping" "clipping_lambda_trigger" {
  event_source_arn = aws_sqs_queue.clipping_queue.arn
  function_name    = aws_lambda_function.clipping_lambda.arn
  batch_size       = 10
  enabled          = true

  depends_on = [aws_iam_role_policy_attachment.lambda_attach_policy]
}

#####################
# ECS
#####################

resource "aws_cloudwatch_log_group" "ecs_instance_logs" {
  name              = "/ecs/instance"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "ecs_task_logs" {
  name              = "/ecs/tilelens"
  retention_in_days = 7
}

resource "aws_ecs_cluster" "tilelens_ecs" {
  name = "tilelens"
}

resource "aws_iam_role" "tilelens_ecs_instance_role" {
  name = "tilelens-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement : [{
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_instance_profile" "tilelens_ecs_instance_profile" {
  name = "tilelens-instance-profile"
  role = aws_iam_role.tilelens_ecs_instance_role.name
}

resource "aws_iam_role_policy_attachment" "tilelens_ecs_instance_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
  role       = aws_iam_role.tilelens_ecs_instance_role.name
}

resource "aws_iam_role_policy_attachment" "ecs_instance_cloudwatch_policy" {
  role       = aws_iam_role.tilelens_ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
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
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.public_a.id
  iam_instance_profile        = aws_iam_instance_profile.tilelens_ecs_instance_profile.name
  associate_public_ip_address = true
  security_groups             = [aws_security_group.ecs_sg.id]
  key_name                    = var.key_name

  user_data = <<EOF
  #!/bin/bash
  echo ECS_CLUSTER=${aws_ecs_cluster.tilelens_ecs.name} >> /etc/ecs/ecs.config
  echo "ECS_AVAILABLE_LOGGING_DRIVERS=[\"json-file\",\"awslogs\"]" >> /etc/ecs/ecs.config
  EOF

  tags = {
    Name = "tilelens-ecs-ec2-instance"
  }
}


resource "aws_eip" "tilelens_eip" {
  instance = aws_instance.tilelens_ecs_ec2.id
  domain   = "vpc"
}

resource "aws_iam_role" "tilelens_ecs_task_exec_role" {
  name = "tilelens-ecs-task-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement : [{
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_policy" "tilelens_ecs_permissions" {
  name = "tilelens-ecs-task-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "SQSSend",
        Effect = "Allow",
        Action = ["sqs:SendMessage"],
        Resource = [
          "${aws_sqs_queue.clipping_queue.arn}",
          "${aws_sqs_queue.tiling_queue.arn}"
        ]
      },
      {
        Sid      = "S3Access",
        Effect   = "Allow",
        Action   = ["s3:GetObject", "s3:PutObject"],
        Resource = "${aws_s3_bucket.buckets["assets"].arn}/*"
      },
      {
        Sid : "DynamoDBAccess",
        Effect : "Allow",
        Action : ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Scan"],
        Resource : "${aws_dynamodb_table.images_data.arn}"
      },
      {
        Sid : "RDSAccessOptional",
        Effect : "Allow",
        Action : ["rds-db:connect"],
        Resource : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_attach_policy" {
  role       = aws_iam_role.tilelens_ecs_task_exec_role.name
  policy_arn = aws_iam_policy.tilelens_ecs_permissions.arn
}


resource "aws_ecs_task_definition" "tilelens_app_task" {
  family                   = "tilelens"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  cpu                      = "256"
  memory                   = "512"
  task_role_arn            = aws_iam_role.tilelens_ecs_task_exec_role.arn

  container_definitions = jsonencode([
    {
      name      = "tilelens",
      image     = var.ecs_image_url,
      essential = true,
      environment = [
        {
          name  = "DATABASE_URL",
          value = "mysql://${var.db_username}:${var.db_password}@${aws_db_instance.tilelens_mysql.address}:3306/tilelens"
        }
      ],
      portMappings = [{
        containerPort = 8000
        hostPort      = 80
      }],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = "/ecs/tilelens"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

#####################
# ECS
#####################

resource "aws_security_group" "alb_sg" {
  name        = "tilelens-alb-sg"
  description = "Allow HTTPS inbound traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_acm_certificate" "tilelens_cert" {
  domain_name       = "api.tilelens.quangtechnologies.com"
  validation_method = "DNS"

  tags = {
    Name = "tilelens-api-cert"
  }
}

locals {
  domain_validation_option = tolist(aws_acm_certificate.tilelens_cert.domain_validation_options)[0]
}

resource "aws_route53_record" "tilelens_cert_validation" {
  name    = local.domain_validation_option.resource_record_name
  type    = local.domain_validation_option.resource_record_type
  zone_id = var.hosted_zone_id
  records = [local.domain_validation_option.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "tilelens_cert_validation" {
  certificate_arn         = aws_acm_certificate.tilelens_cert.arn
  validation_record_fqdns = [aws_route53_record.tilelens_cert_validation.fqdn]
}


resource "aws_lb" "alb" {
  name               = "tilelens-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

# Target Group for ECS Service
resource "aws_lb_target_group" "tilelens_tg" {
  name     = "tilelens-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    interval            = 60
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.tilelens_cert_validation.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tilelens_tg.arn
  }
}

resource "aws_ecs_service" "tilelens_service" {
  name            = "tilelens-service"
  cluster         = aws_ecs_cluster.tilelens_ecs.id
  task_definition = aws_ecs_task_definition.tilelens_app_task.arn
  desired_count   = 1
  launch_type     = "EC2"

  load_balancer {
    target_group_arn = aws_lb_target_group.tilelens_tg.arn
    container_name   = "tilelens"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.https_listener]
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 4
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.tilelens_ecs.name}/${aws_ecs_service.tilelens_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_scale_up" {
  name               = "cpu-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# Route53 Record
resource "aws_route53_record" "api_tilelens" {
  zone_id = var.hosted_zone_id
  name    = "api.tilelens.quangtechnologies.com"
  type    = "A"

  alias {
    name                   = aws_lb.alb.dns_name
    zone_id                = aws_lb.alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_lb_target_group_attachment" "tilelens_tg_attachment" {
  target_group_arn = aws_lb_target_group.tilelens_tg.arn
  target_id        = aws_instance.tilelens_ecs_ec2.id
  port             = 80
}

