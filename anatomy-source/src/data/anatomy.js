import italianNames from './names.it.json';
import latinNames from './names.la.json';
import geometryNotes from '../../public/data/geometry-notes.json';
// The assembled atlas retains the original English identifiers and .l/.r sides.
// The independent Z-Anatomy Latin lexicon is retained under CC BY-SA 4.0.

import { asset } from '../utils/paths.js';
import slovakNames from './names.sk.json';

const SIDE_SUFFIX = { '.l': 'left', '.r': 'right' };

const SIDE_LABEL = {
  it: { left: 'sinistro', right: 'destro' },
  en: { left: 'left', right: 'right' },
  la: { left: 'sinistra', right: 'dextra' },
  sk: { left: 'ľavá strana', right: 'pravá strana' }
};

export const SYSTEM_IDS = [
  'skeletal',
  'muscular',
  'joints',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'visceral'
];

// System loaded on startup. The others are fetched when the user enables them,
// so the initial payload stays around 2 MB instead of ~47 MB.
export const DEFAULT_SYSTEM = 'skeletal';

export function splitSide(meshName) {
  const suffix = meshName.slice(-2);
  const side = SIDE_SUFFIX[suffix];
  return side
    ? { base: meshName.slice(0, -2), side }
    : { base: meshName, side: null };
}

export function formatPartName(meshName, lang = 'it') {
  const { base, side } = splitSide(meshName);

  // Z-Anatomy wraps structures outside the official terminology in parentheses.
  const clean = base.replace(/^\((.*)\)$/, '$1').trim();
  const labelName = lang === 'sk' ? (slovakNames[base] || slovakNames[base.toLowerCase()] || clean) : lang === 'it' ? (italianNames[base]||clean) : lang==='la' ? (latinNames[base]||clean) : clean;
  if (!side) return labelName;

  const label = (SIDE_LABEL[lang] || SIDE_LABEL.en)[side];
  return `${labelName} (${label})`;
}

export async function loadSystemsData() {
  const response = await fetch(asset('data/systems.json'));
  if (!response.ok) {
    throw new Error(`systems.json: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Latin names and the non-official-terminology flag, extracted from the
// Z-Anatomy source file by tools/export-lexicon.py.
export async function loadLexicon() {
  try {
    const response = await fetch(asset('data/lexicon.json'));
    return response.ok ? await response.json() : {};
  } catch {
    return {};
  }
}

// Definitions are an order of magnitude larger than the rest of the data, so
// they are fetched once in the background rather than blocking the first frame.
let definitionsPromise = null;

export function loadDefinitions() {
  if (!definitionsPromise) {
    definitionsPromise = fetch(asset('data/definitions.json'))
      .then(response => (response.ok ? response.json() : {}))
      .catch(() => ({}));
  }
  return definitionsPromise;
}

// Builds the part dictionary the store expects, keyed by mesh name because that
// is what loadModel.js registers as partId.
export function buildPartsData(systemsData, lexicon = {}) {
  const parts = {};

  Object.entries(systemsData).forEach(([systemId, meshNames]) => {
    meshNames.forEach(meshName => {
      const { base, side } = splitSide(meshName);
      const entry = lexicon[base] || {};

      parts[meshName] = {
        id: meshName,
        schematic:!!geometryNotes[meshName]?.schematic,
        meshName,
        name: {
          it: formatPartName(meshName, 'it'),
          en: formatPartName(meshName, 'en'),
          sk: formatPartName(meshName, 'sk'),
          la: (entry.la||latinNames[base]) ? (entry.la||latinNames[base])+(side ? ' ('+(side==='left'?'sinistra':'dextra')+')' : '') : formatPartName(meshName,'la')
        },
        baseName: base,
        side,
        system: systemId,
        latinName: entry.la || latinNames[base] || '',
        // Z-Anatomy parenthesises names that are not in Terminologia Anatomica.
        official: entry.official !== false
      };
    });
  });

  return parts;
}
