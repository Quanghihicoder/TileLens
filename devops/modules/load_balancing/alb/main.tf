resource "aws_acm_certificate" "tilelens_cert" {
  domain_name       = var.backend_domain
  validation_method = "DNS"

  tags = {
    Name = "tilelens-api-cert"
  }
}

locals {
  domain_validation_option = tolist(aws_acm_certificate.tilelens_cert.domain_validation_options)[0]
}

resource "aws_route53_record" "tilelens_cert_validation" {
  name    = local.domain_validation_option.resource_record_name
  type    = local.domain_validation_option.resource_record_type
  zone_id = var.hosted_zone_id
  records = [local.domain_validation_option.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "tilelens_cert_validation" {
  certificate_arn         = aws_acm_certificate.tilelens_cert.arn
  validation_record_fqdns = [aws_route53_record.tilelens_cert_validation.fqdn]
}


resource "aws_lb" "alb" {
  name               = "tilelens-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = [var.public_subnet_a_id, var.public_subnet_b_id]

  access_logs {
    bucket  = var.alb_logs_bucket
    enabled = true
  }
}

# Target Group for ECS Service
resource "aws_lb_target_group" "tilelens_tg" {
  name     = "tilelens-tg"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.tilelens_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tilelens_tg.arn
  }
}
