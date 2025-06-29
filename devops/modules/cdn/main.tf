data "aws_route53_zone" "main" {
  zone_id = var.hosted_zone_id
}

resource "aws_cloudfront_origin_access_control" "oac" {
  for_each = var.app_buckets

  name                              = each.value.oac_name
  description                       = each.value.oac_description
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "cdn" {
  for_each = var.app_buckets

  origin {
    domain_name              = var.app_bucket_regional_domain_names[each.key]
    origin_id                = each.value.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.oac[each.key].id
  }

  enabled         = true
  is_ipv6_enabled = true

  default_root_object = each.key == "frontend" ? "index.html" : null

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = each.value.origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  dynamic "custom_error_response" {
    for_each = each.key == "frontend" ? [403, 404] : []
    content {
      error_code         = custom_error_response.value
      response_code      = 200
      response_page_path = "/index.html"
    }
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = [each.value.domain]

  viewer_certificate {
    acm_certificate_arn      = var.cloudfront_acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
