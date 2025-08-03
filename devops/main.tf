terraform {

  backend "s3" {
    bucket         = "tilelens-terraform"
    key            = "terraform/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "tilelens-terraform-lock"
    encrypt        = true
  }

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
  app_name = var.project_name

  backend_domain = "api.${var.project_name}.quangtechnologies.com"

  app_buckets = {
    frontend = {
      name            = "frontend"
      domain          = "${var.project_name}.quangtechnologies.com"
      origin_id       = "frontendS3Origin"
      oac_name        = "frontend-oac"
      oac_description = "OAC for TileLens Frontend"
    }
    assets = {
      name            = "assets"
      domain          = "assets.${var.project_name}.quangtechnologies.com"
      origin_id       = "assetsS3Origin"
      oac_name        = "assets-oac"
      oac_description = "OAC for TileLens Assets"
    }
  }
  logs_buckets = {
    alb = {
      name = "alb-logs"
    }
  }

  dynamodb_tables = {
    images = {
      name = "images"
    }
  }

  sqs_queues = {
    tiling_queue = {
      name               = "tiling-queue"
      visibility_timeout = 305 # 5 minutes + 5 seconds
    }
    clipping_queue = {
      name               = "clipping-queue"
      visibility_timeout = 125 # 2 minutes + 5 seconds
    }

    blending_queue = {
      name               = "blending-queue"
      visibility_timeout = 125 # 2 minutes + 5 seconds
    }
  }

  lambdas = {
    tiling_lambda = {
      name    = "tiling-lambda"
      timeout = 300 # 5 minutes
    }
    clipping_lambda = {
      name    = "clipping-lambda"
      timeout = 120 # 2 minutes
    }
    blending_lambda = {
      name    = "blending-lambda"
      timeout = 120 # 2 minutes
    }
  }

  rds_mysqldb_name = var.project_name

}

module "s3" {
  source = "./modules/storage/s3"

  project_name = var.project_name
  app_buckets  = local.app_buckets
  logs_buckets = local.logs_buckets
  region_id    = var.region_id
}

module "dynamodb" {
  source = "./modules/storage/dynamodb"

  project_name = var.project_name
  tables       = local.dynamodb_tables
}

module "sqs" {
  source       = "./modules/messaging/sqs"
  project_name = var.project_name
  queues       = local.sqs_queues
}

module "iam" {
  source = "./modules/security/iam"

  project_name              = var.project_name
  clipping_queue_arn        = module.sqs.clipping_queue_arn
  tiling_queue_arn          = module.sqs.tiling_queue_arn
  blending_queue_arn        = module.sqs.blending_queue_arn
  assets_bucket_arn         = module.s3.assets_bucket_arn
  images_dynamodb_table_arn = module.dynamodb.images_dynamodb_table_arn
}

module "networking" {
  source = "./modules/networking"

  project_name          = var.project_name
  az_a                  = var.aza
  az_b                  = var.azb
}

module "security_groups" {
  source = "./modules/security/security_groups"

  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
}

module "logs" {
  source = "./modules/logs"

  project_name = var.project_name
}

module "lambda" {
  source = "./modules/compute/lambda"

  project_name               = var.project_name
  lambda_exec_role_arn       = module.iam.lambda_exec_role_arn
  tiling_lambda_name         = local.lambdas.tiling_lambda.name
  clipping_lambda_name       = local.lambdas.clipping_lambda.name
  blending_lambda_name       = local.lambdas.blending_lambda.name
  tiling_lambda_timeout      = local.lambdas.tiling_lambda.timeout
  clipping_lambda_timeout    = local.lambdas.clipping_lambda.timeout
  blending_lambda_timeout    = local.lambdas.blending_lambda.timeout
  assets_bucket_name         = module.s3.assets_bucket_name
  images_dynamodb_table_name = module.dynamodb.images_dynamodb_table_name
  clipping_queue_arn         = module.sqs.clipping_queue_arn
  tiling_queue_arn           = module.sqs.tiling_queue_arn
  blending_queue_arn         = module.sqs.blending_queue_arn
  tiling_queue_url           = module.sqs.tiling_queue_url
}

