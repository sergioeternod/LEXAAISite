import fs from 'fs';

const inputPath = 'public/edomex_distritos.json';
const outputPath = 'public/edomex_distritos_simplified.json';

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function simplifyCoordinates(coords: any) {
  if (Array.isArray(coords)) {
    return coords.map(simplifyCoordinates);
  } else if (typeof coords === 'number') {
    return Math.round(coords * 10000) / 10000;
  }
  return coords;
}

data.features.forEach((feature: any) => {
  feature.geometry.coordinates = simplifyCoordinates(feature.geometry.coordinates);
});

fs.writeFileSync(outputPath, JSON.stringify(data));
console.log('Simplified GeoJSON saved to', outputPath);
