resource "aws_appautoscaling_target" "backend_ecs_target" {
  max_capacity       = 4 # this only possible if running t3.small or above
  min_capacity       = 1
  resource_id        = "service/${var.backend_ecs_cluster_name}/${var.backend_ecs_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_ecs_cpu_scale_up" {
  name               = "${var.project_name}-cpu-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend_ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.backend_ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend_ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# EC2 Scaling

# resource "aws_launch_template" "ecs_lt" {
#   name_prefix   = "ecs-lt-"
#   image_id      = var.ami_id # ECS-optimized AMI
#   instance_type = "t3.small"
#   key_name      = var.key_name

#   user_data = base64encode(<<-EOF
#               #!/bin/bash
#               echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
#               EOF
#   )

#   iam_instance_profile {
#     name = var.ecs_instance_profile_name
#   }

#   network_interfaces {
#     security_groups = [var.ec2_sg_id]
#   }
# }


# resource "aws_autoscaling_group" "ecs_asg" {
#   desired_capacity    = 1
#   max_size            = 4
#   min_size            = 1
#   vpc_zone_identifier = var.private_subnet_ids
#   launch_template {
#     id      = aws_launch_template.ecs_lt.id
#     version = "$Latest"
#   }

#   tag {
#     key                 = "AmazonECSManaged"
#     value               = ""
#     propagate_at_launch = true
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# resource "aws_ecs_capacity_provider" "ecs_cp" {
#   name = "ecs-cp"

#   auto_scaling_group_provider {
#     auto_scaling_group_arn         = aws_autoscaling_group.ecs_asg.arn
#     managed_termination_protection = "DISABLED"

#     managed_scaling {
#       status                    = "ENABLED"
#       target_capacity           = 100 # % of ASG desired_capacity ECS should use
#       minimum_scaling_step_size = 1
#       maximum_scaling_step_size = 2
#       instance_warmup_period    = 300
#     }
#   }
# }

# resource "aws_ecs_cluster_capacity_providers" "attach_cp" {
#   cluster_name = aws_ecs_cluster.main.name

#   capacity_providers = [aws_ecs_capacity_provider.ecs_cp.name]

#   default_capacity_provider_strategy {
#     capacity_provider = aws_ecs_capacity_provider.ecs_cp.name
#     weight            = 1
#     base              = 1
#   }
# }
