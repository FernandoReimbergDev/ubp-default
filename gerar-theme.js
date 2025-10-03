const fs = require("fs");
const path = require("path");

const data = require("./cores.json");
const globalCssPath = path.join(__dirname, "src/app/globals.css");

let cssThemeBlock = "@theme inline {\n";

function parseColors(obj, prefix = []) {
  for (const key in obj) {
    const value = obj[key];
    const name = [...prefix, key].join("-");

    if (typeof value === "string") {
      cssThemeBlock += `  --color-${name}: ${value};\n`;
    } else if (typeof value === "object" && value !== null) {
      parseColors(value, [...prefix, key]);
    }
  }
}

parseColors(data);
cssThemeBlock += "}\n";

// Carrega o conteúdo atual do global.css
let globalCss = fs.readFileSync(globalCssPath, "utf8").trim();

// Divide o conteúdo em linhas
const lines = globalCss.split("\n");

// Garante que a primeira linha seja o import do tailwind
const firstLine = lines[0];
if (!firstLine.startsWith('@import "tailwindcss"')) {
  console.error("A primeira linha deve ser: @import \"tailwindcss\";");
  process.exit(1);
}

// Remove bloco anterior de @theme inline (se houver)
const restOfCss = lines.slice(1).join("\n").replace(/@theme inline \{[\s\S]*?\}/, "").trim();

// Reconstroi o conteúdo completo
const updatedCss = `${firstLine}\n\n${cssThemeBlock.trim()}\n\n${restOfCss}`.trim() + "\n";

fs.writeFileSync(globalCssPath, updatedCss, "utf8");
console.log("Bloco de tema inserido logo após o @import.");
