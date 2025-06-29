variable "tables" {
  description = "Map of DynamoDB tables configurations"
  type = map(object({
    name = string
  }))
}
