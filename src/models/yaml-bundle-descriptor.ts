import {
  ApiClaim,
  DBMS,
  EnvironmentVariable,
  ExternalApiClaim,
  Nav,
  Permission
} from './bundle-descriptor'

export type YamlWidgetDescriptor = {
  code: string
  titles: { [lang: string]: string }
  group: string
  version: string
  apiClaims?: Array<ApiClaim | ExternalApiClaim>
  nav?: Nav[]
}

export type YamlPluginDescriptor = {
  descriptorVersion: 'v4'
  image: string
  deploymentBaseName?: string
  dbms: DBMS
  ingressPath?: string
  healthCheckPath?: string
  roles?: string[]
  permissions?: Permission[]
  securityLevel?: string
  environmentVariables?: EnvironmentVariable[]
}

export type YamlBundleDescriptor = {
  code: string
  description?: string
  components: {
    plugins: string[]
    widgets: string[]
  }
  global?: {
    nav: Nav[]
  }
}
