output "tiling_lambda_name" {
  value = aws_lambda_function.tiling_lambda.function_name
}

output "clipping_lambda_name" {
  value = aws_lambda_function.clipping_lambda.function_name
}

output "blending_lambda_name" {
  value = aws_lambda_function.blending_lambda.function_name
}

output "msk_topic_creator_function_name" {
  value = aws_lambda_function.msk_topic_creator_lambda.function_name
}
