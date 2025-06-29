resource "aws_sqs_queue" "queues" {
  for_each                   = var.queues
  name                       = each.value.name
  visibility_timeout_seconds = each.value.visibility_timeout
}

