# App
variable "project_name" {
  description = "Name of the project"
  type        = string
  default = "tilelens"
}

#  Region 
variable "aws_region" {
  description = "AWS region"
  type        = string
  default = "ap-southeast-2"
}
variable "region_id" {
  description = "ID of the AWS Region"
  type        = string
  default = "783225319266"
}

variable "aza" {
  description = "Availability Zone A of the AWS region"
  type        = string
  default = "ap-southeast-2a"
}

variable "azb" {
  description = "Availability Zone B of the AWS region"
  type        = string
  default = "ap-southeast-2b"
}

# CDN
variable "hosted_zone_id" {
  description = "ID of the existing hosted zone"
  type        = string
}

variable "cloudfront_acm_certificate_arn" {
  description = "ARN of the existing cloudfront certificate for the domain (it must be in us-east-1)"
  type        = string
}

# DB
variable "db_username" {
  description = "Username for RDS MySQL Database"
  type        = string
}

variable "db_password" {
  description = "Password for RDS MySQL Database"
  type        = string
}

# Images
variable "backend_image_url" {
  description = "Container Image URL in ECR"
  type        = string
}

variable "transcriber_image_url" {
  description = "Container Image URL in ECR"
  type        = string
}




