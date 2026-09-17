/**
 * Firestore Database Module
 * Handles all CRUD operations for members data with real-time sync
 */

// State variables
let members = [];
let currentTab = 'all';
let searchQuery = '';
let deleteTargetId = null;
let unsubscribeSnapshot = null;

// Load members from Firestore with real-time updates
function loadMembersFromFirestore() {
    const user = getCurrentUser();
    
    if (!user || !isAdmin(user)) {
        console.error('Unauthorized access attempt');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Unsubscribe from previous listener if exists
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }
    
    // Set up real-time listener
    unsubscribeSnapshot = firebaseDB.collection(MEMBERS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .onSnapshot(
            (snapshot) => {
                members = [];
                snapshot.forEach((doc) => {
                    members.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log('Members loaded from Firestore:', members.length);
                checkAndAutoUpdateStatuses();
                renderApp();
            },
            (error) => {
                console.error('Error loading members:', error);
                showToast('Error loading data from server', 'error');
                showErrorState('Failed to load members. Please refresh the page.');
            }
        );
}

// Show loading state in member list
function showLoadingState() {
    const container = document.getElementById('member-list-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="py-16 text-center space-y-3">
            <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <div>
                <h4 class="font-bold text-slate-700 text-base">Loading members...</h4>
                <p class="text-xs text-slate-400 mt-0.5">Please wait while we fetch your data</p>
            </div>
        </div>
    `;
}

// Show error state in member list
function showErrorState(message) {
    const container = document.getElementById('member-list-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="py-16 text-center space-y-3">
            <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <div>
                <h4 class="font-bold text-slate-700 text-base">Error Loading Data</h4>
                <p class="text-xs text-slate-400 mt-0.5">${message}</p>
            </div>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
                Reload Page
            </button>
        </div>
    `;
}

// Add new member to Firestore
async function addMemberToFirestore(memberData) {
    const user = getCurrentUser();
    
    if (!user || !isAdmin(user)) {
        showToast('Unauthorized action', 'error');
        return false;
    }
    
    try {
        // Add server timestamp and user tracking
        const dataToSave = {
            ...memberData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.email
        };
        
        await firebaseDB.collection(MEMBERS_COLLECTION).add(dataToSave);
        console.log('Member added to Firestore');
        return true;
        
    } catch (error) {
        console.error('Error adding member:', error);
        
        let errorMessage = 'Failed to add member';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check security rules.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Server unavailable. Check internet connection.';
        }
        
        showToast(errorMessage, 'error');
        return false;
    }
}

// Update member in Firestore
async function updateMemberInFirestore(memberId, memberData) {
    const user = getCurrentUser();
    
    if (!user || !isAdmin(user)) {
        showToast('Unauthorized action', 'error');
        return false;
    }
    
    try {
        // Add update timestamp and user tracking
        const dataToUpdate = {
            ...memberData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: user.email
        };
        
        await firebaseDB.collection(MEMBERS_COLLECTION).doc(memberId).update(dataToUpdate);
        console.log('Member updated in Firestore');
        return true;
        
    } catch (error) {
        console.error('Error updating member:', error);
        
        let errorMessage = 'Failed to update member';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check security rules.';
        } else if (error.code === 'not-found') {
            errorMessage = 'Member not found.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Server unavailable. Check internet connection.';
        }
        
        showToast(errorMessage, 'error');
        return false;
    }
}

// Delete member from Firestore
async function deleteMemberFromFirestore(memberId) {
    const user = getCurrentUser();
    
    if (!user || !isAdmin(user)) {
        showToast('Unauthorized action', 'error');
        return false;
    }
    
    try {
        await firebaseDB.collection(MEMBERS_COLLECTION).doc(memberId).delete();
        console.log('Member deleted from Firestore');
        return true;
        
    } catch (error) {
        console.error('Error deleting member:', error);
        
        let errorMessage = 'Failed to delete member';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Check security rules.';
        } else if (error.code === 'not-found') {
            errorMessage = 'Member not found.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Server unavailable. Check internet connection.';
        }
        
        showToast(errorMessage, 'error');
        return false;
    }
}

// Mark member as paid (update payment status)
async function markMemberAsPaid(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    // Find and disable the button
    const buttonElements = document.querySelectorAll(`button[onclick="markAsPaid('${memberId}')"]`);
    buttonElements.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
    });
    
    const todayStr = new Date().toISOString().split('T')[0];
    const nextDue = calculateNextMonth(todayStr);
    
    const success = await updateMemberInFirestore(memberId, {
        lastPayment: todayStr,
        nextDueDate: nextDue,
        status: 'paid'
    });
    
    if (success) {
        showToast('Payment recorded! Marked as Paid.', 'success');
    }
    // Note: Button will be updated automatically when Firestore syncs
}

