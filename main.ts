import { writeFileSync } from "node:fs";
import colors from "npm:tailwindcss/colors"
import { oklchStringToRgb255 } from './color.ts';
import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";



const DEFINITIONS = {
  padding: {
    amount: 10,
    scale: 2
  },
  textSize: {
    xs: 10,
    sm: 13,
    md: 16,
    lg: 20,
    xl: 24
  },
  layoutValues: [
    "left",
    "center",
    "right",
    "top",
    "middle",
    "bottom",
    "topscrolling",
    "bottomscrolling",
    "middlecenter",
    "centermiddle",
    "leftcenterwrap",
    "rightcenterwrap",
    "full",
  ],
  anchors: {
    "0": 0,
    "1": 2,
    "2": 4,
    "3": 6,
    "4": 8,
    "5": 10,
    "6": 12,
    "7": 14,
    "8": 16,
    "9": 18,
    "10": 20,
    "xs": 5,
    "sm": 10,
    "md": 20,
    "lg": 30,
    "xl": 40,
    "2xl": 50,
    "3xl": 60,
    "4xl": 70,
    "5xl": 80,
    "6xl": 90,
    "7xl": 100,
    "8xl": 110,
    "9xl": 120
  },
  sizes: {
    xs: 10,
    sm: 20,
    md: 40,
    lg: 80,
    xl: 160,
    "2xl": 200,
    "3xl": 300,
    "4xl": 400,
    "5xl": 500,
    "6xl": 600,
    "7xl": 700,
    "8xl": 800,
    "9xl": 900
  }
}


let metadata = {
  classes: [] as Array<{ className: string, description?: string, previewColor?: { r: number, g: number, b: number }, code?: string, origin?: Origin }>,
  props: [] as Array<{ propName: string, description?: string, origin?: Origin }>
}

async function fetchAttributeData() {
  const ATTRIBUTES_URL = "https://hyui.gitbook.io/docs/home/hyuiml-htmlish-in-hytale";
  // Fetch url and get string body
  const attributesResponse = await fetch(ATTRIBUTES_URL);
  const attributesHtml = await attributesResponse.text();

  const dom = new DOMParser().parseFromString(attributesHtml, "text/html");
  if (!dom) {
    console.error("Failed to parse attributes HTML");
    return;
  }

  const attributesHeader = dom.querySelector("h2#attributes");
  // Go two siblings down to get the ul list
  let ulElement: Element | null = attributesHeader;
  for (let i = 0; i < 2; i++) {
    if (ulElement) {
      ulElement = ulElement.nextElementSibling;
    }
  }

  ulElement?.querySelectorAll("li").forEach(li => {
    const content = li.textContent.trim();
    // Split at first :
    const colonIndex = content.indexOf(":");
    if (colonIndex !== -1) {
      const attributeName = content.slice(0, colonIndex).trim();
      const attributeDescription = content.slice(colonIndex + 1).trim();

      attributeName.split(",").forEach(namePart => {
        metadata.props.push({
          propName: namePart.trim(),
          description: attributeDescription
        });
      });


    }
  });
}

await fetchAttributeData();

// Escape HTML but turn actual HTML tags into visible <code> blocks.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlWithCodeBlocks(input: string): string {
  const tagRegex = /<[^>]*>/g;
  let lastIndex = 0;
  let result = "";
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(input)) !== null) {
    const index = match.index;
    // text before the tag: escape normally
    result += escapeHtml(input.slice(lastIndex, index));
    // the tag itself: show as escaped inside a <code> block
    const tag = match[0];
    result += `<code>${escapeHtml(tag)}</code>`;
    lastIndex = index + tag.length;
  }

  if (lastIndex < input.length) {
    result += escapeHtml(input.slice(lastIndex));
  }

  return result;
}


let gen = "";
gen += "<style>\n"


enum Origin {
  Other = "",
  HyUI = "HyUI",
  Hywind = "Hywind"
}


type StyleRule = {
  selector: string;
  description?: string;
  previewColor?: { r: number, g: number, b: number };
  properties: StyleProperty[];
  origin?: Origin;
  code?: string;
}

type StyleProperty = {
  property: string;
  value: string;
}

const rules: StyleRule[] = [];

function generateStyleRule(rule: StyleRule): string {
  let result = `${rule.selector} { `;
  for (const prop of rule.properties) {
    result += `${prop.property}: ${prop.value}; `;
  }
  result += `}\n`;

  const code = rule.properties.map(p => `${p.property}: ${p.value}`).join("; ");
  let newDescription = escapeHtmlWithCodeBlocks(rule.description ?? "");

  metadata.classes.push({
    className: rule.selector.replace(".", "").replaceAll("\\", ""),
    description: newDescription,
    origin: rule.origin ?? Origin.Other,
    code,
    previewColor: rule.previewColor
  })
  return result;
}

function metadataClass(className: string, description?: string) {
  metadata.classes.push({
    className,
    origin: Origin.HyUI,
    description: description ? escapeHtmlWithCodeBlocks(description) : undefined
  });
}

function simpleRule(selector: string, property: string, value: string, description?: string, previewColor?: { r: number, g: number, b: number }): StyleRule {
  return {
    selector: selector,
    description: escapeHtmlWithCodeBlocks(description ?? ""),
    previewColor: previewColor,
    origin: Origin.Hywind,
    properties: [
      {
        property: property,
        value: value
      }
    ]
  };
}

function simpleMappedRules(selectorPrefix: string, property: string, values: string[], description?: (value: string) => string): StyleRule[] {
  return values.map((value, index) => ({
    selector: `${selectorPrefix}-${value}`,
    description: description ? description(value) : undefined,
    origin: Origin.Hywind,
    properties: [
      {
        property: property,
        value: value
      }
    ]
  }));
}


