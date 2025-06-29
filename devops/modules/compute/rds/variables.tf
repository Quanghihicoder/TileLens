variable "db_username" {
  type = string
}

variable "db_password" {
  type = string
}

variable "mysqldb_name" {
  description = "Name of the RDS MySQL database"
  type        = string
}

variable "rds_subnet_group_name" {
  description = "Name of the RDS subnet group"
  type        = string
}

variable "rds_sg_id" {
  description = "ID of the RDS security group"
  type        = string
}
