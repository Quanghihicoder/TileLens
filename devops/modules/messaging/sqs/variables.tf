variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "queues" {
  description = "Map of SQS queues configurations"
  type = map(object({
    name               = string
    visibility_timeout = number
  }))
}
