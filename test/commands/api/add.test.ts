import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as sinon from 'sinon'
import { BUNDLE_DESCRIPTOR_FILE_NAME } from '../../../src/paths'
import {
  ApiType,
  BundleDescriptor,
  MicroFrontend,
  Microservice
} from '../../../src/models/bundle-descriptor'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { MfeConfigService } from '../../../src/services/mfe-config-service'
import { MfeConfig } from '../../../src/models/mfe-config'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import { ComponentHelper } from '../../helpers/mocks/component-helper'
import { setCmEnv } from '../../helpers/mocks/cm'
import { CLIError } from '@oclif/errors'

describe('api add', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  let bundleDescriptor: BundleDescriptor
  let bundleDescriptorService: BundleDescriptorService
  let mfeConfigService: MfeConfigService

  before(() => {
    tempBundleDir = tempDirHelper.createInitializedBundleDir('bundle-api-test')
    fs.mkdirSync(path.resolve(tempBundleDir, 'microfrontends', 'mfe1'))
  })

  beforeEach(() => {
    bundleDescriptor = {
      name: 'bundle-api-test',
      version: '0.0.1',
      type: 'bundle',
      microservices: [ComponentHelper.newMicroservice('ms1')],
      microfrontends: [ComponentHelper.newMicroFrontend('mfe1')]
    }

    process.chdir(tempBundleDir)

    bundleDescriptorService = new BundleDescriptorService(tempBundleDir)
    bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    mfeConfigService = new MfeConfigService()
    mfeConfigService.writeMfeConfig('mfe1', {})

    setCmEnv()
  })

  afterEach(() => {
    sinon.restore()
  })

  test
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .it('adds an internal api claim to an mfe', () => {
      const updatedBundleDescriptor: BundleDescriptor =
        bundleDescriptorService.getBundleDescriptor()
      const updatedMfeConfig: MfeConfig = mfeConfigService.getMfeConfig('mfe1')

      expect(updatedBundleDescriptor).to.eql({
        ...bundleDescriptor,
        microfrontends: [
          {
            ...bundleDescriptor.microfrontends[0],
            apiClaims: [
              { name: 'ms1-api', type: 'internal', serviceName: 'ms1' }
            ]
          }
        ]
      })

      expect(updatedMfeConfig.systemParams).to.eql({
        api: { 'ms1-api': { url: 'http://localhost:8080' } }
      })
    })

  test
    .do(() => {
      const microservices: Microservice[] = [
        ...bundleDescriptor.microservices,
        ComponentHelper.newMicroservice('ms2')
      ]
      const microfrontends: MicroFrontend[] = [
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [
            { name: 'ms1-api', type: ApiType.Internal, serviceName: 'ms1' }
          ]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends, microservices }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
      mfeConfigService.writeMfeConfig('mfe1', {
        systemParams: {
          api: { 'ms1-api': { url: 'http://localhost:8080' } }
        }
      })
    })
    .command([
      'api add',
      'mfe1',
      'ms2-api',
      '--serviceName',
      'ms2',
      '--serviceUrl',
      'http://localhost:8081'
    ])
    .it(
      'adds a new internal api claim to an mfe having an existing api claim',
      () => {
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()
        const updatedMfeConfig: MfeConfig =
          mfeConfigService.getMfeConfig('mfe1')

        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...bundleDescriptor.microfrontends[0],
              apiClaims: [
                { name: 'ms1-api', type: 'internal', serviceName: 'ms1' },
                { name: 'ms2-api', type: 'internal', serviceName: 'ms2' }
              ]
            }
          ]
        })

        expect(updatedMfeConfig.systemParams).to.eql({
          api: {
            'ms1-api': { url: 'http://localhost:8080' },
            'ms2-api': { url: 'http://localhost:8081' }
          }
        })
      }
    )

  test
    .do(() => {
      fs.rmSync(mfeConfigService.getMfeConfigPath('mfe1'))
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .it(
      "adds an internal api claim to an mfe that doesn't have an existing mfe-config.json",
      () => {
        const updatedBundleDescriptor: BundleDescriptor =
          bundleDescriptorService.getBundleDescriptor()
        const updatedMfeConfig: MfeConfig =
          mfeConfigService.getMfeConfig('mfe1')

        expect(updatedBundleDescriptor).to.eql({
          ...bundleDescriptor,
          microfrontends: [
            {
              ...bundleDescriptor.microfrontends[0],
              apiClaims: [
                { name: 'ms1-api', type: 'internal', serviceName: 'ms1' }
              ]
            }
          ]
        })

        expect(updatedMfeConfig.systemParams).to.eql({
          api: { 'ms1-api': { url: 'http://localhost:8080' } }
        })
      }
    )

  test
    .stderr()
    .command([
      'api add',
      'nonexistent-mfe',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('nonexistent-mfe does not exist')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if microfrontend does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      bundleDescriptorService.writeBundleDescriptor({
        ...bundleDescriptor,
        microservices: []
      })
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('ms1 does not exist')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if microservice does not exist in the descriptor')

  test
    .stderr()
    .do(() => {
      const microfrontends = <MicroFrontend[]>[
        {
          ...bundleDescriptor.microfrontends[0],
          apiClaims: [{ name: 'ms1-api', type: 'internal', serviceName: 'ms1' }]
        }
      ]
      bundleDescriptor = { ...bundleDescriptor, microfrontends }
      bundleDescriptorService.writeBundleDescriptor(bundleDescriptor)
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain('API claim ms1-api already exists')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if API claim already exists')

  test
    .stderr()
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'invalidurl'
    ])
    .catch(error => {
      expect(error.message).to.contain('invalidurl is not a valid URL')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if serviceUrl is not a valid URL')

  test
    .stderr()
    .do(() => {
      fs.rmSync(BUNDLE_DESCRIPTOR_FILE_NAME, { force: true })
    })
    .command([
      'api add',
      'mfe1',
      'ms1-api',
      '--serviceName',
      'ms1',
      '--serviceUrl',
      'http://localhost:8080'
    ])
    .catch(error => {
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if current folder is not a Bundle project')

  test
    .command('api add')
    .catch(error => {
      expect(error.message).to.contain('Missing 2 required args')
      expect(error.message).to.contain('mfeName')
      expect(error.message).to.contain('claimName')
    })
    .it('exits with an error if required arguments are missing')
})
