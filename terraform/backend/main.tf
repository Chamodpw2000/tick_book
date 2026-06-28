provider "aws" {
  region = "ap-south-1"
}

resource "aws_s3_bucket" "s3-bucket" {

  bucket        = "tick-book-state-store-s3-chamod"
  force_destroy = true
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name         = "tick-book-state-store-lock-table-chamod"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
