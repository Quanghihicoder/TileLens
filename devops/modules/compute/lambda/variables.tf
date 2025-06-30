variable "lambda_exec_role_arn" {
  description = "ARN of lambda execution role"
  type        = string
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

variable "tiling_lambda_timeout" {
  type = number
}

variable "clipping_lambda_timeout" {
  type = number
}

variable "blending_lambda_timeout" {
  type = number
}

variable "assets_bucket_name" {
  description = "Name of S3 assets bucket"
  type        = string
}

variable "images_dynamodb_table_name" {
  description = "Name of the images dynamodb table"
  type        = string
}

variable "clipping_queue_arn" {
  description = "The ARN of the clipping image queue"
  type        = string
}

variable "tiling_queue_arn" {
  description = "The ARN of the tiling image queue"
  type        = string
}

variable "blending_queue_arn" {
  description = "The ARN of the tiling image queue"
  type        = string
}

variable "tiling_queue_url" {
  description = "The URL of the tiling image queue"
  type        = string
}
