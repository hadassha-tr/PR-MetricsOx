// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IExecSyncResult } from 'azure-pipelines-task-lib/toolrunner'
import { singleton } from 'tsyringe'
import { Validator } from '../utilities/validator'
import TaskLibWrapper from '../wrappers/taskLibWrapper'

/**
 * A class for invoking Git commands.
 */
@singleton()
export default class GitInvoker {
  private readonly _taskLibWrapper: TaskLibWrapper

  /**
   * Initializes a new instance of the `GitInvoker` class.
   * @param taskLibWrapper The wrapper around the Azure Pipelines Task Lib.
   */
  public constructor (taskLibWrapper: TaskLibWrapper) {
    this._taskLibWrapper = taskLibWrapper
  }

  /**
   * Gets a diff summary related to the changes in the current branch.
   * @returns The diff summary.
   */
  public getDiffSummary (): string {
    this._taskLibWrapper.debug('* GitInvoker.getDiffSummary()')

    const targetBranch: string = this.getTargetBranch()
    const pullRequestId: string = this.getPullRequestId()
    return this.invokeGit(`diff --numstat origin/${targetBranch}...pull/${pullRequestId}/merge`)
  }

  private getTargetBranch (): string {
    this._taskLibWrapper.debug('* GitInvoker.getTargetBranch()')

    const variable: string = Validator.validate(process.env.SYSTEM_PULLREQUEST_TARGETBRANCH, 'SYSTEM_PULLREQUEST_TARGETBRANCH', 'GitInvoker.getTargetBranch()')
    const expectedStart: string = 'refs/heads/'
    if (!variable.startsWith(expectedStart)) {
      throw Error(`Environment variable SYSTEM_PULLREQUEST_TARGETBRANCH '${variable}' in unexpected format.`)
    }

    const startIndex: number = expectedStart.length
    return variable.substring(startIndex)
  }

  private getPullRequestId (): string {
    this._taskLibWrapper.debug('* GitInvoker.getPullRequestId()')

    return Validator.validate(process.env.SYSTEM_PULLREQUEST_PULLREQUESTID, 'SYSTEM_PULLREQUEST_PULLREQUESTID', 'GitInvoker.getPullRequestId()')
  }

  private invokeGit (parameters: string): string {
    this._taskLibWrapper.debug('* GitInvoker.invokeGit()')

    const result: IExecSyncResult = this._taskLibWrapper.execSync('git', parameters)
    if (result.code !== 0) {
      throw result.error
    }

    return result.stdout
  }
}