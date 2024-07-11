import { NamingHelper, CSSHelper, ColorFormat, StringCase, FileHelper } from "@supernovaio/export-helpers"
import { AnyDimensionToken, AnyToken, ColorToken, ColorTokenValue, GradientToken, OutputTextFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "config"

export function createXMLVariables(tokens: Token[], tokenGroups: TokenGroup[]){
// Convert all color tokens to XML variables
  const mappedTokens = new Map(tokens.map((token) => [token.id, token]))
  let output: OutputTextFile[] = [];

  const colors = tokens
    .filter((t) => t.tokenType === TokenType.color)
    .map((token) => colorTokenToXML(token as ColorToken, mappedTokens, tokenGroups))
  output.push(FileHelper.createTextFile({
    relativePath: "./android/ott/values/",
    fileName: "color.xml",
    content: `<?xml version="1.0" encoding="utf-8"?>\n\t<resources>\n${colors.join('\n')}\n\t</resources>`,
  }))
    
  const gradients = tokens
    .filter((t) => t.tokenType === TokenType.gradient)
    .forEach((t) => output.push(gradientToXML(t, mappedTokens, tokenGroups)))
  
  const dimensions = tokens
    .filter((t) => t.tokenType === TokenType.dimension)
    .map((token) => dimensionTokenToXML(token as AnyDimensionToken, mappedTokens, tokenGroups))
    output.push(FileHelper.createTextFile({
      relativePath: "./android/ott/values",
      fileName: `dimens.xml`,
      content: `<?xml version="1.0" encoding="utf-8"?>\n\t<resources>\n${dimensions.join('\n')}\n\t</resources>`,
    }))

  // Create output file and return it
  return output;
}

/** Exporter configuration. Adheres to the `ExporterConfiguration` interface and its content comes from the resolved default configuration + user overrides of various configuration keys */
const exportConfiguration = Pulsar.exportConfig<ExporterConfiguration>()

function colorTokenToXML(token: ColorToken, mappedTokens: Map<string, Token>, tokenGroups: Array<TokenGroup>): string {
  // First creating the name of the token, using helper function which turns any token name / path into a valid variable name
  const name = tokenVariableName(token, tokenGroups)
  // Then creating the value of the token, using another helper function
  const value = CSSHelper.colorTokenValueToCSS(token.value, mappedTokens, {
    allowReferences: true,
    decimals: 3,
    colorFormat: ColorFormat.smartHashHex,
    tokenToVariableRef: (t) => {
      return `\t\t<color name="${name}">${value}</color>`
    },
  })
  return `\t\t<color name="${name}">${value}</color>`
}

function dimensionTokenToXML(token: AnyDimensionToken, mappedTokens: Map<string, Token>, tokenGroups: Array<TokenGroup>): string {
  const name = tokenVariableName(token, tokenGroups)
  const value = Math.round(token.value.measure * 100) / 100
  let unit = 'dp';
  //console.log(`${name}: ${token.propertyValues["Collection"]}`)
  if (name.includes('letter_spacing') || name.includes('line_height') || name.includes('font_weight')) {
    return `\t\t<dimen name="${name}">${value}</dimen>`
  } else {
    return `\t\t<dimen name="${name}">${value}${unit}</dimen>`
  }
}

function gradientToXML(token, mappedTokens: Map<string, Token>, tokenGroups: Array<TokenGroup>): OutputTextFile {
  const name = tokenVariableName(token, tokenGroups)
  let stops = token.value[0].stops
  let output
  if (stops.length === 3) {
    output =
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
  android:shape="rectangle"
  name="${name}">
  <gradient
    android:angle="${calculateGradientAngle(token.value[0].from, token.value[0].to)}"
    android:endColor="${gradientValueBuilder(stops[2].color, mappedTokens)}"
    android:centerColor="${gradientValueBuilder(stops[1].color, mappedTokens)}"
    android:startColor="${gradientValueBuilder(stops[0].color, mappedTokens)}"
    android:type="${token.value[0].type}"/>
</shape>`
  } if (stops.length === 2) {
    output =
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle"
    name="${name}">
    <gradient
      android:angle="${calculateGradientAngle(token.value[0].from, token.value[0].to)}"
      android:endColor="${gradientValueBuilder(stops[1].color, mappedTokens)}"
      android:startColor="${gradientValueBuilder(stops[0].color, mappedTokens)}"
      android:type="${token.value[0].type}"/>\n</shape>`
  }
  return (
    FileHelper.createTextFile({
      relativePath: "./android/ott/drawable/",
      fileName: `${tokenVariableName(token, tokenGroups)}.xml`,
      content: output,
    }))
}

function gradientValueBuilder(token: ColorTokenValue, mappedTokens: Map<string, Token>){
  const value = CSSHelper.colorTokenValueToCSS(token, mappedTokens, {
    allowReferences: true,
    decimals: 3,
    colorFormat: ColorFormat.hex8,
    tokenToVariableRef: (t) => {
      return ``
    },
  })
  return `${value.slice(-2) + value.slice(0,-2)}`
}

// Calculates angle of gradient based on the start and end positions
function calculateGradientAngle(from, to) {
  const deltaY = (to.y - from.y);
  const deltaX = (to.x - from.x);
  const radians = Math.atan2(deltaY, deltaX); 
  let result = radians * 180 / Math.PI; 
  result = result + 90; 
  return  ((result < 0) ? (360 + result) : result) % 360;
}

function tokenVariableName(token: Token, tokenGroups: Array<TokenGroup>): string {
    const parent = tokenGroups.find((group) => group.id === token.parentGroupId)!
    return NamingHelper.codeSafeVariableNameForToken(token, StringCase.snakeCase, parent, "")
}