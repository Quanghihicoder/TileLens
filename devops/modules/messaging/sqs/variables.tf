variable "queues" {
  description = "Map of SQS queues configurations"
  type = map(object({
    name               = string
    visibility_timeout = number
  }))
}
