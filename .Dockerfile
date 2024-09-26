# Use the official AWS Lambda Node.js 20 image
FROM public.ecr.aws/lambda/nodejs:20

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the source code
COPY src/ ./src/

# Command to run the Lambda function
CMD ["src/handlers/dataSyncTaskTriggerHandler.handler"]
