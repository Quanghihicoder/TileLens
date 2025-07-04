variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "github_url" {
  type    = string
  default = "https://github.com/Quanghihicoder/TileLens.git"
}

variable "github_token" {
  description = "AWS Secrets Manager ARN or plaintext (not recommended)"
  type        = string
}

variable "github_fullrepository" {
  type    = string
  default = "Quanghihicoder/TileLens"
}

variable "frontend_bucket_arn" {
  type = string
}

variable "frontend_bucket_name" {
  type = string
}

variable "tiling_lambda_name" {
  type = string
}

variable "clipping_lambda_name" {
  type = string
}

variable "blending_lambda_name" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}
