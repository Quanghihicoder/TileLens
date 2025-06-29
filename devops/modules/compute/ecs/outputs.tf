output "ecs_cluster_name" {
  value = aws_ecs_cluster.tilelens_ecs.name
}

output "ecs_service_name" {
  value = aws_ecs_service.tilelens_service.name
}
