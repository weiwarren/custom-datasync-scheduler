# Custom DataSync Scheduler

This project implements a custom scheduler for AWS DataSync tasks using AWS Lambda and EventBridge Scheduler.

## Overview

The Custom DataSync Scheduler automates the process of triggering AWS DataSync tasks on a regular schedule. It uses a Lambda function to interact with the AWS DataSync API, and an EventBridge Scheduler to  invoke the Lambda function on a 5 min intervals.

## Architecture

- **AWS Lambda**: Executes the logic to trigger DataSync tasks
- **Amazon EventBridge Scheduler**: Invokes the Lambda function on a schedule
- **AWS IAM**: Manages permissions for Lambda and EventBridge Scheduler
- **AWS DataSync**: Performs the actual data synchronization tasks

## Components

### Lambda Function

- **Name**: dataSyncTaskTrigger
- **Runtime**: Node.js 20.x
- **Handler**: handlers/dataSyncTaskTriggerHandler.handler
- **Purpose**: Interacts with AWS DataSync API to list, describe, and start DataSync tasks

### EventBridge Scheduler

- **Schedule**: Runs every 5 minutes
- **Target**: The Lambda function

### IAM Roles and Policies

- **Lambda Role**: Allows the Lambda function to interact with DataSync
- **Scheduler Role**: Permits EventBridge Scheduler to invoke the Lambda function

## Deployment

This project uses Terraform for infrastructure as code. To deploy:

1. Ensure you have Terraform installed and configured for your AWS account.
2. Navigate to the project directory, then `cd terraform`.
3. Run `terraform init` to initialize the Terraform working directory.
4. Run `terraform plan` to preview the changes.
5. Run `terraform apply` to create the resources in your AWS account.

## Configuration

The main configuration is done through the Terraform variables. Key configurations include:

- Lambda function name and handler path
- EventBridge Scheduler frequency
- IAM role and policy names

## Usage

Once deployed, the system will automatically run the DataSync tasks according to the schedule. No manual intervention is required for regular operation.

## Monitoring and Logging

- Use AWS CloudWatch to monitor the Lambda function executions and any errors.
- DataSync task executions can be monitored through the AWS DataSync console or API.

## Security

- IAM roles are used to grant least-privilege permissions to the Lambda function and EventBridge Scheduler.
- Ensure that your AWS account's security best practices are followed.

## Contributor

Warren Wei

## License

MIT License