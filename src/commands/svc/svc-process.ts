import { Command } from '@oclif/core'
import { ProcessExecutionResult } from '../../services/process-executor-service'

export enum ServiceTypes {
  START = 'Starting',
  STOP = 'Stopping'
}

export abstract class SvcProcessResult extends Command {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected checkResult(
    result: any,
    serviceType: string,
    services: string[]
  ): void {
    if (result !== 0) {
      if (typeof result === 'number') {
        this.error(
          `${serviceType} service(s) ${services.join(
            ', '
          )} failed, exit with code ${result}`,
          {
            exit: result as number
          }
        )
      } else {
        this.error(
          `${serviceType} service failed, exit with code 1 and message ${this.getErrorMessage(
            result
          )}`,
          { exit: 1 }
        )
      }
    }
  }

  protected getErrorMessage(executionResult: ProcessExecutionResult): string {
    if (executionResult instanceof Error) {
      return `Command failed due to error: ${executionResult.message}`
    }

    return `Process killed by signal ${executionResult}`
  }
}