// Export data to JSON (backup)
async function exportData() {
    if (members.length === 0) {
        showToast('No data to export', 'info');
        return;
    }
    
    try {
        showToast('Preparing export...', 'info');
        
        // Create a clean copy without Firebase metadata
        const exportData = members.map(m => {
            const { createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = m;
            return cleanData;
        });
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `haseeb_fitness_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        
        showToast('Backup exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export data', 'error');
    }
}

// Import data from JSON (restore backup)
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const user = getCurrentUser();
    if (!user || !isAdmin(user)) {
        showToast('Unauthorized action', 'error');
        return;
    }
    
    showToast('Reading file...', 'info');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!Array.isArray(imported)) {
                showToast('Invalid JSON format. Expected an array.', 'error');
                return;
            }
            
            // Confirm before importing
            if (!confirm(`This will import ${imported.length} members. Existing data will be preserved. Continue?`)) {
                return;
            }
            
            showToast(`Importing ${imported.length} members...`, 'info');
            
            let successCount = 0;
            let errorCount = 0;
            
            // Import each member with progress
            for (let i = 0; i < imported.length; i++) {
                const memberData = imported[i];
                
                // Validate required fields
                if (!memberData.name || !memberData.fatherName || !memberData.joiningDate) {
                    errorCount++;
                    continue;
                }
                
                const success = await addMemberToFirestore(memberData);
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
                // Show progress every 5 members
                if ((i + 1) % 5 === 0) {
                    showToast(`Progress: ${i + 1}/${imported.length} members processed...`, 'info');
                }
            }
            
            if (successCount > 0) {
                showToast(`✓ Successfully imported ${successCount} members${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
            } else {
                showToast('Import failed. No members were added.', 'error');
            }
            
        } catch (err) {
            console.error('Import error:', err);
            showToast('Failed to parse JSON file.', 'error');
        }
        event.target.value = '';
    };
    
    reader.onerror = function() {
        showToast('Failed to read file', 'error');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Robust date calculation for monthly payments (handles Jan 31 -> Feb 28/29 correctly)
function calculateNextMonth(dateStr) {
    const originalDate = new Date(dateStr);
    const year = originalDate.getFullYear();
    const month = originalDate.getMonth();
    const day = originalDate.getDate();

    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
    }

    // Get last day of next target month to prevent overflow e.g. Feb 30 -> Feb 28/29
    const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const targetDay = Math.min(day, lastDayOfNextMonth);
    
    const resultDate = new Date(nextYear, nextMonth, targetDay);
    return resultDate.toISOString().split('T')[0];
}

// Automatically check if nextDueDate <= today and update status to unpaid
function checkAndAutoUpdateStatuses() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    members.forEach(async (m) => {
        if (m.status === 'paid' && m.nextDueDate <= todayStr) {
            // Update in Firestore
            await updateMemberInFirestore(m.id, { status: 'unpaid' });
        }
    });
}

// Render main application state
function renderApp() {
    renderStats();
    renderMemberList();
}

// Render dashboard metrics
function renderStats() {
    const total = members.length;
    const paidMembers = members.filter(m => m.status === 'paid');
    const unpaidMembers = members.filter(m => m.status === 'unpaid');

    // Total Collection calculation (sum of fees of members who are paid)
    const collection = paidMembers.reduce((sum, m) => sum + Number(m.monthlyFee || 0), 0);

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-paid').textContent = paidMembers.length;
    document.getElementById('stat-unpaid').textContent = unpaidMembers.length;
    document.getElementById('stat-collection').textContent = `₨${collection.toLocaleString('en-PK')}`;

    // Tab badge counts
    document.getElementById('count-all').textContent = total;
    document.getElementById('count-paid').textContent = paidMembers.length;
    document.getElementById('count-unpaid').textContent = unpaidMembers.length;
}

