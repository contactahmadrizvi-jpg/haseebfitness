// Build script to inject environment variables into index.html
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Haseeb Fitness CRM...\n');

// Read the index.html template
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Environment variables to inject
const envVars = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || ''
};

// Check if all variables are set
const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\n⚠️  Build will continue but app may not work correctly.\n');
}

// Replace placeholders with actual values
Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `%${key}%`;
    html = html.replace(new RegExp(placeholder, 'g'), value);
    console.log(`✓ Injected ${key}`);
});

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Write the built file
const outputPath = path.join(distDir, 'index.html');
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`\n✅ Build complete! Output: ${outputPath}\n`);
