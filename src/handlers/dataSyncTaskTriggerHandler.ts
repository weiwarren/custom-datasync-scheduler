import {
  DataSyncClient,
  ListTasksCommand,
  DescribeTaskCommand,
  StartTaskExecutionCommand,
} from "@aws-sdk/client-datasync";

const client = new DataSyncClient();

export const handler = async (event: any) => {
  try {
    console.log("Started DataSync trigger event handler");

    // List all DataSync tasks
    const listTasksCommand = new ListTasksCommand({});
    const tasks = await client.send(listTasksCommand);

    if (!tasks.Tasks || tasks.Tasks.length === 0) {
      console.log("No DataSync tasks found.");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No DataSync tasks found." }),
      };
    }

    // Initialize an array to hold the results
    const results = [];

    // Iterate through each task
    for (const task of tasks.Tasks) {
      if (task.TaskArn) {
        try {
          // Check if the task is in a state that allows starting
          if (task.Status === "AVAILABLE") {
            console.log(`Starting task: ${task.TaskArn}`);
            const startTaskExecutionCommand = new StartTaskExecutionCommand({
              TaskArn: task.TaskArn,
            });
            await client.send(startTaskExecutionCommand);
            results.push(`Task started: ${task.TaskArn}`);
          } else if (task.Status === "RUNNING") {
            console.log(`Task ${task.TaskArn} is already running.`);
            results.push(`Task ${task.TaskArn} is already running.`);
          } else {
            console.log(
              `Task cannot start. ${task.TaskArn} is in status: ${task.Status}.`
            );
            results.push(
              `Task cannot start. ${task.TaskArn} is in status: ${task.Status}.`
            );
          }
        } catch (taskError) {
          console.error(`Error starting task ${task.TaskArn}:`, taskError);
          results.push(`Failed to start task ${task.TaskArn}: ${taskError}`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "DataSync task execution processed.",
        results: results,
      }),
    };
  } catch (e) {
    console.error("Error executing task:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error starting DataSync task execution",
        details: e,
      }),
    };
  }
};
