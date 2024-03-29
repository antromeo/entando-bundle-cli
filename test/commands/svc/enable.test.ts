import { expect, test } from '@oclif/test'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { BundleDescriptorService } from '../../../src/services/bundle-descriptor-service'
import { CLIError } from '@oclif/errors'

describe('svc enable', () => {
  let bundleDirectory: string
  let bundleDescriptorService: BundleDescriptorService
  const tempDirHelper = new TempDirHelper(__filename)

  before(() => {
    bundleDirectory = tempDirHelper.createInitializedBundleDir('sample-bundle')
  })

  beforeEach(() => {
    process.chdir(bundleDirectory)
    bundleDescriptorService = new BundleDescriptorService(bundleDirectory)
    const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
    bundleDescriptorService.writeBundleDescriptor({
      ...bundleDescriptor,
      svc: []
    })
  })

  test
    .stdout()
    .command(['svc enable', 'mysql'])
    .it('enable a service successfully', () => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      expect(bundleDescriptor.svc).to.have.length(1)
      expect(bundleDescriptor.svc).to.deep.equal(['mysql'])
    })

  test
    .stderr()
    .command(['svc enable', 'win95x'])
    .catch(error => {
      expect(error.message).to.contain('Service win95x does not exist')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('enable a service that is unavailable')

  test
    .stderr()
    .do(() => {
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        svc: ['keycloak']
      })
    })
    .command(['svc enable', 'keycloak'])
    .catch(error => {
      expect(error.message).to.contain('Service keycloak is already enabled')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('enable a service that is currently enabled')

  test
    .command('svc enable')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('serviceName')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if required argument is missing')
})