module "rds" {
  source = "./modules/compute/rds"

  project_name          = var.project_name
  db_username           = var.db_username
  db_password           = var.db_password
  mysqldb_name          = local.rds_mysqldb_name
  rds_subnet_group_name = module.networking.rds_subnet_group_name
  rds_sg_id             = module.security_groups.rds_sg_id
}

module "alb" {
  source = "./modules/load_balancing/alb"

  project_name       = var.project_name
  vpc_id             = module.networking.vpc_id
  hosted_zone_id     = var.hosted_zone_id
  alb_sg_id          = module.security_groups.alb_sg_id
  public_subnet_a_id = module.networking.public_subnet_a_id
  public_subnet_b_id = module.networking.public_subnet_b_id
  alb_logs_bucket    = module.s3.alb_logs_bucket_name
  backend_domain     = local.backend_domain
}

module "ecs" {
  source = "./modules/compute/ecs"

  project_name                  = var.project_name
  public_subnet_a_id            = module.networking.public_subnet_a_id
  backend_instance_profile_name = module.iam.backend_instance_profile_name
  backend_sg_id                 = module.security_groups.backend_sg_id
  backend_task_exec_role_arn    = module.iam.backend_task_exec_role_arn
  backend_image_url             = var.backend_image_url
  assets_bucket_name            = module.s3.assets_bucket_name
  images_dynamodb_table_name    = module.dynamodb.images_dynamodb_table_name
  db_username                   = var.db_username
  db_password                   = var.db_password
  mysqldb_name                  = local.rds_mysqldb_name
  mysqldb_address               = module.rds.mysqldb_address
  aws_region                    = var.aws_region
  clipping_queue_url            = module.sqs.clipping_queue_url
  tiling_queue_url              = module.sqs.tiling_queue_url
  blending_queue_url            = module.sqs.blending_queue_url
  backend_logs_group_name       = module.logs.backend_logs_group_name
  frontend_url                  = "https://${local.app_buckets.frontend.domain}"
  alb_target_group_arn          = module.alb.alb_target_group_arn
}

module "auto_scaling" {
  source = "./modules/auto_scaling"

  project_name             = var.project_name
  backend_ecs_cluster_name = module.ecs.backend_ecs_cluster_name
  backend_ecs_service_name = module.ecs.backend_ecs_service_name

  depends_on = [module.ecs]
}

module "cdn" {
  source = "./modules/cdn"

  project_name                     = var.project_name
  hosted_zone_id                   = var.hosted_zone_id
  app_buckets                      = local.app_buckets
  app_bucket_regional_domain_names = module.s3.app_bucket_regional_domain_names
  cloudfront_acm_certificate_arn   = var.cloudfront_acm_certificate_arn
}

module "route53" {
  source = "./modules/load_balancing/route53"

  hosted_zone_id = var.hosted_zone_id
  app_buckets    = local.app_buckets
  cdn_domains    = module.cdn.cdn_domains
  alb_dns_name   = module.alb.alb_dns_name
  alb_zone_id    = module.alb.alb_zone_id
  backend_domain = local.backend_domain

  depends_on = [module.cdn, module.alb]
}

module "pipeline" {
  source = "./modules/pipeline"

  project_name         = var.project_name
  aws_region           = var.aws_region
  frontend_bucket_arn  = module.s3.frontend_bucket_arn
  frontend_bucket_name = module.s3.frontend_bucket_name
  tiling_lambda_name   = module.lambda.tiling_lambda_name
  clipping_lambda_name = module.lambda.clipping_lambda_name
  blending_lambda_name = module.lambda.blending_lambda_name
  backend_ecs_cluster_name     = module.ecs.backend_ecs_cluster_name
  backend_ecs_service_name     = module.ecs.backend_ecs_service_name
}
