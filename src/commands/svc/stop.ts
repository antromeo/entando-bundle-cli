import { CliUx, Flags } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'
import { SvcProcessResult, ServiceTypes } from './svc-process-result'

export default class Stop extends SvcProcessResult {
  static strict = false
  static description = 'Stop running auxiliary services'

  static examples = [
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> ext-service',
    '<%= config.bin %> <%= command.id %> ext-service1 ext-service2'
  ]

  static usage = 'svc stop [service...] [--all]'

  static flags = {
    all: Flags.boolean({
      description: 'Stops all enabled services in the bundle descriptor'
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const { argv, flags } = await this.parse(Stop)

    const svcService: SvcService = new SvcService(this.config.bin)

    if (!flags.all && argv.length === 0) {
      this.error(
        'At least one service name is required. You can also use `--all` flag to stop all enabled services'
      )
    }

    const services = flags.all ? svcService.getEnabledServices() : argv
    const actionStartMsg = flags.all
      ? `Stopping all enabled services: (${services.join(', ')})`
      : `Stopping services: ${services.join(', ')}`

    CliUx.ux.action.start(actionStartMsg)
    const result = await svcService.stopServices(services)
    this.checkResult(result, ServiceTypes.STOP, services)
    CliUx.ux.action.stop()
  }
}
