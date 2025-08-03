variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "aws_region" {
  type = string
}

variable "instance_type" {
  description = "The instance type of the EC2 instance running the ECS container"
  type        = string
  default     = "t3.micro"
}

variable "public_subnet_a_id" {
  description = "ID of the public subnet A"
  type        = string
}

variable "backend_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  type        = string
}

variable "backend_sg_id" {
  description = "ID of the ECS security group"
  type        = string
}

variable "backend_task_exec_role_arn" {
  description = "ARN of the ECS take execution"
  type        = string
}

variable "backend_image_url" {
  description = "ECS image URL"
  type        = string
}

variable "assets_bucket_name" {
  description = "Name of S3 assets bucket"
  type        = string
}

variable "images_dynamodb_table_name" {
  description = "Name of the images dynamodb table"
  type        = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type = string
}

variable "mysqldb_name" {
  description = "Name of the RDS MySQL database"
  type        = string
}

variable "mysqldb_address" {
  description = "Address of the RDS MySQL database"
  type        = string
}

variable "clipping_queue_url" {
  description = "The URL of the clipping image queue"
  type        = string
}

variable "tiling_queue_url" {
  description = "The URL of the tiling image queue"
  type        = string
}

variable "blending_queue_url" {
  description = "The URL of the blending image queue"
  type        = string
}

variable "backend_logs_group_name" {
  description = "Log group name of the ecs task"
  type        = string
}

variable "frontend_url" {
  description = "URL of the frontend"
  type        = string
}

variable "alb_target_group_arn" {
  description = "aws_lb_target_group.tilelens_tg.arn"
  type        = string
}

