resource "aws_s3_bucket" "app_buckets" {
  for_each      = var.app_buckets
  bucket        = "${var.project_name}-${each.value.name}"
  force_destroy = true
}

resource "aws_s3_bucket" "logs_buckets" {
  for_each      = var.logs_buckets
  bucket        = "${var.project_name}-${each.value.name}"
  force_destroy = true
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  for_each = merge(
    aws_s3_bucket.app_buckets,
    aws_s3_bucket.logs_buckets
  )

  bucket = each.value.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "app_buckets_public_access" {
  for_each = aws_s3_bucket.app_buckets

  bucket = each.value.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_public_access_block" "logs_buckets_public_access" {
  for_each = aws_s3_bucket.logs_buckets

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "assets_bucket_cors" {
  bucket = aws_s3_bucket.app_buckets["assets"].id

  cors_rule {
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
  }
}

resource "aws_s3_bucket_policy" "app_buckets_public_policy" {
  for_each = aws_s3_bucket.app_buckets

  bucket = each.value.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = "*",
      Action    = "s3:GetObject",
      Resource  = "${aws_s3_bucket.app_buckets[each.key].arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_buckets_public_access]
}

resource "aws_s3_bucket_policy" "logs_buckets_public_policy" {
  for_each = aws_s3_bucket.logs_buckets

  bucket = each.value.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        AWS = "arn:aws:iam::${var.region_id}:root"
      }
      Action   = "s3:PutObject",
      Resource = "${aws_s3_bucket.logs_buckets[each.key].arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.logs_buckets_public_access]
}

# Only apply website config to frontend
resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.app_buckets["frontend"].id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}
