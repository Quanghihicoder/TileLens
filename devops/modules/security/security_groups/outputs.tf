output "backend_sg_id" {
  value = aws_security_group.backend_sg.id
}

output "service_sg_id" {
  value = aws_security_group.service_sg.id
}

output "alb_sg_id" {
  value = aws_security_group.alb_sg.id
}

output "msk_sg_id" {
  value = aws_security_group.msk_sg.id
}

output "lambda_msk_sg_id" {
  value = aws_security_group.lambda_msk_sg.id
}

output "rds_sg_id" {
  value = aws_security_group.rds_sg.id
}
