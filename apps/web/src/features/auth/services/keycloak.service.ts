import Keycloak from 'keycloak-js'
import { appConfig } from '@shared/config'

export const keycloak = new Keycloak({
  url: appConfig.keycloak.url,
  realm: appConfig.keycloak.realm,
  clientId: appConfig.keycloak.clientId,
})
