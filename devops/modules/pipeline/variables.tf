variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "github_url" {
  type    = string
  default = "https://github.com/Quanghihicoder/TileLens.git"
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

variable "backend_ecs_cluster_name" {
  type = string
}

variable "backend_ecs_service_name" {
  type = string
}
