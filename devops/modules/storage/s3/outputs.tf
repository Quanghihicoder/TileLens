output "assets_bucket_arn" {
  value = aws_s3_bucket.app_buckets["assets"].arn
}

output "assets_bucket_name" {
  value = aws_s3_bucket.app_buckets["assets"].name
}

output "frontend_bucket_arn" {
  value = aws_s3_bucket.app_buckets["frontend"].arn
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.app_buckets["frontend"].name
}

output "alb_logs_bucket" {
  value = aws_s3_bucket.logs_buckets["alb"].bucket
}

output "alb_logs_bucket_name" {
  value = aws_s3_bucket.logs_buckets["alb"].name
}

output "app_bucket_regional_domain_names" {
  value = { for k, v in aws_s3_bucket.app_buckets : k => v.bucket_regional_domain_name }
}




