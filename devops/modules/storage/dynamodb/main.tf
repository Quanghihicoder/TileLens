resource "aws_dynamodb_table" "tables" {
  for_each = var.tables

  name         = "${var.project_name}-${each.value.name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
