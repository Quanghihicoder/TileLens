variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "app_buckets" {
  description = "Map of S3 App bucket configurations"
  type = map(object({
    name            = string
    domain          = string
    origin_id       = string
    oac_name        = string
    oac_description = string
  }))
}

variable "logs_buckets" {
  description = "Map of S3 Logs bucket configurations"
  type = map(object({
    name = string
  }))
}

variable "region_id" {
  description = "ID of the region"
  type        = string
}
