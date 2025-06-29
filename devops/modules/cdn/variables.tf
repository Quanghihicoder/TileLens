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

variable "app_bucket_regional_domain_names" {
  description = "Regional domain name of buckets"
  type        = map(string)
}

variable "cloudfront_acm_certificate_arn" {
  description = "Certificate for cloudfront"
  type        = string
}
