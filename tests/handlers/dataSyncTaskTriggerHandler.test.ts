import {
  DataSyncClient,
  ListTasksCommand,
  StartTaskExecutionCommand,
} from "@aws-sdk/client-datasync";
import { mockClient } from "aws-sdk-client-mock";
import { handler as dataSyncTaskTriggerHandler } from "../../src/handlers/dataSyncTaskTriggerHandler";

jest.mock("@aws-sdk/client-datasync");

describe("dataSyncTaskTriggerHandler", () => {
  const dataSyncClientMock = mockClient(DataSyncClient);

  beforeEach(() => {
    dataSyncClientMock.reset();
  });

  it("should handle no tasks available", async () => {
    dataSyncClientMock.on(ListTasksCommand).resolves({
      Tasks: [],
    });

    const result = await dataSyncTaskTriggerHandler({});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "No DataSync tasks found." }),
    });
  });

  it("should handle tasks available and start execution", async () => {
    const mockTaskArn =
      "arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0";
    dataSyncClientMock.on(ListTasksCommand).resolves({
      Tasks: [{ TaskArn: mockTaskArn, Status: "AVAILABLE" }],
    });
    dataSyncClientMock.on(StartTaskExecutionCommand).resolves({
      TaskExecutionArn:
        "arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0/execution/exec-1234567890abcdef0",
    });

    const result = await dataSyncTaskTriggerHandler({});
    expect(dataSyncClientMock.calls()).toHaveLength(2);
    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "DataSync task execution processed.",
        results: [
          "Task started: arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0",
        ],
      }),
    });
  });

  it("should handle errors from the DataSync client when listing tasks", async () => {
    dataSyncClientMock
      .on(ListTasksCommand)
      .rejects(new Error("ListTasks failed"));

    const result = await dataSyncTaskTriggerHandler({});

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        error: "Error starting DataSync task execution",
        details: {},
      }),
    });
  });

  it("should handle errors from the DataSync client when starting task execution", async () => {
    const mockTaskArn =
      "arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0";
    dataSyncClientMock.on(ListTasksCommand).resolves({
      Tasks: [{ TaskArn: mockTaskArn, Status: "UNAVAILABLE" }],
    });
    dataSyncClientMock
      .on(StartTaskExecutionCommand)
      .rejects(new Error("StartTaskExecution failed"));

    const result = await dataSyncTaskTriggerHandler({});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "DataSync task execution processed.",
        results: [
          "Task cannot start. arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0 is in status: UNAVAILABLE.",
        ],
      }),
    });
  });

  it("should handle multiple tasks and start execution for the first one", async () => {
    const mockTaskArn1 =
      "arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0";
    const mockTaskArn2 =
      "arn:aws:datasync:us-west-2:123456789012:task/task-0fedcba0987654321";
    dataSyncClientMock.on(ListTasksCommand).resolves({
      Tasks: [
        { TaskArn: mockTaskArn1, Status: "AVAILABLE" },
        { TaskArn: mockTaskArn2, Status: "UNAVAILABLE" },
      ],
    });
    dataSyncClientMock.on(StartTaskExecutionCommand).resolves({
      TaskExecutionArn:
        "arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0/execution/exec-1234567890abcdef0",
    });

    const result = await dataSyncTaskTriggerHandler({});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "DataSync task execution processed.",
        results: [
          "Task started: arn:aws:datasync:us-west-2:123456789012:task/task-1234567890abcdef0",
          "Task cannot start. arn:aws:datasync:us-west-2:123456789012:task/task-0fedcba0987654321 is in status: UNAVAILABLE.",
        ],
      }),
    });
  });
});
