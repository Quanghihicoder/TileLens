output "images_dynamodb_table_arn" {
  value = aws_dynamodb_table.tables["images"].arn
}

output "images_dynamodb_table_name" {
  value = aws_dynamodb_table.tables["images"].name
}
