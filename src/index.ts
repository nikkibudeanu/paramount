import { FileHelper } from "@supernovaio/export-helpers"
import { Supernova, PulsarContext, RemoteVersionIdentifier, AnyOutputFile, TokenType, ColorToken, PulsarExecutor } from "@supernovaio/sdk-exporters"
import { createXMLVariables } from "./content/xml"
import { createRokuVariables } from "./content/roku"
import { createSCSSVariables } from "./content/scss"
import { createTVOSVariables } from "./content/tvos"

/**
 * Export entrypoint.
 * When running `export` through extensions or pipelines, this function will be called.
 * Context contains information about the design system and version that is currently being exported.
 */
Pulsar.export(async (sdk: Supernova, context: PulsarContext): Promise<Array<AnyOutputFile>> => {
  // Fetch data from design system that is currently being exported (context)
  const remoteVersionIdentifier: RemoteVersionIdentifier = {
    designSystemId: context.dsId,
    versionId: context.versionId,
  }

  const themes = await sdk.tokens.getTokenThemes({
    designSystemId: context.dsId,
    versionId: context.versionId,
  })

  const solidTokens = themes[0].overriddenTokens

  // Fetch the necessary data
  let tokens = await sdk.tokens.getTokens(remoteVersionIdentifier)
  let tokenGroups = await sdk.tokens.getTokenGroups(remoteVersionIdentifier)

  // Run token generation scripts
  let XMLTokens = createXMLVariables(tokens, tokenGroups)
  let RokuTokens = createRokuVariables(tokens, tokenGroups, solidTokens)
  let SCSSTokens = createSCSSVariables(tokens,tokenGroups)
  let TVOSTokens = createTVOSVariables(tokens, tokenGroups)

  // Build files and place them in corresponding directories
  const content = [
    FileHelper.createTextFile({
      relativePath: "./roku/",
      fileName: "skins.brs",
      content: RokuTokens,
    }),
    FileHelper.createTextFile({
      relativePath: "./ctv/",
      fileName: "constants.scss",
      content: SCSSTokens,
    })
  ]

  // For platforms with multiple files, push each file
  XMLTokens.forEach((t) => content.push(t))
  TVOSTokens.forEach((t) => content.push(t))

  return content;
})