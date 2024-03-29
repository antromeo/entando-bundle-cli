import { Phase } from '../services/command-factory-service'
import { ComponentService } from '../services/component-service'
import {
  ParallelProcessExecutorService,
  ProcessExecutionResult
} from '../services/process-executor-service'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Component, ComponentType } from '../models/component'
import { LOGS_FOLDER, OUTPUT_FOLDER } from '../paths'
import { mkdirSync } from 'node:fs'
import { color } from '@oclif/color'
import { BaseExecutionCommand } from './base-execution-command'
import { FSService } from '../services/fs-service'
import { animatedProgress, ColorizedWritable } from '../utils'

export type BuildOptions = {
  stdout: boolean
  parallelism: number | undefined
  failFast: boolean
}

export abstract class BaseBuildCommand extends BaseExecutionCommand {
  static get hidden(): boolean {
    return this.name === BaseBuildCommand.name
  }

  public async buildAllComponents(
    commandPhase: Phase,
    buildOptions: BuildOptions,
    componentType?: ComponentType
  ): Promise<void> {
    const componentService = new ComponentService()
    const components = componentService.getComponents(componentType)

    const componentsNames = components.map(comp => comp.name).join(', ')

    switch (componentType) {
      case ComponentType.MICROSERVICE:
        this.log(
          color.bold.blue(`Building ${componentsNames} microservices...`)
        )
        break
      case ComponentType.MICROFRONTEND:
        this.log(
          color.bold.blue(`Building ${componentsNames} micro frontends...`)
        )
        break
      default:
        this.log(color.bold.blue(`Building ${componentsNames} components...`))
        break
    }

    await this.buildComponents(components, commandPhase, buildOptions)
  }

  protected async buildComponents(
    components: Array<Component<ComponentType>>,
    commandPhase: Phase,
    buildOptions: BuildOptions
  ): Promise<void> {
    // Output and logs directories cleanup
    const outputFolder = path.resolve(...OUTPUT_FOLDER)
    const logsFolder = path.resolve(...LOGS_FOLDER)

    if (fs.existsSync(logsFolder)) {
      fs.rmSync(logsFolder, { recursive: true })
    }

    if (fs.existsSync(outputFolder)) {
      fs.rmSync(outputFolder, { recursive: true })
    }

    const executionOptions = this.getExecutionOptions(
      components,
      commandPhase,
      component =>
        buildOptions.stdout
          ? new ColorizedWritable(
              component.name,
              this.getMaxPrefixLength(components)
            )
          : this.getBuildOutputLogFile(component, false)
    )

    const executorService = new ParallelProcessExecutorService(
      executionOptions,
      buildOptions.parallelism,
      buildOptions.failFast
    )

    await this.parallelBuild(executorService, components, buildOptions.stdout)
  }

  public getBuildOutputLogFile(
    component: Component<ComponentType>,
    append: boolean
  ): fs.WriteStream {
    const logDir = path.resolve(...LOGS_FOLDER)
    mkdirSync(logDir, { recursive: true })
    const logFilePath = path.resolve(logDir, component.name + '.log')
    const logFile = fs.createWriteStream(logFilePath, {
      flags: append ? 'a' : 'w'
    })

    this.log(
      `- Build output for ${
        component.name
      } will be available in ${FSService.toPosix(logFilePath)}`
    )

    return logFile
  }

  public async parallelBuild(
    executorService: ParallelProcessExecutorService,
    components: Array<Component<ComponentType>>,
    stdout: boolean
  ): Promise<void> {
    const progress = animatedProgress()
    if (!stdout) {
      progress.start(components.length, 0)
    }

    executorService.on('done', () => {
      if (!stdout) {
        progress.update(progress.value + 1)
      }
    })

    const results = await executorService.execute()
    if (!stdout) {
      progress.stop()
    }

    this.checkBuildResults(results, components)
  }

  private checkBuildResults(
    results: ProcessExecutionResult[],
    components: Array<Component<ComponentType>>
  ): void {
    if (results.some(result => result !== 0)) {
      let errorMessage = 'The following components failed to build:\n'

      for (const [i, result] of results.entries()) {
        if (result !== 0) {
          errorMessage += `- ${components[i].name}: ${this.getErrorMessage(
            result
          )}\n`
        }
      }

      errorMessage += 'See log files for more information'
      this.error(errorMessage)
    }
  }
}
