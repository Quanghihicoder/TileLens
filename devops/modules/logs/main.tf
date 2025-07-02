resource "aws_cloudwatch_log_group" "ecs_task_logs" {
  name              = "/ecs/tilelens"
  retention_in_days = 7
}
