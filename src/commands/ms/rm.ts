import { CliUx, Command } from '@oclif/core'
import { BundleService } from '../../services/bundle-service'
import { MicroServiceService } from '../../services/microservice-service'

export default class Rm extends Command {
  static description =
    'Removes a microservice component from the current bundle'

  static examples = ['<%= config.bin %> <%= command.id %> my-microservice']

  static args = [
    { name: 'name', description: 'Microservice name', required: true }
  ]

  public async run(): Promise<void> {
    BundleService.verifyBundleInitialized(process.cwd())

    const { args } = await this.parse(Rm)

    const microServiceService = new MicroServiceService()

    CliUx.ux.action.start(`Removing microservice ${args.name}`)
    microServiceService.removeMicroService(args.name)
    CliUx.ux.action.stop()
  }
}
