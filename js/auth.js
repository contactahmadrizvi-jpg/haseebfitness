/**
 * Authentication Module
 * Handles login, logout, and authentication state management
 */

// Authentication state listener
let currentAuthUser = null;
let loginAttempts = 0;
let lastLoginAttemptTime = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 300000; // 5 minutes in milliseconds

// Rate limiting for login attempts
function checkRateLimit() {
    const now = Date.now();
    
    // Reset attempts after lockout time
    if (now - lastLoginAttemptTime > LOCKOUT_TIME) {
        loginAttempts = 0;
    }
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const timeRemaining = Math.ceil((LOCKOUT_TIME - (now - lastLoginAttemptTime)) / 1000 / 60);
        return {
            allowed: false,
            message: `Too many failed login attempts. Please try again in ${timeRemaining} minute(s).`
        };
    }
    
    return { allowed: true };
}

// Record failed login attempt
function recordFailedAttempt() {
    loginAttempts++;
    lastLoginAttemptTime = Date.now();
}

// Reset login attempts on successful login
function resetLoginAttempts() {
    loginAttempts = 0;
    lastLoginAttemptTime = 0;
}

// Toast notification function (fallback if database.js not loaded yet)
function showToast(message, type = 'success') {
    // Try to use the database.js version if available
    if (window.showToast && typeof window.showToast === 'function') {
        return window.showToast(message, type);
    }
    
    // Fallback: simple console log and alert
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create simple toast
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    
    let bgClass = 'bg-slate-900 text-white';
    if (type === 'success') bgClass = 'bg-emerald-600 text-white';
    if (type === 'error') bgClass = 'bg-rose-600 text-white';
    
    toast.className = `${bgClass} px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => toast.remove(), 200);
    }, 2500);
}

// Initialize authentication state listener
function initAuthStateListener() {
    firebaseAuth.onAuthStateChanged((user) => {
        currentAuthUser = user;
        
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            
            // Check if user is authorized admin
            if (isAdmin(user)) {
                showAppInterface();
                loadMembersFromFirestore();
            } else {
                // Not authorized - sign them out
                showToast('Access denied. Only admin can access this system.', 'error');
                signOutUser();
            }
        } else {
            // User is signed out
            console.log('User signed out');
            showLoginInterface();
        }
    });
}

// Show login interface
function showLoginInterface() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div class="w-full max-w-md">
                <div class="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
                    <!-- Header -->
                    <div class="bg-slate-900 text-white px-8 py-10 text-center">
                        <div class="w-20 h-20 bg-white text-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span class="text-3xl font-bold">HF</span>
                        </div>
                        <h1 class="text-2xl font-bold mb-2">Haseeb Fitness</h1>
                        <p class="text-slate-300 text-sm">Admin CRM & Cashier System</p>
                    </div>
                    
                    <!-- Login Form -->
                    <div class="p-8">
                        <div class="mb-6 text-center">
                            <h2 class="text-xl font-bold text-slate-900 mb-2">Admin Login</h2>
                            <p class="text-xs text-slate-500">Enter your credentials to access the system</p>
                        </div>
                        
                        <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    id="loginEmail" 
                                    required 
                                    placeholder="admin@haseebfitness.com"
                                    autocomplete="email"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Password</label>
                                <input 
                                    type="password" 
                                    id="loginPassword" 
                                    required 
                                    placeholder="Enter your password"
                                    autocomplete="current-password"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                                >
                            </div>
                            
                            <button 
                                type="submit" 
                                id="loginButton"
                                class="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold text-sm hover:bg-slate-800 active:scale-98 transition shadow-lg shadow-slate-900/20 mt-6"
                            >
                                <span id="loginButtonText">Sign In</span>
                                <span id="loginButtonSpinner" class="hidden">
                                    <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                            </button>
                        </form>
                        
                        <!-- Security Notice -->
                        <div class="mt-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl">
                            <div class="flex items-start space-x-2">
                                <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                                <div>
                                    <p class="text-xs font-semibold text-amber-900 mb-1">Secure Access Only</p>
                                    <p class="text-xs text-amber-700">This system is restricted to authorized administrators only.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="text-center mt-6">
                    <p class="text-xs text-slate-400">Protected by Firebase Authentication</p>
                </div>
            </div>
        </div>
    `;
}