// Padding

for (let i = 0; i <= DEFINITIONS.padding.amount; i++) {
  const rule: StyleRule = {
    selector: `.p-${i}`,
    origin: Origin.Hywind,
    properties: [
      {
        property: "padding",
        value: `${DEFINITIONS.padding.scale * i}`
      }
    ]
  };
  rules.push(rule);
}


// Flex
rules.push(
  simpleRule(".flex > *", "flex-weight", "1"),
  simpleRule(".flex-col", "layout-mode", "left"),
  simpleRule(".flex-row", "layout-mode", "top"),
  ...simpleMappedRules(".flex", "flex-weight", ["0", "1", "2", "3", "4"]),
  simpleRule(".text-uppercase", "text-transform", "uppercase"),
  simpleRule(".hidden", "visibility", "hidden"),
  simpleRule(".none", "display", "none"),
  simpleRule(".hidden", "visibility", "hidden"),
  ...simpleMappedRules(".text", "text-align", DEFINITIONS.layoutValues),
  ...simpleMappedRules(".layout", "layout", DEFINITIONS.layoutValues),
  ...simpleMappedRules(".font", "font-weight", ["bold", "normal"]),
  ...simpleMappedRules(".vertical", "vertical-align", ["top", "middle", "bottom"]),
  ...simpleMappedRules(".horizontal", "horizontal-align", ["left", "center", "right"])
)

metadataClass("tab-content", "(div) Tab content container linked to a tab ID.")
metadataClass("decorated-container", "(div) Uses the decorated container UI file for a styled frame.")
metadataClass("container", "(div) Uses the container UI file for a frame with minimal style.")
metadataClass("item-icon", "(span) Displays an item icon. Use data-hyui-item-id for the item icon.")
metadataClass("item-slot", "(span) Displays a full item slot. Use data-hyui-item-id for the item.")
metadataClass("item-grid", "(span) Displays an item grid container.")
metadataClass("item-grid-slot", "(span) Adds a slot entry inside an item grid.")
metadataClass("tabs", "(nav) Tab navigation bar.")

// Anchors

for (const anchor of ["top", "left", "bottom", "right"]) {
  rules.push(
    ...Object.entries(DEFINITIONS.anchors).map(([name, value]) => {
      return simpleRule(`.${anchor}-${name}`, `anchor-${anchor}`, `${value}`);
    })
  );

  rules.push(
    ...Object.entries(DEFINITIONS.anchors).filter(([name, value]) => value !== 0).map(([name, value]) => {
      return simpleRule(`.\\-${anchor}-${name}`, `anchor-${anchor}`, `-${value}`);
    })
  );
}

for (const anchor of [["width", "w"], ["height", "h"]]) {
  rules.push(
    ...Object.entries(DEFINITIONS.sizes).map(([name, value]) => {
      return simpleRule(`.${anchor[1]}-${name}`, `anchor-${anchor[0]}`, `${value}`);
    })
  );
}

// Text sizes
for (const [sizeName, sizeValue] of Object.entries(DEFINITIONS.textSize)) {
  const rule: StyleRule = {
    selector: `.text-${sizeName}`,
    origin: Origin.Hywind,
    properties: [
      {
        property: "font-size",
        value: `${sizeValue}`
      }
    ],
    description: `Sets text size to ${sizeName}`
  };
  rules.push(rule);
}

// Colors
for (const [name, value] of Object.entries(colors)) {
  if (typeof value === "string") {
    // Single color
    const rgb = oklchStringToRgb255(value);
    if (rgb) {
      const rule: StyleRule = {
        selector: `.bg-${name}`,
        origin: Origin.Hywind,
        properties: [
          {
            property: "background-color",
            value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
          }
        ],
        previewColor: rgb,
        description: `Sets background color to ${name}`
      };
      rules.push(rule);
    }
  } else if (typeof value === "object") {
    // Color scale
    for (const [shade, shadeValue] of Object.entries(value)) {
      if (typeof shadeValue === "string") {
        const rgb = oklchStringToRgb255(shadeValue);
        if (rgb) {
          const rule: StyleRule = {
            selector: `.bg-${name}-${shade}`,
            origin: Origin.Hywind,
            properties: [
              {
                property: "background-color",
                value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
              }
            ],
            previewColor: rgb,
            description: `Sets background color to ${name}`
          };
          rules.push(rule);
        }
      }
    }
  }
}

// Text color

for (const [name, value] of Object.entries(colors)) {
  if (typeof value === "string") {
    // Single color
    const rgb = oklchStringToRgb255(value);
    if (rgb) {
      const rule: StyleRule = {
        selector: `.text-${name}`,
        origin: Origin.Hywind,
        properties: [
          {
            property: "color",
            value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
          }
        ],
        previewColor: rgb,
        description: `Sets text color to ${name}`
      };
      rules.push(rule);
    }
  } else if (typeof value === "object") {
    // Color scale
    for (const [shade, shadeValue] of Object.entries(value)) {
      if (typeof shadeValue === "string") {
        const rgb = oklchStringToRgb255(shadeValue);
        if (rgb) {
          const rule: StyleRule = {
            selector: `.text-${name}-${shade}`,
            origin: Origin.Hywind,
            properties: [
              {
                property: "color",
                value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
              }
            ],
            previewColor: rgb,
            description: `Sets text color to ${name}`

          };
          rules.push(rule);
        }
      }
    }
  }
}




// Generate all rules
for (const rule of rules) {
  gen += generateStyleRule(rule);
}

gen += "</style>\n";

// Write to styles.html
writeFileSync("hywind.html", gen);
writeFileSync("hywind-meta.json", JSON.stringify(metadata, null, 2));
