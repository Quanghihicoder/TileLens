variable "key_name" {
  description = "SSH key pair name for EC2 instance access"
  type        = string
}

variable "github_token" {
  description = "Token for GitHub authentication"
  type        = string
}

variable "hosted_zone_id" {
  description = "ID of the hosted zone"
  type        = string
}

variable "acm_certificate_arn" {
  description = "Certificate for the domain"
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
  description = "ID of the VPC"
  type        = string
}

variable "aza" {
  description = "Availability Zone A"
  type        = string
}

variable "azb" {
  description = "Availability Zone B"
  type        = string
}

variable "ecs_image_url" {
  description = "Container Image URL"
  type        = string

}

variable "public_route_table_id" {
  description = "ID of the route table"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
