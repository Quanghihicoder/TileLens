resource "aws_db_instance" "tilelens_mysql" {
  identifier             = "tilelens-mysqldb"
  db_name                = var.mysqldb_name
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  username               = var.db_username
  password               = var.db_password
  allocated_storage      = 20
  db_subnet_group_name   = var.rds_subnet_group_name
  vpc_security_group_ids = [var.rds_sg_id]

  skip_final_snapshot = true
  publicly_accessible = false

  tags = {
    Name = "tilelens-mysqldb"
  }
}
