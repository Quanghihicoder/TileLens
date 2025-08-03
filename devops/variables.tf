variable "project_name" {
  description = "Name of the project"
  type        = string
  default = "tilelens"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
variable "region_id" {
  description = "ID of the AWS Region"
  type        = string
}
variable "hosted_zone_id" {
  description = "ID of the existing hosted zone"
  type        = string
}
variable "acm_certificate_arn" {
  description = "ARN of the existing cloudfront certificate for the domain (it must be in us-east-1)"
  type        = string
}

variable "db_username" {
  description = "Username for RDS MySQL Database"
  type        = string
}

variable "db_password" {
  description = "Password for RDS MySQL Database"
  type        = string
}

variable "vpc_id" {
  description = "ID of existing the VPC"
  type        = string
}

variable "aza" {
  description = "Availability Zone A of the AWS region"
  type        = string
}

variable "azb" {
  description = "Availability Zone B of the AWS region"
  type        = string
}

variable "public_route_table_id" {
  description = "ID of the existing public route table"
  type        = string
}

variable "backend_image_url" {
  description = "Container Image URL in ECR"
  type        = string
}




