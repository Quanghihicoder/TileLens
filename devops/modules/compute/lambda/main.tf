resource "aws_lambda_function" "tiling_lambda" {
  function_name    = "${var.project_name}-${var.tiling_lambda_name}"
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "${path.module}/build/tiling_lambda.zip"
  source_code_hash = fileexists("${path.module}/build/tiling_lambda.zip") ? filebase64sha256("${path.module}/build/tiling_lambda.zip") : null

  memory_size = 2048
  timeout     = var.tiling_lambda_timeout

  environment {
    variables = {
      IMAGE_DIR   = "assets/images",
      TILE_DIR    = "assets/tiles",
      BUCKET_NAME = var.assets_bucket_name
      TABLE_NAME  = var.images_dynamodb_table_name
    }
  }
}

resource "aws_lambda_event_source_mapping" "tiling_lambda_trigger" {
  event_source_arn = var.tiling_queue_arn 
  function_name    = aws_lambda_function.tiling_lambda.arn
  batch_size       = 10
  enabled          = true
}

resource "aws_lambda_function" "clipping_lambda" {
  function_name    = "${var.project_name}-${var.clipping_lambda_name}"
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "${path.module}/build/clipping_lambda.zip"
  source_code_hash = fileexists("${path.module}/build/clipping_lambda.zip") ? filebase64sha256("${path.module}/build/clipping_lambda.zip") : null

  memory_size = 1024
  timeout     = var.clipping_lambda_timeout

  environment {
    variables = {
      IMAGE_DIR            = "assets/images",
      TILE_DIR             = "assets/tiles",
      BUCKET_NAME          = var.assets_bucket_name
      TABLE_NAME           = var.images_dynamodb_table_name
      SQS_TILING_QUEUE_URL = var.tiling_queue_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "clipping_lambda_trigger" {
  event_source_arn = var.clipping_queue_arn
  function_name    = aws_lambda_function.clipping_lambda.arn
  batch_size       = 10
  enabled          = true
}


resource "aws_lambda_function" "blending_lambda" {
  function_name    = "${var.project_name}-${var.blending_lambda_name}"
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = var.lambda_exec_role_arn
  filename         = "${path.module}/build/blending_lambda.zip"
  source_code_hash = fileexists("${path.module}/build/blending_lambda.zip") ? filebase64sha256("${path.module}/build/blending_lambda.zip") : null


  memory_size = 2048
  timeout     = var.blending_lambda_timeout

  environment {
    variables = {
      IMAGE_DIR            = "assets/images",
      TILE_DIR             = "assets/tiles",
      BUCKET_NAME          = var.assets_bucket_name
      TABLE_NAME           = var.images_dynamodb_table_name
      SQS_TILING_QUEUE_URL = var.tiling_queue_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "blending_lambda_trigger" {
  event_source_arn = var.blending_queue_arn
  function_name    = aws_lambda_function.blending_lambda.arn
  batch_size       = 10
  enabled          = true
}


resource "aws_lambda_function" "msk_topic_creator_lambda" {
  function_name    = "${var.project_name}-${var.msk_topic_creator_lambda_name}"
  handler          = "handler.handler"
  runtime          = "python3.10"
  role             = var.lambda_exec_role_arn
  filename         = "${path.module}/build/msk_topic_creator_lambda.zip"
  source_code_hash = fileexists("${path.module}/build/msk_topic_creator_lambda.zip") ? filebase64sha256("${path.module}/build/msk_topic_creator_lambda.zip") : null

  memory_size = 1024
  timeout     = var.msk_topic_creator_lambda_timeout

  environment {
    variables = {
      MSK_BROKERS = var.msk_bootstrap_brokers
    }
  }

  vpc_config {
    subnet_ids         = [var.private_subnet_a_id, var.private_subnet_b_id]
    security_group_ids = [var.lambda_msk_sg_id]
  }
}