// Filter and Search logic
function getFilteredMembers() {
    return members.filter(m => {
        // Tab filter
        if (currentTab === 'paid' && m.status !== 'paid') return false;
        if (currentTab === 'unpaid' && m.status !== 'unpaid') return false;

        // Search query filter (name or father name)
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const matchName = m.name.toLowerCase().includes(q);
            const matchFather = m.fatherName.toLowerCase().includes(q);
            if (!matchName && !matchFather) return false;
        }
        return true;
    });
}

// Render Member Cards
function renderMemberList() {
    const container = document.getElementById('member-list-container');
    const filtered = getFilteredMembers();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center space-y-3">
                <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div>
                    <h4 class="font-bold text-slate-700 text-base">No members found</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Try adjusting your search or add a new member.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(m => {
        const isPaid = m.status === 'paid';
        const initials = m.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3 relative group">
                <!-- Top row: Avatar, Name, Status Badge -->
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200/60 shadow-inner">
                            ${initials}
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 text-base leading-tight mb-0.5">${escapeHtml(m.name)}</h3>
                            <p class="text-[11px] text-slate-500 font-medium">S/O: ${escapeHtml(m.fatherName)}</p>
                        </div>
                    </div>
                    <div>
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}">
                            ${isPaid ? 'Paid' : 'Unpaid / Due'}
                        </span>
                    </div>
                </div>

                <!-- Details Grid -->
                <div class="grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl text-xs border border-slate-100">
                    <div>
                        <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-bold mb-0.5">Monthly Fee</span>
                        <span class="font-bold text-slate-800">₨${Number(m.monthlyFee).toLocaleString('en-PK')}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-bold mb-0.5">Last Paid</span>
                        <span class="font-semibold text-slate-600">${m.lastPayment || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block text-[9px] uppercase tracking-wider font-bold mb-0.5">Next Due</span>
                        <span class="font-semibold ${isPaid ? 'text-slate-700' : 'text-rose-600 font-bold'}">${m.nextDueDate || 'N/A'}</span>
                    </div>
                </div>

                <!-- Action Buttons: Mark as Paid, Edit, Delete -->
                <div class="flex items-center justify-between pt-1.5">
                    <div class="flex space-x-2">
                        <button onclick="openEditModal('${m.id}')" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition active:scale-95 border border-slate-200/50">
                            Edit
                        </button>
                        <button onclick="promptDelete('${m.id}')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-medium text-xs transition active:scale-95 border border-rose-100/50">
                            Delete
                        </button>
                    </div>
                    <div>
                        ${!isPaid ? `
                            <button onclick="markAsPaid('${m.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition shadow-md shadow-emerald-600/20 active:scale-95 flex items-center space-x-1.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                <span>Mark Paid</span>
                            </button>
                        ` : `
                            <span class="text-xs text-emerald-600 font-bold flex items-center space-x-1 py-1 px-2 bg-emerald-50 rounded-lg">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                <span>Active</span>
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Tab Switching
function setTab(tab) {
    currentTab = tab;
    ['all', 'paid', 'unpaid'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (t === tab) {
            btn.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition bg-white text-slate-900 shadow-sm';
        } else {
            btn.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition text-slate-600 hover:text-slate-900';
        }
    });
    renderMemberList();
}

// Search Input Handler
function handleSearch(val) {
    searchQuery = val;
    renderMemberList();
}

// Modal Controls
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Member';
    document.getElementById('memberForm').reset();
    document.getElementById('memberId').value = '';
    document.getElementById('memberJoiningDate').valueAsDate = new Date();
    document.getElementById('memberModal').classList.remove('hidden');
    document.getElementById('memberModal').classList.add('flex');
}

function openEditModal(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    document.getElementById('modalTitle').textContent = 'Edit Member';
    document.getElementById('memberId').value = member.id;
    document.getElementById('memberName').value = member.name;
    document.getElementById('memberFatherName').value = member.fatherName;
    document.getElementById('memberJoiningDate').value = member.joiningDate;
    document.getElementById('memberFee').value = member.monthlyFee;
    document.getElementById('memberStatus').value = member.status;

    document.getElementById('memberModal').classList.remove('hidden');
    document.getElementById('memberModal').classList.add('flex');
}

function closeModal() {
    document.getElementById('memberModal').classList.remove('flex');
    document.getElementById('memberModal').classList.add('hidden');
}

// Form Submit Handler (Add / Edit)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    `;
    
    const id = document.getElementById('memberId').value;
    const name = document.getElementById('memberName').value.trim();
    const fatherName = document.getElementById('memberFatherName').value.trim();
    const joiningDate = document.getElementById('memberJoiningDate').value;
    const monthlyFee = parseFloat(document.getElementById('memberFee').value);
    const status = document.getElementById('memberStatus').value;

    try {
        if (id) {
            // Edit existing
            const member = members.find(m => m.id === id);
            if (!member) {
                showToast('Member not found', 'error');
                return;
            }
            
            const lastPayment = status === 'paid' && member.status !== 'paid' ? new Date().toISOString().split('T')[0] : member.lastPayment;
            const nextDueDate = calculateNextMonth(lastPayment);
            
            const success = await updateMemberInFirestore(id, {
                name,
                fatherName,
                joiningDate,
                monthlyFee,
                status,
                lastPayment,
                nextDueDate
            });
            
            if (success) {
                showToast('Member updated successfully!', 'success');
                closeModal();
            }
            
        } else {
            // Add new
            const todayStr = new Date().toISOString().split('T')[0];
            const lastPayment = status === 'paid' ? todayStr : joiningDate;
            const nextDueDate = calculateNextMonth(lastPayment);

            const newMemberData = {
                name,
                fatherName,
                joiningDate,
                monthlyFee,
                lastPayment,
                nextDueDate,
                status
            };
            
            const success = await addMemberToFirestore(newMemberData);
            
            if (success) {
                showToast('New member added successfully!', 'success');
                closeModal();
            }
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Mark as Paid action for cashier workflow
function markAsPaid(id) {
    markMemberAsPaid(id);
}

// Delete confirmation modal triggers
function promptDelete(id) {
    deleteTargetId = id;
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
    document.getElementById('confirmBtn').onclick = confirmDelete;
}

function closeConfirmModal() {
    deleteTargetId = null;
    document.getElementById('confirmModal').classList.remove('flex');
    document.getElementById('confirmModal').classList.add('hidden');
}

async function confirmDelete() {
    if (!deleteTargetId) return;
    
    const confirmBtn = document.getElementById('confirmBtn');
    const originalBtnText = confirmBtn.innerHTML;
    
    // Show loading state
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    `;
    
    try {
        const success = await deleteMemberFromFirestore(deleteTargetId);
        if (success) {
            showToast('Member deleted successfully.', 'info');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete member', 'error');
    } finally {
        // Reset button state
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalBtnText;
        closeConfirmModal();
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    
    let bgClass = 'bg-slate-900 text-white';
    if (type === 'success') bgClass = 'bg-emerald-600 text-white';
    if (type === 'error') bgClass = 'bg-rose-600 text-white';

    toast.className = `${bgClass} px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-xl pointer-events-auto animate-slide-up flex items-center space-x-2`;
    
    let iconSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
    if (type === 'error') iconSvg = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
    
    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => toast.remove(), 200);
    }, 2500);
}

// HTML Sanitizer helper
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Export functions for use in other modules
window.loadMembersFromFirestore = loadMembersFromFirestore;
window.renderApp = renderApp;
window.setTab = setTab;
window.handleSearch = handleSearch;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.handleFormSubmit = handleFormSubmit;
window.markAsPaid = markAsPaid;
window.promptDelete = promptDelete;
window.closeConfirmModal = closeConfirmModal;
window.exportData = exportData;
window.importData = importData;
window.showToast = showToast;
