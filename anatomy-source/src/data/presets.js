// Curated starting points. Each one is just a serialised view, which is what
// makes them free now that the whole state lives in the URL.
export const PRESETS = [
  {
    id: 'skeleton-front',
    label: { sk: 'Kostra spredu', en: 'Skeleton, front', it: 'Scheletro, anteriore', la: 'Skeleton ab anteriore' },
    hash: 'sys=skeletal&cam=0,0.86,2.6,0,0.86,0'
  },
  {
    id: 'thigh-muscles',
    label: { sk: 'Svaly stehna', en: 'Thigh muscles', it: 'Muscoli della coscia', la: 'Musculi femoris' },
    hash: 'sys=skeletal,muscular&cam=0.15,0.75,1.25,0.05,0.72,0'
  },
  {
    id: 'heart-vessels',
    label: { sk: 'Srdce a veľké cievy', en: 'Heart and great vessels', it: 'Cuore e grandi vasi', la: 'Cor et vasa magna' },
    hash: 'sys=cardiovascular&cam=0,1.28,0.75,0,1.28,0'
  }
];

// Applying a preset replaces the whole view, so it goes through the same path
// as opening a shared link.
export function applyPreset(preset) {
  const lang=document.documentElement.lang || 'sk';
  window.location.hash = preset.hash+'&lang='+lang;
  window.location.reload();
}