// Show main app interface
function showAppInterface() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div id="app-container" class="w-full sm:max-w-md bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-[90vh] flex flex-col relative border border-slate-200/80">

            <header class="bg-white border-b border-slate-100 px-5 py-4 sticky top-0 z-20 backdrop-blur-md bg-white/90">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-slate-900/10">
                            HF
                        </div>
                        <div>
                            <h1 class="font-bold text-lg text-slate-900 leading-tight">Haseeb Fitness</h1>
                            <p class="text-xs text-slate-500 font-medium">Cashier & CRM Terminal</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <!-- Export / Import Buttons -->
                        <button onclick="exportData()" title="Export JSON Backup" class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95 border border-slate-200">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        </button>
                        <label title="Import JSON Backup" class="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95 border border-slate-200 cursor-pointer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <input type="file" id="importFile" accept=".json" class="hidden" onchange="importData(event)">
                        </label>
                        <!-- Logout Button -->
                        <button onclick="signOutUser()" title="Logout" class="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition active:scale-95 border border-rose-200">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        </button>
                    </div>
                </div>
            </header>

            <section class="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Collection</span>
                        <div class="flex items-baseline mt-1.5">
                            <span id="stat-collection" class="text-2xl font-bold text-slate-900">₨0</span>
                            <span class="text-[10px] text-slate-400 ml-1.5 font-medium">this month</span>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Members Overview</span>
                        <div class="flex flex-col mt-1.5 space-y-1">
                            <div class="flex items-baseline">
                                <span id="stat-total" class="text-xl font-bold text-slate-900">0</span>
                                <span class="text-xs text-slate-500 ml-1">Total</span>
                            </div>
                            <div class="flex space-x-2 text-xs font-medium">
                                <span class="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50"><strong id="stat-paid">0</strong> Paid</span>
                                <span class="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/50"><strong id="stat-unpaid">0</strong> Due</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="px-5 py-4 bg-white border-b border-slate-100 space-y-4">
                <!-- Search bar -->
                <div class="relative group">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </span>
                    <input type="text" id="searchInput" placeholder="Search by member or father name..." 
                        class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all shadow-sm"
                        oninput="handleSearch(this.value)">
                </div>

                <!-- Tabs -->
                <div class="flex p-1 bg-slate-100 rounded-xl shadow-inner">
                    <button onclick="setTab('all')" id="tab-all" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition bg-white text-slate-900 shadow-sm">
                        All (<span id="count-all">0</span>)
                    </button>
                    <button onclick="setTab('paid')" id="tab-paid" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition text-slate-600 hover:text-slate-900">
                        Paid (<span id="count-paid">0</span>)
                    </button>
                    <button onclick="setTab('unpaid')" id="tab-unpaid" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition text-slate-600 hover:text-slate-900">
                        Due (<span id="count-unpaid">0</span>)
                    </button>
                </div>
            </section>

            <main class="flex-1 px-5 py-4 overflow-y-auto space-y-3 pb-24" id="member-list-container">
                <div class="py-16 text-center space-y-3">
                    <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                        <svg class="w-8 h-8 animate-spin" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                    <p class="text-sm text-slate-500">Loading members...</p>
                </div>
            </main>

            <div class="absolute bottom-5 right-5 z-10">
                <button onclick="openAddModal()" class="flex items-center space-x-2 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-slate-900/20 font-semibold text-sm hover:bg-slate-800 active:scale-95 transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span>Add Member</span>
                </button>
            </div>

            <div id="memberModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm hidden items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
                <div class="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                    <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 id="modalTitle" class="font-bold text-lg text-slate-900">Add New Member</h3>
                        <button onclick="closeModal()" class="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <form id="memberForm" onsubmit="handleFormSubmit(event)" class="p-6 space-y-4 overflow-y-auto flex-1">
                        <input type="hidden" id="memberId">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name *</label>
                            <input type="text" id="memberName" required placeholder="e.g. Alex Morgan"
                                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Father's Name *</label>
                            <input type="text" id="memberFatherName" required placeholder="e.g. Robert Morgan"
                                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Joining Date *</label>
                            <input type="date" id="memberJoiningDate" required
                                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monthly Fee (PKR) *</label>
                                <input type="number" id="memberFee" required min="1" step="any" placeholder="1500" value="1500"
                                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all">
                            </div>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Initial Payment Status</label>
                            <select id="memberStatus" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all appearance-none">
                                <option value="paid">Paid (Active)</option>
                                <option value="unpaid">Unpaid / Due</option>
                            </select>
                        </div>
                        <div class="pt-3">
                            <button type="submit" class="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-semibold text-sm hover:bg-slate-800 active:scale-98 transition shadow-lg shadow-slate-900/10">
                                Save Member
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="confirmModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm hidden items-center justify-center p-4 animate-fade-in">
                <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up text-center">
                    <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </div>
                    <div>
                        <h3 id="confirmTitle" class="font-bold text-lg text-slate-900">Delete Member?</h3>
                        <p id="confirmDesc" class="text-xs text-slate-500 mt-1">This action cannot be undone. All membership data will be removed.</p>
                    </div>
                    <div class="flex space-x-3 pt-2">
                        <button onclick="closeConfirmModal()" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition">Cancel</button>
                        <button id="confirmBtn" class="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-semibold text-sm hover:bg-rose-700 transition shadow-lg shadow-rose-600/20">Delete</button>
                    </div>
                </div>
            </div>

            <div id="toastContainer" class="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col space-y-2 pointer-events-none"></div>

        </div>
    `;
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Check rate limit
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
        showToast(rateLimitCheck.message, 'error');
        return;
    }
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginButtonSpinner = document.getElementById('loginButtonSpinner');
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }
    
    // Show loading state
    loginButton.disabled = true;
    loginButtonText.classList.add('hidden');
    loginButtonSpinner.classList.remove('hidden');
    
    try {
        // Sign in with email and password
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user is admin
        if (!isAdmin(user)) {
            // Not authorized - log the attempt
            console.warn('Unauthorized access attempt:', email);
            await firebaseAuth.signOut();
            recordFailedAttempt();
            showToast('Access denied. Only admin can access this system.', 'error');
            return;
        }
        
        // Success - reset rate limiting
        resetLoginAttempts();
        console.log('✅ Login successful:', user.email);
        
    } catch (error) {
        console.error('Login error:', error);
        recordFailedAttempt();
        
        // Show user-friendly error messages
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Check your internet connection.';
                break;
        }
        
        const attemptsRemaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
        if (attemptsRemaining > 0 && attemptsRemaining <= 2) {
            errorMessage += ` (${attemptsRemaining} attempts remaining)`;
        }
        
        showToast(errorMessage, 'error');
        
    } finally {
        // Reset loading state
        loginButton.disabled = false;
        loginButtonText.classList.remove('hidden');
        loginButtonSpinner.classList.add('hidden');
    }
}

// Sign out user
async function signOutUser() {
    try {
        await firebaseAuth.signOut();
        showToast('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Error signing out', 'error');
    }
}

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthStateListener);
} else {
    initAuthStateListener();
}

// Export functions for use in other modules
window.handleLogin = handleLogin;
window.signOutUser = signOutUser;
window.showLoginInterface = showLoginInterface;
window.showAppInterface = showAppInterface;
