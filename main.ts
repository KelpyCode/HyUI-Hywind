import { writeFileSync } from "node:fs";
import colors from "npm:tailwindcss/colors"
import { oklchStringToRgb255 } from './color.ts';


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


let gen = "";


gen += "<style>\n"



type StyleRule = {
  selector: string;
  properties: StyleProperty[];
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
  return result;
}

function simpleRule(selector: string, property: string, value: string): StyleRule {
  return {
    selector: selector,
    properties: [
      {
        property: property,
        value: value
      }
    ]
  };
}

function simpleMappedRules(selectorPrefix: string, property: string, values: string[]): StyleRule[] {
  return values.map((value, index) => ({
    selector: `${selectorPrefix}-${value}`,
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
    properties: [
      {
        property: "font-size",
        value: `${sizeValue}`
      }
    ]
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
        properties: [
          {
            property: "background-color",
            value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
          }
        ]
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
            properties: [
              {
                property: "background-color",
                value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
              }
            ]
          };
          rules.push(rule);
        }
      }
    }
  }
}


for (const [name, value] of Object.entries(colors)) {
  if (typeof value === "string") {
    // Single color
    const rgb = oklchStringToRgb255(value);
    if (rgb) {
      const rule: StyleRule = {
        selector: `.text-${name}`,
        properties: [
          {
            property: "color",
            value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
          }
        ]
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
            properties: [
              {
                property: "color",
                value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
              }
            ]
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
