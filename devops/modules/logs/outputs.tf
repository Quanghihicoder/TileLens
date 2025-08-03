output "backend_logs_group_name" {
  value = aws_cloudwatch_log_group.backend_task_logs.name
}

output "transcriber_logs_group_name" {
  value = aws_cloudwatch_log_group.transcriber_task_logs.name
}

