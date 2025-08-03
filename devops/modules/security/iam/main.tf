# Lambda exec role

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-sqs-role"

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
  name = "${var.project_name}-lambda-exec-permissions"

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
          "${var.clipping_queue_arn}",
          "${var.tiling_queue_arn}",
          "${var.blending_queue_arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "${var.assets_bucket_arn}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${var.assets_bucket_arn}/*"
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
        Resource = "${var.images_dynamodb_table_arn}"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "lambda_policy" {
  name       = "${var.project_name}-lambda-sqs-policy-attachment"
  roles      = [aws_iam_role.lambda_exec.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_attach_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_exec_permissions.arn
}


# ECS EC2 instance role

resource "aws_iam_role" "backend_instance_role" {
  name = "${var.project_name}-backend-instance-role"

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

resource "aws_iam_instance_profile" "backend_instance_profile" {
  name = "${var.project_name}-backend-instance-profile"
  role = aws_iam_role.backend_instance_role.name
}

resource "aws_iam_role_policy_attachment" "backend_instance_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
  role       = aws_iam_role.backend_instance_role.name
}

resource "aws_iam_role_policy_attachment" "backend_instance_cloudwatch_policy" {
  role       = aws_iam_role.backend_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ECS task exec role

resource "aws_iam_role" "backend_task_exec_role" {
  name = "${var.project_name}-backend-task-exec-role"

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

resource "aws_iam_policy" "backend_task_permissions" {
  name = "${var.project_name}-backend-task-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "SQSSend",
        Effect = "Allow",
        Action = ["sqs:SendMessage"],
        Resource = [
          "${var.clipping_queue_arn}",
          "${var.tiling_queue_arn}",
          "${var.blending_queue_arn}"
        ]
      },
      {
        Sid      = "S3Access",
        Effect   = "Allow",
        Action   = ["s3:GetObject", "s3:PutObject"],
        Resource = "${var.assets_bucket_arn}/*"
      },
      {
        Sid : "DynamoDBAccess",
        Effect : "Allow",
        Action : ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Scan"],
        Resource : "${var.images_dynamodb_table_arn}"
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

resource "aws_iam_role_policy_attachment" "backend_task_attach_policy" {
  role       = aws_iam_role.backend_task_exec_role.name
  policy_arn = aws_iam_policy.backend_task_permissions.arn
}
