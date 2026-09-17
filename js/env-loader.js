/**
 * Environment Configuration Loader
 * This module provides Firebase configuration
 */

// Environment configuration object with your Firebase credentials
const ENV_CONFIG = {
    FIREBASE_API_KEY: "AIzaSyAZxjBphOXVoT-zHubrVWUjrzawP8W7X1g",
    FIREBASE_AUTH_DOMAIN: "haseebfitness-808b2.firebaseapp.com",
    FIREBASE_PROJECT_ID: "haseebfitness-808b2",
    FIREBASE_STORAGE_BUCKET: "haseebfitness-808b2.firebasestorage.app",
    FIREBASE_MESSAGING_SENDER_ID: "403982933479",
    FIREBASE_APP_ID: "1:403982933479:web:abdde5ed70281ce3e8f142",
    FIREBASE_MEASUREMENT_ID: "G-Y0D40LTX7L",
    ADMIN_EMAIL: "admin@haseebfitness.com"
};

// Export configuration to window object
window.ENV = ENV_CONFIG;

// Log configuration status
console.log('✅ Environment configuration loaded');
console.log('📱 Project ID:', ENV_CONFIG.FIREBASE_PROJECT_ID);
console.log('🔐 Admin Email:', ENV_CONFIG.ADMIN_EMAIL);
