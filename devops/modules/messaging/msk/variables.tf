variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "private_subnet_a_id" {
  description = "ID of the private subnet A"
  type        = string
}

variable "private_subnet_b_id" {
  description = "ID of the private subnet B"
  type        = string
}

variable "msk_sg_id" {
  description = "ID of the AWS MSK security group"
  type        = string
}
