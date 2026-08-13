// Generate the component registry object.
export function generateRegistry(components) {
    return [
        'export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {',
        components.map(component => `  ${component},`).join('\n').replace(/,$/, ''),
        '};',
        ''
    ].join('\n');
}

// Generate a component name array.
export function generateComponentArray(name, components) {
    return [
        `export const ${name} = [`,
        components.map(component => `  '${component}',`).join('\n').replace(/,$/, ''),
        '];',
        ''
    ].join('\n');
}

// Generate component imports.
export function generateImports(sources) {
    return [
        "import React from 'react';",
        ...sources.map(source => source.generateImport(source.components))
    ];
}