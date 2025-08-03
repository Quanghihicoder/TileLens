variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "tables" {
  description = "Map of DynamoDB tables configurations"
  type = map(object({
    name = string
  }))
}
