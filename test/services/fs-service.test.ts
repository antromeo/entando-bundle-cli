import { expect, test } from '@oclif/test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { SVC_FOLDER, RESOURCES_FOLDER } from '../../src/paths'
import { FSService } from '../../src/services/fs-service'
import { TempDirHelper } from '../helpers/temp-dir-helper'

describe('fs-service', () => {
  const tempDirHelper = new TempDirHelper(__filename)
  const defaultBundleName = 'fs-mi'
  const writeJSONtestFile = 'fs-service-writejson-test'

  before(() => {
    // creating a subfolder for testing the existing bundle case
    fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, 'existing-bundle'))
  })

  afterEach(() => {
    if (fs.existsSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))) {
      fs.rmSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName), {
        recursive: true,
        force: true
      })
    }
  })

  after(() => {
    fs.rmSync(path.resolve(os.tmpdir(), writeJSONtestFile))
  })

  test.it('run getBundleDirectory', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(filesys.getBundleDirectory()).to.eq(
      path.resolve(tempDirHelper.tmpDir, defaultBundleName)
    )
  })

  test.it('run getBundleFilePath', () => {
    const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
    expect(filesys.getBundleFilePath('a', 'b')).to.eq(
      path.resolve(tempDirHelper.tmpDir, defaultBundleName, 'a', 'b')
    )
  })

  test
    .do(() => {
      fs.mkdirSync(
        path.resolve(tempDirHelper.tmpDir, defaultBundleName, SVC_FOLDER),
        { recursive: true }
      )
    })
    .it(
      'run createFileFromTemplate with replaces from placeholder to bundle name',
      () => {
        const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
        const placeholder = '%BUNDLENAME%'
        filesys.createFileFromTemplate(
          [SVC_FOLDER, 'mysql.yml'],
          path.join(SVC_FOLDER, 'default-mysql.yml'),
          { [placeholder]: defaultBundleName }
        )
        const filePath = path.resolve(
          tempDirHelper.tmpDir,
          defaultBundleName,
          SVC_FOLDER,
          'mysql.yml'
        )
        const templateFileContent = fs.readFileSync(
          path.resolve(
            __dirname,
            '..',
            '..',
            'src',
            RESOURCES_FOLDER,
            SVC_FOLDER,
            'default-mysql.yml'
          ),
          'utf8'
        ) as string
        const convertedContent = templateFileContent.replace(
          new RegExp(placeholder, 'g'),
          defaultBundleName
        )
        expect(fs.existsSync(filePath)).to.eq(true)
        expect(fs.readFileSync(filePath, 'utf-8')).to.eq(convertedContent)
      }
    )

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))
    })
    .it('run createSubDirectoryIfNotExist', () => {
      const filesys = new FSService(defaultBundleName, tempDirHelper.tmpDir)
      filesys.createSubDirectoryIfNotExist('wowo')
      const filePath = path.resolve(
        tempDirHelper.tmpDir,
        defaultBundleName,
        'wowo'
      )
      expect(fs.existsSync(filePath)).to.eq(true)
    })

  test.it('writeJSON writes JSON data to file', () => {
    const tmpFilePath = path.resolve(os.tmpdir(), writeJSONtestFile)

    const filePath = path.resolve(os.tmpdir(), tmpFilePath)
    const data = { test: 'testvalue' }
    FSService.writeJSON(filePath, data)

    const result = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    expect(result).to.eql(data)
  })

  test
    .do(() => {
      fs.mkdirSync(path.resolve(tempDirHelper.tmpDir, defaultBundleName))
    })
    .it(
      'run create directories recursively when `recursive` option is true',
      () => {
        const data = 'Test data'
        const options = { recursive: true }
        const filePath = path.resolve(
          tempDirHelper.tmpDir,
          defaultBundleName,
          'path',
          'to',
          'nonexistent',
          'file.txt'
        )

        FSService.writeFileSyncRecursive(filePath, data, options)

        expect(fs.existsSync(filePath))
      }
    )
})
