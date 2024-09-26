output "lambda_function_name" {
  value = aws_lambda_function.data_sync_trigger.function_name
}

output "scheduler_name" {
  value = aws_scheduler_schedule.data_sync_schedule.name
}
