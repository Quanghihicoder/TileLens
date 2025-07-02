output "ecs_logs_group_name" {
  value = aws_cloudwatch_log_group.ecs_task_logs.name
}
