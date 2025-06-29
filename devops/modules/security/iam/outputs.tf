output "iam_instance_profile_name" {
  value = aws_iam_instance_profile.tilelens_ecs_instance_profile.name
}

output "ecs_task_exec_role_arn" {
  value = aws_iam_role.tilelens_ecs_task_exec_role.arn
}

output "lambda_exec_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}
