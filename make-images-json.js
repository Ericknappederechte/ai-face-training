const fs = require('fs');
const path = require('path');

const realDir = path.join('assets', 'images', 'real');
const fakeDir = path.join('assets', 'images', 'fake');

function listImages(dir) {
  return fs.readdirSync(dir)
    .filter(f => /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .map(f => dir.replace(/\\/g, '/') + '/' + f);
}

const real = listImages(realDir);
const fake = listImages(fakeDir);

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync(path.join('data', 'images.json'), JSON.stringify({ real, fake }, null, 2));

console.log('✅ data/images.json erstellt:', real.length, 'real,', fake.length, 'fake');
