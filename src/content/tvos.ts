import { NamingHelper, CSSHelper, ColorFormat, StringCase, FileHelper } from "@supernovaio/export-helpers"
import { ColorToken, OutputFileType, OutputTextFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "config"

export function createTVOSVariables(tokens: Token[], tokenGroups: TokenGroup[]){
// Convert all color tokens to XML variables
  const mappedTokens = new Map(tokens.map((token) => [token.id, token]))
  const variables = tokens
    .filter((t) => t.tokenType === TokenType.color)

  let output : OutputTextFile[] = []
  variables.forEach((t) => output.push(createToken(t, tokenGroups)))
  return output;
}

function createToken(token, mappedTokens){
  const output = {
    "colors": [{
      "color" : {
        "color-space" : "srgb",
        "components" : {
          "alpha" : `${(Math.round(token.value.opacity.measure * 100) / 100).toFixed(2)}`,
          "blue" : `${token.value.color.b}`,
          "green" : `${token.value.color.g}`,
          "red" : `${token.value.color.r}`
        }
      },
      "idiom" : "universal"
    }],
    "info" : {
      "author" : "xcode",
      "version" : 1
    }
  }
  return (
    FileHelper.createTextFile({
      relativePath: `./apple/tvos/${tokenVariableName(token, mappedTokens)}.colorset/`,
      fileName: "Contents.json",
      content: JSON.stringify(output, null, "\t"),
    }))
}

function tokenVariableName(token: Token, tokenGroups: Array<TokenGroup>): string {
    const parent = tokenGroups.find((group) => group.id === token.parentGroupId)!
    return NamingHelper.codeSafeVariableNameForToken(token, StringCase.camelCase, parent, "")
  }