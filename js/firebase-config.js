/**
 * Firebase Configuration and Initialization
 * This module initializes Firebase services with secure configuration from environment
 */

// Wait for ENV to be loaded, then initialize
(function() {
    // Ensure ENV is available
    if (!window.ENV) {
        console.error('Environment configuration not loaded. Please ensure env-loader.js is included before this file.');
        return;
    }

    // Firebase configuration from environment variables
    const firebaseConfig = {
        apiKey: window.ENV.FIREBASE_API_KEY,
        authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
        projectId: window.ENV.FIREBASE_PROJECT_ID,
        storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
        appId: window.ENV.FIREBASE_APP_ID,
        measurementId: window.ENV.FIREBASE_MEASUREMENT_ID
    };

    // Admin email for authorization (only this email can access the system)
    const ADMIN_EMAIL = window.ENV.ADMIN_EMAIL;

    // Validate configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.error('Firebase configuration is incomplete. Please check your environment variables.');
        showToast('Configuration error. Please contact administrator.', 'error');
        return;
    }

    // Initialize Firebase
    let app;
    let auth;
    let db;

    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Enable offline persistence for better performance
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('The current browser does not support persistence.');
                }
            });
        
        console.log('✅ Firebase initialized successfully');
        console.log('📱 Project:', firebaseConfig.projectId);
        console.log('🔐 Admin:', ADMIN_EMAIL);
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        showToast('Firebase initialization failed. Please refresh the page.', 'error');
    }

    // Collection reference
    const MEMBERS_COLLECTION = 'members';

    // Helper function to get current user
    function getCurrentUser() {
        return auth.currentUser;
    }

    // Helper function to check if user is admin
    function isAdmin(user) {
        if (!user || !user.email) return false;
        return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    }

    // Export for use in other modules
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDB = db;
    window.MEMBERS_COLLECTION = MEMBERS_COLLECTION;
    window.getCurrentUser = getCurrentUser;
    window.isAdmin = isAdmin;
    window.ADMIN_EMAIL = ADMIN_EMAIL;
})();
