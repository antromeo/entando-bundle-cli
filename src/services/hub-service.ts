import { CliUx } from '@oclif/core'
import { CLIError } from '@oclif/errors'
import * as cp from 'node:child_process'
// import * as fs from 'node:fs'
// import * as path from 'node:path'
import * as inquirer from 'inquirer'
import HubAPI from "../api/hub-api"
import { Bundle, BundleGroup } from "../models/bundle-descriptor"
import FSService from './fs-service'

export interface HubOptions {
  parentDirectory: string
  hubUrl?: string
}

export default class HubService extends FSService {
  private readonly options: HubOptions
  private hubApi: HubAPI
  private loadedBundleGroups: BundleGroup[] = []

  constructor(options: HubOptions) {
    super(options.parentDirectory)
    this.options = options
    this.hubApi = new HubAPI(this.options.hubUrl)
  }

  public async start(): Promise<void> {
    CliUx.ux.action.start('Gathering bundle groups')
    this.loadedBundleGroups = await this.hubApi.getBundleGroups()
    CliUx.ux.action.stop()
    const selectedBundleGroup = await this.promptSelectBundleGroup()
    console.log(`Your choice is ${selectedBundleGroup?.bundleGroupName}`)
    if (selectedBundleGroup) {
      CliUx.ux.action.start(`Opening bundle group ${selectedBundleGroup.bundleGroupName}`)
      const bundles: Bundle[] = await this.hubApi.getBundlesByBundleGroupId(selectedBundleGroup.bundleGroupVersionId)
      CliUx.ux.action.stop()

      const selectedBundle: Bundle = await this.promptBundleSelect(bundles, selectedBundleGroup)

      const newBundleName = await CliUx.ux.prompt('What\'s the new bundle name for this?')

      super.checkBundleName(newBundleName)

      super.checkBundleDirectory(newBundleName)

      CliUx.ux.action.start(`Downloading bundle ${selectedBundle.bundleName}`)

      try {
        // Using stdio 'pipe' option to print stderr only through CLIError
        cp.execSync(`git clone ${selectedBundle.gitSrcRepoAddress} ./${newBundleName}`, { stdio: 'pipe' })
      } catch (error) {
        throw new CLIError(error as Error)
      }

      CliUx.ux.action.stop()
    }
  }

  private async promptSelectBundleGroup(): Promise<BundleGroup | null> {
    const choices = this.loadedBundleGroups.map(bundleGroup => ({ name: bundleGroup.bundleGroupName, value: bundleGroup }))
    const response: any = await inquirer.prompt([{
      name: 'bundlegroup',
      message: 'Select a bundle group',
      type: 'list',
      choices,
    }])
    return response.bundlegroup;
  }

  private async promptBundleSelect(bundleChoices: Bundle[], selectedBundleGroup: BundleGroup): Promise<Bundle> {
    const choices = bundleChoices.map(bundle => ({ name: bundle.bundleName, value: bundle  }))
    const response: any = await inquirer.prompt([{
      name: 'bundle',
      message: `Select a bundle from ${selectedBundleGroup.bundleGroupName}`,
      type: 'list',
      choices,
    }])
    return response.bundle;
  }
}
