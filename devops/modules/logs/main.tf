resource "aws_cloudwatch_log_group" "backend_task_logs" {
  name              = "/ecs/${var.project_name}/backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "transcriber_task_logs" {
  name              = "/ecs/${var.project_name}/transcriber"
  retention_in_days = 7
}