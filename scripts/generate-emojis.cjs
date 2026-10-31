// Regenera el catálogo desde los datos oficiales de Unicode Emoji y CLDR.
// Fuentes: https://www.unicode.org/Public/emoji/latest/emoji-test.txt
// https://github.com/unicode-org/cldr-json/tree/main/cldr-json
// Licencia de datos Unicode: https://www.unicode.org/license.txt
const fs = require('node:fs');
const path = require('node:path');

const sources = [
  'https://www.unicode.org/Public/emoji/latest/emoji-test.txt',
  'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-full/annotations/es/annotations.json',
  'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-derived-full/annotationsDerived/es/annotations.json',
];
const localFiles = process.argv.slice(2);
const groups = {
  'Smileys & Emotion': ['caras', 'Caras y emociones', '😀'],
  'People & Body': ['personas', 'Personas y cuerpo', '🙋'],
  'Animals & Nature': ['naturaleza', 'Animales y naturaleza', '🐼'],
  'Food & Drink': ['comida', 'Comida y bebida', '🍕'],
  'Travel & Places': ['viajes', 'Viajes y lugares', '🚗'],
  Activities: ['actividades', 'Actividades', '⚽'],
  Objects: ['objetos', 'Objetos', '💡'],
  Symbols: ['simbolos', 'Símbolos', '❤️'],
  Flags: ['banderas', 'Banderas', '🏳️'],
};

async function read(index) {
  if (localFiles[index]) return fs.readFileSync(localFiles[index], 'utf8');
  const response = await fetch(sources[index]);
  if (!response.ok) throw new Error(`${sources[index]}: HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const [emojiText, basicText, derivedText] = await Promise.all([0, 1, 2].map(read));
  const version = emojiText.match(/^# Version: ([\d.]+)/m)?.[1];
  if (version !== '18.0') throw new Error(`Se esperaba Unicode Emoji 18.0; llegó ${version || 'desconocida'}`);
  const basic = JSON.parse(basicText).annotations.annotations;
  const derived = JSON.parse(derivedText).annotationsDerived.annotations;
  const catalog = Object.fromEntries(Object.entries(groups).map(([english, [id, label, icon]]) => [english, { id, label, icon, items: [] }]));
  let group = '';
  let count = 0;
  for (const line of emojiText.split(/\r?\n/)) {
    const heading = line.match(/^# group: (.+)/);
    if (heading) { group = heading[1]; continue; }
    const match = line.match(/^[0-9A-F ]+\s*;\s*fully-qualified\s*#\s*(\S+)\s+E[\d.]+\s+(.+)$/u);
    if (!match || !catalog[group]) continue;
    const [, symbol, englishName] = match;
    const plain = symbol.replace(/\uFE0F/g, '');
    const annotation = basic[symbol] || derived[symbol] || basic[plain] || derived[plain];
    const spanishName = annotation?.tts?.[0] || englishName;
    catalog[group].items.push([symbol, spanishName]);
    count++;
  }
  if (count !== 3963) throw new Error(`El catálogo tiene ${count} emojis, se esperaban 3963`);
  const destination = path.resolve(__dirname, '../src/features/emojiCatalog.ts');
  const source = `// Generado desde Unicode Emoji ${version} (secuencias fully-qualified) y Unicode CLDR en español.\n` +
    `// https://www.unicode.org/Public/emoji/latest/emoji-test.txt\n` +
    `// https://www.unicode.org/license.txt\n` +
    `export const EMOJI_VERSION = ${JSON.stringify(version)};\n` +
    `export type EmojiGroup = { id: string; label: string; icon: string; items: [string, string][] };\n` +
    `export const EMOJI_GROUPS: EmojiGroup[] = ${JSON.stringify(Object.values(catalog))};\n`;
  fs.writeFileSync(destination, source, 'utf8');
  console.log(JSON.stringify({ version, count, bytes: Buffer.byteLength(source), groups: Object.fromEntries(Object.entries(catalog).map(([key, value]) => [key, value.items.length])) }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
