# PWA Icons

Ce dossier contient les icones pour la Progressive Web App (PWA).

## Generation des icones

Pour generer les icones PNG a partir du SVG, vous pouvez utiliser:

### Option 1: ImageMagick (ligne de commande)
```bash
# Installer ImageMagick si necessaire
# apt-get install imagemagick

# Generer toutes les tailles
for size in 72 96 128 144 152 192 384 512; do
  convert -background none icon.svg -resize ${size}x${size} icon-${size}.png
done
```

### Option 2: Sharp (Node.js)
```javascript
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icon-${size}.png`);
});
```

### Option 3: Outils en ligne
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Fichiers requis

- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192) - Principal
- icon-384.png (384x384)
- icon-512.png (512x512) - Principal

## Notes

Les icones avec `purpose: "maskable"` doivent avoir une zone de securite de 10% autour du contenu principal pour s'adapter aux differentes formes d'icones sur les appareils.
