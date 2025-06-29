variable "clipping_queue_arn" {
  description = "The ARN of the clipping image queue"
  type        = string
}

variable "tiling_queue_arn" {
  description = "The ARN of the tiling image queue"
  type        = string
}

variable "assets_bucket_arn" {
  description = "The ARN of the assets bucket"
  type        = string
}

variable "images_dynamodb_table_arn" {
  description = "The ARN of the dynamodb table"
  type        = string
}
