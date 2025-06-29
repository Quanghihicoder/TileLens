variable "hosted_zone_id" {
  description = "ID of the domain hosted zone"
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

variable "cdn_domains" {
  type = map(object({
    domain_name    = string
    hosted_zone_id = string
  }))
}

variable "alb_dns_name" {
  type = string
}

variable "alb_zone_id" {
  type = string
}

variable "backend_domain" {
  type = string
}
