const fs = require('fs'); let lines = fs.readFileSync('public/pacman.html', 'utf-8').split('\n'); lines.splice(1500, 11); fs.writeFileSync('public/pacman.html', lines.join('\n'));
