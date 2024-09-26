provider "aws" {
  region = "ap-southeast-2"
}

# IAM Role for the EventBridge Scheduler
resource "aws_iam_role" "scheduler_role" {
  name = "eventbridge-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })
}

# IAM Policy for Lambda Invocation
resource "aws_iam_policy" "lambda_invoke_policy" {
  name = "InvokeLambdaPolicy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = aws_lambda_function.data_sync_trigger.arn
      }
    ]
  })
}

# Attach the Lambda invocation policy to the scheduler role
resource "aws_iam_role_policy_attachment" "scheduler_policy_attachment" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.lambda_invoke_policy.arn
}

# IAM Role for the Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "datasync-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
    ]
  })
}

# Policy for the Lambda function to allow access to DataSync
resource "aws_iam_policy" "datasync_policy" {
  name = "DataSyncPolicy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "datasync:ListTasks",
          "datasync:DescribeTask",
          "datasync:StartTaskExecution"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach the DataSync policy to the Lambda role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.datasync_policy.arn
}

# Lambda Function Definition
resource "aws_lambda_function" "data_sync_trigger" {
  function_name = "dataSyncTaskTrigger"
  role          = aws_iam_role.lambda_role.arn
  handler       = "handlers/dataSyncTaskTriggerHandler.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.lambda_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)
}

# EventBridge Scheduler Definition
resource "aws_scheduler_schedule" "data_sync_schedule" {
  name                = "data-sync-schedule"
  schedule_expression = "rate(5 minutes)"
  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn     = aws_lambda_function.data_sync_trigger.arn
    role_arn = aws_iam_role.scheduler_role.arn
  }
}

# Grant permission for EventBridge Scheduler to invoke the Lambda function
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_sync_trigger.function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = aws_scheduler_schedule.data_sync_schedule.arn
}
