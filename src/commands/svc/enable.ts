import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { SvcService } from '../../services/svc-service'

export default class Enable extends Command {
  static description =
    'Enables an available docker services found in services folder'

  static examples = ['<%= config.bin %> <%= command.id %> external-service']

  static args = [
    {
      name: 'serviceName',
      description: 'Name of an available service',
      required: true
    }
  ]

  static flags = {}

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { args } = await this.parse(Enable)

    const svcService: SvcService = new SvcService(process.cwd())

    CliUx.ux.action.start(`Enabling service ${args.serviceName}`)
    svcService.enableService(args.serviceName)
    CliUx.ux.action.stop()
  }
}
