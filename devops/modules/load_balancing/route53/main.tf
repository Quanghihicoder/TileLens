resource "aws_route53_record" "dns" {
  for_each = var.app_buckets

  zone_id = var.hosted_zone_id
  name    = each.value.domain
  type    = "A"

  alias {
    name                   = var.cdn_domains[each.key].domain_name
    zone_id                = var.cdn_domains[each.key].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api_tilelens" {
  zone_id = var.hosted_zone_id
  name    = var.backend_domain
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}


