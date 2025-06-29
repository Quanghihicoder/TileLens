output "clipping_queue_url" {
  value = aws_sqs_queue.queues["clipping_queue"].url
}

output "tiling_queue_url" {
  value = aws_sqs_queue.queues["tiling_queue"].url
}

output "clipping_queue_arn" {
  value = aws_sqs_queue.queues["clipping_queue"].arn
}

output "tiling_queue_arn" {
  value = aws_sqs_queue.queues["tiling_queue"].arn
}
