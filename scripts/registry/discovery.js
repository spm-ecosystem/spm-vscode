import fs from 'node:fs';
import path from 'node:path';

// Discover components exported as individual .tsx files.
export function getDirectoryComponents(directory) {
    if (!fs.existsSync(directory)) {
        throw new Error(`Components directory not found: ${directory}`);
    }

    return fs.readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.startsWith('Ui') && entry.name.endsWith('.tsx'))
        .map(entry => path.basename(entry.name, '.tsx'))
        .sort();
}

// Discover components exported from a single TypeScript file.
export function getFileComponents(file) {
    if (!fs.existsSync(file)) {
        throw new Error(`Components file not found: ${file}`);
    }

    const content = fs.readFileSync(file, 'utf8');

    return [...content.matchAll(/export\s+function\s+(Ui[A-Za-z0-9]+)/g)]
        .map(match => match[1])
        .sort();
}