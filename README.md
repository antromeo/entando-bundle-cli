# entando-bundle-cli

Entando Bundle CLI, a tool to create and publish Entando bundles.

[![entando](https://img.shields.io/badge/entando-doc-brightgreen.svg)](https://dev.entando.org)
[![Build Status](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg)](https://github.com/entando/entando-bundle-cli/actions/workflows/post-merge.yml/badge.svg?branch=develop)

<!-- toc -->

- [entando-bundle-cli](#entando-bundle-cli)
- [Usage](#usage)
- [Commands](#commands)
- [Development environment setup](#development-environment-setup)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g entando-bundle-cli
$ entando-bundle-cli COMMAND
running command...
$ entando-bundle-cli (--version)
entando-bundle-cli/0.0.1-SNAPSHOT linux-x64 node-v14.19.1
$ entando-bundle-cli --help [COMMAND]
USAGE
  $ entando-bundle-cli COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`entando-bundle-cli help [COMMAND]`](#entando-bundle-cli-help-command)
- [`entando-bundle-cli init NAME`](#entando-bundle-cli-init-name)
- [`entando-bundle-cli list`](#entando-bundle-cli-list)
- [`entando-bundle-cli mfe add NAME`](#entando-bundle-cli-mfe-add-name)
- [`entando-bundle-cli ms add NAME`](#entando-bundle-cli-ms-add-name)
- [`entando-bundle-cli package`](#entando-bundle-cli-package)

## `entando-bundle-cli help [COMMAND]`

Display help for entando-bundle-cli.

```
USAGE
  $ entando-bundle-cli help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for entando-bundle-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `entando-bundle-cli init NAME`

Performs the scaffolding of a Bundle project (we'll add the possibility to init from hub later)

```
USAGE
  $ entando-bundle-cli init [NAME] [--version <value>] [--hub-url <value> --from-hub]

ARGUMENTS
  NAME  Bundle project name

FLAGS
  --from-hub         Initializes a bundle project from the Entando Hub
  --hub-url=<value>  Custom Entando Hub url
  --version=<value>  Project version

DESCRIPTION
  Performs the scaffolding of a Bundle project (we'll add the possibility to init from hub later)

EXAMPLES
  $ entando-bundle-cli init my-bundle

  $ entando-bundle-cli init my-bundle --version=0.0.1

  $ entando-bundle-cli init my-bundle --from-hub
```

_See code: [dist/commands/init.ts](https://github.com/entando/entando-bundle-cli/blob/v0.0.1-SNAPSHOT/dist/commands/init.ts)_

## `entando-bundle-cli list`

Lists the available components in the bundle

```
USAGE
  $ entando-bundle-cli list [--ms] [--mfe]

FLAGS
  --mfe  List only Micro Frontend components
  --ms   List only Micro Service components

DESCRIPTION
  Lists the available components in the bundle

EXAMPLES
  $ entando-bundle-cli list

  $ entando-bundle-cli list --ms

  $ entando-bundle-cli list --ms --mfe
```

_See code: [dist/commands/list.ts](https://github.com/entando/entando-bundle-cli/blob/v0.0.1-SNAPSHOT/dist/commands/list.ts)_

## `entando-bundle-cli mfe add NAME`

Adds a Micro Frontend component to the bundle

```
USAGE
  $ entando-bundle-cli mfe add [NAME] [--stack react|angular]

ARGUMENTS
  NAME  Name of the Micro Frontend component

FLAGS
  --stack=<option>  [default: react] Micro Frontend stack
                    <options: react|angular>

DESCRIPTION
  Adds a Micro Frontend component to the bundle

EXAMPLES
  $ entando-bundle-cli mfe add my-mfe

  $ entando-bundle-cli mfe add my-mfe --stack react
```

## `entando-bundle-cli ms add NAME`

Adds a Micro Service component to the bundle

```
USAGE
  $ entando-bundle-cli ms add [NAME] [--stack spring-boot|node]

ARGUMENTS
  NAME  Name of the Micro Service component

FLAGS
  --stack=<option>  [default: spring-boot] Micro Service stack
                    <options: spring-boot|node>

DESCRIPTION
  Adds a Micro Service component to the bundle

EXAMPLES
  $ entando-bundle-cli ms add my-ms

  $ entando-bundle-cli ms add my-ms --stack spring-boot
```

## `entando-bundle-cli package`

Generates the bundle Docker image

```
USAGE
  $ entando-bundle-cli package [-o <value>]

FLAGS
  -o, --org=<value>  Docker organization name

DESCRIPTION
  Generates the bundle Docker image

EXAMPLES
  $ entando-bundle-cli package

  $ entando-bundle-cli package --org=my-org
```

_See code: [dist/commands/package.ts](https://github.com/entando/entando-bundle-cli/blob/v0.0.1-SNAPSHOT/dist/commands/package.ts)_

<!-- commandsstop -->

# Development environment setup

It is suggested to install [nvm](https://github.com/nvm-sh/nvm). From the project root folder run:

```sh-session
nvm install
nvm use
```

If you are receiving `command not found` errors while executing pre-commit hooks with Husky using `nvm`, please refer to https://typicode.github.io/husky/#/?id=command-not-found

## Debugging

To print debug information define a static `debug` function using the `debugFactory`:

```
private static debug = debugFactory(MyClass)
```

Debug output can be enabled using the following environment variable:

```
ENTANDO_BUNDLE_CLI_DEBUG=true
```

Debug output is sent to stderr, so you can redirect it to a file in the following way:

```
entando-bundle-cli command 2>log.txt
```
