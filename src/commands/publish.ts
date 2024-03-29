import color from '@oclif/color'
import { CliUx, Command, Flags } from '@oclif/core'
import { BundleDescriptor } from '../models/bundle-descriptor'
import { BundleDescriptorService } from '../services/bundle-descriptor-service'
import { BundleService } from '../services/bundle-service'
import {
  ConfigService,
  DOCKER_ORGANIZATION_PROPERTY,
  DOCKER_REGISTRY_PROPERTY
} from '../services/config-service'
import { DockerService } from '../services/docker-service'
import { animatedProgress } from '../utils'
import Pack from './pack'

export default class Publish extends Command {
  static description = 'Publish bundle Docker images'

  static examples = [
    '<%= config.bin %> <%= command.id %> --registry registry.hub.docker.com --org my-docker-organization'
  ]

  static flags = {
    registry: Flags.string({
      char: 'r',
      description: `Docker registry (default is ${DockerService.getDefaultDockerRegistry()})`,
      required: false
    }),
    org: Flags.string({
      char: 'o',
      description: `Docker organization name`,
      required: false
    })
  }

  public async run(): Promise<void> {
    BundleService.isValidBundleProject()

    const configService = new ConfigService()

    const { flags } = await this.parse(Publish)

    const configuredOrganization = configService.getProperty(
      DOCKER_ORGANIZATION_PROPERTY
    )

    if (!configuredOrganization && !flags.org) {
      this.error(
        'No configured Docker organization found. Please run the command with --org flag.'
      )
    }

    if (flags.org) {
      configService.addOrUpdateProperty(DOCKER_ORGANIZATION_PROPERTY, flags.org)
    }

    const bundleDescriptor = new BundleDescriptorService().getBundleDescriptor()

    let imagesExists: boolean =
      flags.org !== undefined &&
      (await DockerService.bundleImagesExists(bundleDescriptor, flags.org))

    if (!imagesExists) {
      imagesExists = await this.checkImagesUsingConfiguredOrganization(
        bundleDescriptor,
        configuredOrganization,
        flags.org
      )
    }

    const organization = flags.org ?? configuredOrganization!

    if (!imagesExists) {
      this.warn('One or more Docker images are missing. Running pack command.')
      await Pack.run(['--org', organization])
    }

    const registry = await this.login(configService, flags.registry)

    const images = await this.getImagesToPush(
      bundleDescriptor,
      organization,
      registry
    )

    const pushedImages = await this.pushImages(images, registry)

    this.displayResults(pushedImages, bundleDescriptor, organization, registry)
  }

  private async checkImagesUsingConfiguredOrganization(
    bundleDescriptor: BundleDescriptor,
    configuredOrganization: string | undefined,
    organizationFlag: string | undefined
  ): Promise<boolean> {
    const imagesExists =
      configuredOrganization !== undefined &&
      (await DockerService.bundleImagesExists(
        bundleDescriptor,
        configuredOrganization
      ))
    if (imagesExists && organizationFlag) {
      this.warn('Docker organization changed. Updating images names.')
      CliUx.ux.action.start(
        'Creating Docker images tags using new organization ' + organizationFlag
      )
      await DockerService.updateImagesOrganization(
        bundleDescriptor,
        configuredOrganization!,
        organizationFlag
      )
      CliUx.ux.action.stop()
    }

    return imagesExists
  }

  private async login(
    configService: ConfigService,
    registryFlag: string | undefined
  ): Promise<string> {
    let registry = registryFlag
    if (registry) {
      configService.addOrUpdateProperty(DOCKER_REGISTRY_PROPERTY, registry)
    } else {
      registry = configService.getProperty(DOCKER_REGISTRY_PROPERTY)
    }

    registry = registry ?? DockerService.getDefaultDockerRegistry()

    this.log(color.bold.blue(`Login on Docker registry ${registry}`))
    const loginResult = await DockerService.checkAuthentication(registry)

    if (loginResult !== 0) {
      const username = await CliUx.ux.prompt('Username')
      const password = await CliUx.ux.prompt('Password', { type: 'hide' })
      await DockerService.login(username, password, registry)
    }

    return registry
  }

  private async getImagesToPush(
    bundleDescriptor: BundleDescriptor,
    organization: string,
    registry: string
  ): Promise<string[]> {
    CliUx.ux.action.start(
      'Creating Docker images tags for registry ' + registry
    )
    const images = await DockerService.setImagesRegistry(
      bundleDescriptor,
      organization,
      registry
    )
    CliUx.ux.action.stop()

    return images
  }

  private async pushImages(
    images: string[],
    registry: string
  ): Promise<DockerImage[]> {
    this.log(color.bold.blue(`Pushing images to ${registry}`))

    const progress = animatedProgress()
    progress.start(images.length, 0)
    const results: DockerImage[] = []
    /* eslint-disable no-await-in-loop */
    try {
      for (const image of images) {
        const digest = await DockerService.pushImage(image, registry)
        results.push({ name: image, digest })
        progress.update(progress.value + 1)
      }
    } finally {
      progress.stop()
    }

    return results
  }

  private displayResults(
    results: DockerImage[],
    bundleDescriptor: BundleDescriptor,
    organization: string,
    registry: string
  ) {
    this.log(color.bold.blue('Images pushed successfully'))

    const bundleDockerImageName =
      registry +
      '/' +
      DockerService.getDockerImageName(
        organization,
        bundleDescriptor.name,
        bundleDescriptor.version
      )

    const microservicesImages = results.filter(
      i => i.name !== bundleDockerImageName
    )

    if (microservicesImages.length > 0) {
      this.log(color.bold.blue('\n Microservices'))
      CliUx.ux.table(microservicesImages, {
        name: {},
        digest: {}
      })
    }

    const bundleImage = results.find(i => i.name === bundleDockerImageName)!

    this.log(`\n ${color.bold.blue('Bundle image')}`)
    this.log(`   ${color.bold('Name')}: ${bundleImage.name}`)
    this.log(` ${color.bold('Digest')}: ${bundleImage.digest}`)
  }
}

type DockerImage = {
  name: string
  digest?: string
}
