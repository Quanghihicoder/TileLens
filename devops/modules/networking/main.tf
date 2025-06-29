resource "aws_subnet" "public_a" {
  vpc_id                  = var.vpc_id
  cidr_block              = var.public_cidr_block_a
  availability_zone       = var.az_a
  map_public_ip_on_launch = true

  tags = {
    Name = "tilelens-public-subnet"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = var.vpc_id
  cidr_block              = var.public_cidr_block_b
  availability_zone       = var.az_b
  map_public_ip_on_launch = true

  tags = {
    Name = "tilelens-public-subnet"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_cidr_block_a
  availability_zone = var.az_a

  tags = {
    Name = "tilelens-private-subnet"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = var.vpc_id
  cidr_block        = var.private_cidr_block_b
  availability_zone = var.az_b

  tags = {
    Name = "tilelens-private-subnet"
  }
}

resource "aws_route_table_association" "public_assoc_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = var.public_route_table_id
}

resource "aws_route_table_association" "public_assoc_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = var.public_route_table_id
}

# Subnet group for RDS 
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "tilelens-rds-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}
