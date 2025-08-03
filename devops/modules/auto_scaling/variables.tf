variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "backend_ecs_cluster_name" {
  description = "Name of the ECS Cluster"
  type        = string
}

variable "backend_ecs_service_name" {
  description = "Name of the ECS Service"
  type        = string
}
