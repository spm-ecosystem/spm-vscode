const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

export function createLogger(prefix) {
    const tag = `${c.bold}${c.magenta}[${prefix}]${c.reset}`;
    
    return {
        info: (msg) => 
            console.log(`${tag} ${c.cyan}${msg}${c.reset}`),
            
        step: (msg) => 
            console.log(`${tag} ${c.dim}→${c.reset} ${msg}`),
            
        success: (msg) => 
            console.log(`${tag} ${c.green}✓${c.reset} ${msg}`),
            
        warn: (msg) => 
            console.log(`${tag} ${c.yellow}⚠ ${msg}${c.reset}`),
            
        error: (msg) => 
            console.error(`${tag} ${c.red}✖ ${c.bold}${msg}${c.reset}`)
    };
}

export function createBrowserLogger(prefix) {
    const tagStyle = 'color: #c678dd; font-weight: bold; font-size: 11px; padding: 2px 0;';
    const resetStyle = 'color: inherit;';
    
    return {
        info: (msg) => 
            console.log(`%c[${prefix}]%c ${msg}`, tagStyle, 'color: #56b6c2;'),
            
        step: (msg) => 
            console.log(`%c[${prefix}]%c → ${msg}`, tagStyle, 'color: #abb2bf;'),
            
        success: (msg) => 
            console.log(`%c[${prefix}]%c ✓ ${msg}`, tagStyle, 'color: #98c379; font-weight: bold;'),
            
        warn: (msg) => 
            console.warn(`%c[${prefix}]%c ⚠ ${msg}`, tagStyle, 'color: #e5c07b;'),
            
        error: (msg) => 
            console.error(`%c[${prefix}]%c ✖ ${msg}`, tagStyle, 'color: #e06c75; font-weight: bold; font-size: 12px;')
    };
}