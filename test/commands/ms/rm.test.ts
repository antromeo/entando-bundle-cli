import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { TempDirHelper } from '../../helpers/temp-dir-helper'
import {
  BundleDescriptorService,
  MISSING_DESCRIPTOR_ERROR
} from '../../../src/services/bundle-descriptor-service'
import { MicroserviceService } from '../../../src/services/microservice-service'
import { DBMS, Microservice } from '../../../src/models/bundle-descriptor'
import { MicroserviceStack } from '../../../src/models/component'
import {
  DESCRIPTORS_OUTPUT_FOLDER,
  GITKEEP_FILE,
  MICROSERVICES_FOLDER
} from '../../../src/paths'
import { BundleDescriptorConverterService } from '../../../src/services/bundle-descriptor-converter-service'
import { ComponentDescriptorService } from '../../../src/services/component-descriptor-service'
import { CLIError } from '@oclif/errors'

describe('Remove Microservice', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  let tempBundleDir: string

  test
    .stub(
      ComponentDescriptorService.prototype,
      'getComponentVersion',
      () => '0.0.1'
    )
    .do(() => {
      tempBundleDir = tempDirHelper.createInitializedBundleDir(
        'test-bundle-existing-ms'
      )
      const ms: Microservice = {
        name: 'test-ms',
        dbms: DBMS.MySQL,
        stack: MicroserviceStack.SpringBoot,
        healthCheckPath: '/api/health'
      }
      const microserviceService = new MicroserviceService()
      microserviceService.addMicroservice(ms)
      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()

      const bundleDescriptorConverterService =
        new BundleDescriptorConverterService('test-docker-org')
      bundleDescriptorConverterService.generateYamlDescriptors({})

      expect(
        bundleDescriptor.microservices.some(ms => ms.name === 'test-ms')
      ).to.be.equal(true)
    })
    .command(['ms rm', 'test-ms'])
    .it('Removes an existing Microservice', function () {
      const bundleDescriptorService = new BundleDescriptorService()
      const bundleDescriptor = bundleDescriptorService.getBundleDescriptor()
      const outputDescriptorPath: string = path.resolve(
        tempBundleDir,
        ...DESCRIPTORS_OUTPUT_FOLDER,
        'plugins',
        'test-ms.yaml'
      )

      expect(
        bundleDescriptor.microservices.some(ms => ms.name === 'test-ms')
      ).to.be.equal(false)
      expect(fs.existsSync(outputDescriptorPath)).to.eq(false)
    })

  test
    .do(() => tempDirHelper.createInitializedBundleDir('test-bundle-no-ms'))
    .command(['ms rm', 'not-existing-bundle'])
    .catch(error => {
      expect(error.message).to.contain('not found')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it("Returns error if Microservice to remove doesn't exist")

  test
    .do(() => tempDirHelper.createUninitializedBundleDir())
    .command(['ms rm', 'test-bundle'])
    .catch(error => {
      expect(error.message).to.contain(MISSING_DESCRIPTOR_ERROR)
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('Returns error if Bundle directory not initialized')

  test
    .stdout()
    .stderr()
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-remove-all-ms')
      expect(
        fs.existsSync(path.join(MICROSERVICES_FOLDER, GITKEEP_FILE))
      ).to.eq(true)
    })
    .command(['ms add', 'ms1'])
    .command(['ms add', 'ms2'])
    .command(['ms rm', 'ms1'])
    .do(() => {
      expect(
        fs.existsSync(path.join(MICROSERVICES_FOLDER, GITKEEP_FILE))
      ).to.eq(false)
    })
    .command(['ms rm', 'ms2'])
    .it(`Restores ${GITKEEP_FILE} when last microservice is removed`, () => {
      expect(
        fs.existsSync(path.join(MICROSERVICES_FOLDER, GITKEEP_FILE))
      ).to.eq(true)
    })

  test
    .do(() => {
      tempDirHelper.createInitializedBundleDir('test-bundle-ms-rm-missingargs')
    })
    .command('ms rm')
    .catch(error => {
      expect(error.message).to.contain('Missing 1 required arg')
      expect(error.message).to.contain('name')
      expect((error as CLIError).oclif.exit).eq(2)
    })
    .it('exits with an error if required argument is missing')
})
