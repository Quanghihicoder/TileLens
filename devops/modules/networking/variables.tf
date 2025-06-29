variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "az_a" {
  description = "Availability Zone A"
  type        = string
}

variable "az_b" {
  description = "Availability Zone B"
  type        = string
}

variable "public_cidr_block_a" {
  description = "Public subnet cidr block A"
  default     = "10.0.2.0/24"
  type        = string
}

variable "public_cidr_block_b" {
  description = "Public subnet cidr block B"
  default     = "10.0.5.0/24"
  type        = string
}

variable "private_cidr_block_a" {
  description = "Private subnet cidr block A"
  default     = "10.0.3.0/24"
  type        = string
}

variable "private_cidr_block_b" {
  description = "Private subnet cidr block B"
  default     = "10.0.4.0/24"
  type        = string
}

variable "public_route_table_id" {
  type = string
}
