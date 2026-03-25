const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Colors
content = content.replace(/text-white\/20/g, 'text-[var(--text-muted)]');
content = content.replace(/text-white\/30/g, 'text-[var(--text-secondary)]');
content = content.replace(/text-white\/40/g, 'text-[var(--text-secondary)]');
content = content.replace(/text-white\/50/g, 'text-[var(--text-secondary)]');
content = content.replace(/text-white\/70/g, 'text-[var(--text-primary)]');
content = content.replace(/text-white\/90/g, 'text-[var(--text-primary)]');

// Backgrounds
content = content.replace(/bg-white\/5/g, 'bg-[var(--glass-bg)]');
content = content.replace(/bg-white\/10/g, 'bg-[var(--glass-border)]');
content = content.replace(/bg-black\/20/g, 'bg-[var(--glass-bg)]');

// Borders
content = content.replace(/border-white\/5/g, 'border-[var(--glass-border)]');
content = content.replace(/border-white\/10/g, 'border-[var(--glass-border)]');
content = content.replace(/border-white\/20/g, 'border-[var(--glass-border)]');

// Hover states
content = content.replace(/hover:text-white(?![\/\w])/g, 'hover:text-[var(--text-primary)]');
content = content.replace(/hover:bg-white\/5/g, 'hover:bg-[var(--glass-bg)]');
content = content.replace(/hover:bg-white\/10/g, 'hover:bg-[var(--glass-border)]');

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced successfully.');
