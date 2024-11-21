import * as core from "@actions/core";
import * as github from "@actions/github";
import Util from "./utils";

/**
 * This action will
 * 1. Read the PR body
 * 2. Get all the tasks
 * 3. Checks if all tasks are completed(checked)
 * 4. Return
 *      success if
 *          there is no pr body
 *          no tasks in pr body
 *          all tasks are completed(checked)
 *      failure if
 *          there are any pending tasks to be complated
 */

async function run(): Promise<void> {
  try {
    const ghToken = core.getInput("gh-token");
    const client = github.getOctokit(ghToken);
    const context = github.context;
    const { owner, repo } = context.repo;
    const number = github.context.payload.pull_request?.number;

    const commentBodies = await client.rest.issues
      .listComments({
        owner: owner,
        repo: repo,
        issue_number: number,
      })
      .map((comment: { body: any }) => comment.body)
      .join("\n");
    // read the pr body for tasks
    if (!commentBodies) {
      core.info("No tasks detected in any comments");
      return;
    }

    // get the status of pending tasks
    core.debug("Getting a list of uncompleted tasks: ");
    let pendingTasks = Util.getPendingTasks(commentBodies);
    core.debug(pendingTasks);

    let isTaskListCompleted = false;
    if (!pendingTasks) {
      isTaskListCompleted = true;
    }
    core.debug(`All tasks completed: ${isTaskListCompleted}`);

    if (isTaskListCompleted) {
      core.info(`SUCCESS: All tasks completed`);
      return;
    } else {
      core.setFailed(
        `FAILED: Some tasks are still pending! \n${pendingTasks}\nLength: ${pendingTasks.length}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
