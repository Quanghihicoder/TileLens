output "cdn_domains" {
  value = {
    for k, v in aws_cloudfront_distribution.cdn :
    k => {
      domain_name    = v.domain_name
      hosted_zone_id = v.hosted_zone_id
    }
  }
}
