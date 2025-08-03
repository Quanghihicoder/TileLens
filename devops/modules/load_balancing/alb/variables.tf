variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "hosted_zone_id" {
  description = "ID of the domain hosted zone"
  type        = string
}

variable "alb_sg_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "public_subnet_a_id" {
  description = "ID of the public subnet A"
  type        = string
}

variable "public_subnet_b_id" {
  description = "ID of the public subnet B"
  type        = string
}

variable "alb_logs_bucket" {
  description = "Bucket for alb logs"
  type        = string
}

variable "backend_domain" {
  description = "URL of the backend"
  type        = string
}
