// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Load initial data
    loadUsers();
    loadFeatures();
    loadChallenges();
    loadChallengeTypes();
    loadInterests();
    loadIcons();
    loadStats();

    // Add event listeners for add buttons
    document.getElementById('addUserBtn').addEventListener('click', () => showAddUserModal());
    document.getElementById('addFeatureBtn').addEventListener('click', () => showAddFeatureModal());
    document.getElementById('addChallengeBtn').addEventListener('click', () => showAddChallengeModal());
    document.getElementById('addChallengeTypeBtn').addEventListener('click', () => showAddChallengeTypeModal());
    document.getElementById('addInterestBtn').addEventListener('click', () => showAddInterestModal());
    
    // Add event listener for password change button
    document.getElementById('changePasswordBtn').addEventListener('click', () => showPasswordModal());
    
    // Add event listener for password form
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await changePassword();
    });
});

// Authentication
async function login(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const data = await response.json();
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/admin.html';
    } catch (error) {
        alert(error.message);
    }
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('Logout button clicked');
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (e) {
                console.error('Logout error:', e);
            }
            localStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminToken');
            document.cookie = 'adminToken=; Max-Age=0; path=/;';
            window.location.href = '/login.html';
        });
    } else {
        console.error('Logout button not found');
    }
});

// Password Change Functions
function showPasswordModal() {
    document.getElementById('passwordModal').classList.remove('hidden');
    // Clear form fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.add('hidden');
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to change password');
        }

        const result = await response.json();
        alert('Password changed successfully!');
        closePasswordModal();
        
        // Optionally log out the user after password change for security
        if (confirm('For security reasons, you will be logged out. Do you want to continue?')) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert(error.message);
    }
}

// Modal functions
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('editModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Load Users
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const users = await response.json();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${user.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">${user.status}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ${user.points || 0} pts
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${user.completedChallenges ? user.completedChallenges.length : 0} completed
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// User CRUD functions
function showAddUserModal() {
    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="userName" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="userEmail" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <select id="userStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
        </div>
    `;
    showModal('Add User', content);
    
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        await addUser();
    };
}

async function addUser() {
    try {
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            status: document.getElementById('userStatus').value
        };

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Failed to add user');
        
        closeModal();
        loadUsers();
        alert('User added successfully!');
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Failed to add user');
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const user = await response.json();

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="userName" value="${user.name}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="userEmail" value="${user.email}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="userStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
            </div>
        `;
        showModal('Edit User', content);
        
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateUser(userId);
        };
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Failed to load user data');
    }
}

async function updateUser(userId) {
    try {
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            status: document.getElementById('userStatus').value
        };

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Failed to update user');
        
        closeModal();
        loadUsers();
        alert('User updated successfully!');
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');
        
        loadUsers();
        alert('User deleted successfully!');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
}

// Load Features
async function loadFeatures() {
    try {
        const response = await fetch('/api/features', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const features = await response.json();
        const tbody = document.getElementById('featuresTableBody');
        tbody.innerHTML = features.map(feature => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${feature.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${feature.status}</td>
                <td class="px-6 py-4 whitespace-nowrap">${feature.testers?.length || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editFeature('${feature.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onclick="deleteFeature('${feature.id}')" class="text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading features:', error);
    }
}

// Feature CRUD functions
function showAddFeatureModal() {
    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="featureName" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <select id="featureStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="testing">Testing</option>
                </select>
            </div>
        </div>
    `;
    showModal('Add Feature', content);
    
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        await addFeature();
    };
}

async function addFeature() {
    try {
        const featureData = {
            name: document.getElementById('featureName').value,
            status: document.getElementById('featureStatus').value
        };

        const response = await fetch('/api/features', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(featureData)
        });

        if (!response.ok) throw new Error('Failed to add feature');
        
        closeModal();
        loadFeatures();
        alert('Feature added successfully!');
    } catch (error) {
        console.error('Error adding feature:', error);
        alert('Failed to add feature');
    }
}

async function editFeature(featureId) {
    try {
        const response = await fetch(`/api/features/${featureId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const feature = await response.json();

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="featureName" value="${feature.name}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="featureStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="active" ${feature.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${feature.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="testing" ${feature.status === 'testing' ? 'selected' : ''}>Testing</option>
                    </select>
                </div>
            </div>
        `;
        showModal('Edit Feature', content);
        
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateFeature(featureId);
        };
    } catch (error) {
        console.error('Error loading feature:', error);
        alert('Failed to load feature data');
    }
}

async function updateFeature(featureId) {
    try {
        const featureData = {
            name: document.getElementById('featureName').value,
            status: document.getElementById('featureStatus').value
        };

        const response = await fetch(`/api/features/${featureId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(featureData)
        });

        if (!response.ok) throw new Error('Failed to update feature');
        
        closeModal();
        loadFeatures();
        alert('Feature updated successfully!');
    } catch (error) {
        console.error('Error updating feature:', error);
        alert('Failed to update feature');
    }
}

async function deleteFeature(featureId) {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    
    try {
        const response = await fetch(`/api/features/${featureId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete feature');
        
        loadFeatures();
        alert('Feature deleted successfully!');
    } catch (error) {
        console.error('Error deleting feature:', error);
        alert('Failed to delete feature');
    }
}

// Load Challenges
async function loadChallenges() {
    try {
        const response = await fetch('/api/challenges', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const challenges = await response.json();
        const tbody = document.getElementById('challengesTableBody');
        tbody.innerHTML = challenges.map(challenge => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${challenge.title}</td>
                <td class="px-6 py-4 whitespace-nowrap">${challenge.type}</td>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(challenge.startDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(challenge.endDate).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ${challenge.points || 0} pts
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${challenge.status}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editChallenge('${challenge.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onclick="deleteChallenge('${challenge.id}')" class="text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

// Challenge CRUD functions
function showAddChallengeModal() {
    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" id="challengeTitle" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <input type="text" id="challengeType" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="challengeStartDate" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="challengeEndDate" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Points to Earn</label>
                <input type="number" id="challengePoints" min="0" value="100" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <select id="challengeStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
        </div>
    `;
    showModal('Add Challenge', content);
    
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        await addChallenge();
    };
}

async function addChallenge() {
    try {
        const challengeData = {
            title: document.getElementById('challengeTitle').value,
            type: document.getElementById('challengeType').value,
            startDate: document.getElementById('challengeStartDate').value,
            endDate: document.getElementById('challengeEndDate').value,
            points: parseInt(document.getElementById('challengePoints').value) || 0,
            status: document.getElementById('challengeStatus').value
        };

        const response = await fetch('/api/challenges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(challengeData)
        });

        if (!response.ok) throw new Error('Failed to add challenge');
        
        closeModal();
        loadChallenges();
        alert('Challenge added successfully!');
    } catch (error) {
        console.error('Error adding challenge:', error);
        alert('Failed to add challenge');
    }
}

async function editChallenge(challengeId) {
    try {
        const response = await fetch(`/api/challenges/${challengeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const challenge = await response.json();

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" id="challengeTitle" value="${challenge.title}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Type</label>
                    <input type="text" id="challengeType" value="${challenge.type}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="challengeStartDate" value="${challenge.startDate.split('T')[0]}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="challengeEndDate" value="${challenge.endDate.split('T')[0]}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Points to Earn</label>
                    <input type="number" id="challengePoints" min="0" value="${challenge.points || 0}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="challengeStatus" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="active" ${challenge.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${challenge.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="completed" ${challenge.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
        `;
        showModal('Edit Challenge', content);
        
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateChallenge(challengeId);
        };
    } catch (error) {
        console.error('Error loading challenge:', error);
        alert('Failed to load challenge data');
    }
}

async function updateChallenge(challengeId) {
    try {
        const challengeData = {
            title: document.getElementById('challengeTitle').value,
            type: document.getElementById('challengeType').value,
            startDate: document.getElementById('challengeStartDate').value,
            endDate: document.getElementById('challengeEndDate').value,
            points: parseInt(document.getElementById('challengePoints').value) || 0,
            status: document.getElementById('challengeStatus').value
        };

        const response = await fetch(`/api/challenges/${challengeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(challengeData)
        });

        if (!response.ok) throw new Error('Failed to update challenge');
        
        closeModal();
        loadChallenges();
        alert('Challenge updated successfully!');
    } catch (error) {
        console.error('Error updating challenge:', error);
        alert('Failed to update challenge');
    }
}

async function deleteChallenge(challengeId) {
    if (!confirm('Are you sure you want to delete this challenge?')) return;
    
    try {
        const response = await fetch(`/api/challenges/${challengeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete challenge');
        
        loadChallenges();
        alert('Challenge deleted successfully!');
    } catch (error) {
        console.error('Error deleting challenge:', error);
        alert('Failed to delete challenge');
    }
}

// Load Challenge Types
async function loadChallengeTypes() {
    try {
        const response = await fetch('/api/challenge-types', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const types = await response.json();
        const tbody = document.getElementById('challengeTypesTableBody');
        tbody.innerHTML = types.map(type => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${type.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${type.description}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editChallengeType('${type.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onclick="deleteChallengeType('${type.id}')" class="text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading challenge types:', error);
    }
}

// Challenge Type CRUD functions
function showAddChallengeTypeModal() {
    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="challengeTypeName" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="challengeTypeDescription" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows="3"></textarea>
            </div>
        </div>
    `;
    showModal('Add Challenge Type', content);
    
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        await addChallengeType();
    };
}

async function addChallengeType() {
    try {
        const typeData = {
            name: document.getElementById('challengeTypeName').value,
            description: document.getElementById('challengeTypeDescription').value
        };

        const response = await fetch('/api/challenge-types', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(typeData)
        });

        if (!response.ok) throw new Error('Failed to add challenge type');
        
        closeModal();
        loadChallengeTypes();
        alert('Challenge type added successfully!');
    } catch (error) {
        console.error('Error adding challenge type:', error);
        alert('Failed to add challenge type');
    }
}

async function editChallengeType(typeId) {
    try {
        const response = await fetch(`/api/challenge-types/${typeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const type = await response.json();

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="challengeTypeName" value="${type.name}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="challengeTypeDescription" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows="3">${type.description}</textarea>
                </div>
            </div>
        `;
        showModal('Edit Challenge Type', content);
        
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateChallengeType(typeId);
        };
    } catch (error) {
        console.error('Error loading challenge type:', error);
        alert('Failed to load challenge type data');
    }
}

async function updateChallengeType(typeId) {
    try {
        const typeData = {
            name: document.getElementById('challengeTypeName').value,
            description: document.getElementById('challengeTypeDescription').value
        };

        const response = await fetch(`/api/challenge-types/${typeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(typeData)
        });

        if (!response.ok) throw new Error('Failed to update challenge type');
        
        closeModal();
        loadChallengeTypes();
        alert('Challenge type updated successfully!');
    } catch (error) {
        console.error('Error updating challenge type:', error);
        alert('Failed to update challenge type');
    }
}

async function deleteChallengeType(typeId) {
    if (!confirm('Are you sure you want to delete this challenge type?')) return;
    
    try {
        const response = await fetch(`/api/challenge-types/${typeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete challenge type');
        
        loadChallengeTypes();
        alert('Challenge type deleted successfully!');
    } catch (error) {
        console.error('Error deleting challenge type:', error);
        alert('Failed to delete challenge type');
    }
}

// Load Interests
async function loadInterests() {
    try {
        const response = await fetch('/api/interests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const interests = await response.json();
        const tbody = document.getElementById('interestsTableBody');
        tbody.innerHTML = interests.map(interest => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${interest.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${interest.description}</td>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(interest.createdAt).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editInterest('${interest.id}')" class="text-blue-600 hover:text-blue-800">Edit</button>
                    <button onclick="deleteInterest('${interest.id}')" class="text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading interests:', error);
    }
}

// Interest CRUD functions
function showAddInterestModal() {
    const content = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="interestName" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="interestDescription" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows="3"></textarea>
            </div>
        </div>
    `;
    showModal('Add Interest', content);
    
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        await addInterest();
    };
}

async function addInterest() {
    try {
        const interestData = {
            name: document.getElementById('interestName').value,
            description: document.getElementById('interestDescription').value
        };

        const response = await fetch('/api/interests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(interestData)
        });

        if (!response.ok) throw new Error('Failed to add interest');
        
        closeModal();
        loadInterests();
        alert('Interest added successfully!');
    } catch (error) {
        console.error('Error adding interest:', error);
        alert('Failed to add interest');
    }
}

async function editInterest(interestId) {
    try {
        const response = await fetch(`/api/interests/${interestId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const interest = await response.json();

        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" id="interestName" value="${interest.name}" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="interestDescription" class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" rows="3">${interest.description}</textarea>
                </div>
            </div>
        `;
        showModal('Edit Interest', content);
        
        document.getElementById('editForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateInterest(interestId);
        };
    } catch (error) {
        console.error('Error loading interest:', error);
        alert('Failed to load interest data');
    }
}

async function updateInterest(interestId) {
    try {
        const interestData = {
            name: document.getElementById('interestName').value,
            description: document.getElementById('interestDescription').value
        };

        const response = await fetch(`/api/interests/${interestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(interestData)
        });

        if (!response.ok) throw new Error('Failed to update interest');
        
        closeModal();
        loadInterests();
        alert('Interest updated successfully!');
    } catch (error) {
        console.error('Error updating interest:', error);
        alert('Failed to update interest');
    }
}

async function deleteInterest(interestId) {
    if (!confirm('Are you sure you want to delete this interest?')) return;
    
    try {
        const response = await fetch(`/api/interests/${interestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete interest');
        
        loadInterests();
        alert('Interest deleted successfully!');
    } catch (error) {
        console.error('Error deleting interest:', error);
        alert('Failed to delete interest');
    }
}

// Load Icons
async function loadIcons() {
    try {
        const response = await fetch('/api/icons', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const icons = await response.json();
        icons.forEach(icon => {
            if (icon.name === 'default-challenge.png') {
                document.getElementById('weeklyChallengesIcon').src = icon.path;
            } else if (icon.name === 'default-profile.png') {
                document.getElementById('profileIcon').src = icon.path;
            } else if (icon.name === 'default-community.png') {
                document.getElementById('communityIcon').src = icon.path;
            }
        });
    } catch (error) {
        console.error('Error loading icons:', error);
    }
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const stats = await response.json();
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('activeFeatures').textContent = stats.activeFeatures;
        document.getElementById('pendingFeedback').textContent = stats.pendingFeedback;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Icon Upload Handlers
document.addEventListener('DOMContentLoaded', () => {
    const weeklyChallengesIconInput = document.getElementById('weeklyChallengesIconInput');
    const profileIconInput = document.getElementById('profileIconInput');
    const communityIconInput = document.getElementById('communityIconInput');

    if (weeklyChallengesIconInput) {
        weeklyChallengesIconInput.addEventListener('change', (e) => {
            uploadIcon('weeklyChallenges', e.target.files[0]);
        });
    }

    if (profileIconInput) {
        profileIconInput.addEventListener('change', (e) => {
            uploadIcon('profile', e.target.files[0]);
        });
    }

    if (communityIconInput) {
        communityIconInput.addEventListener('change', (e) => {
            uploadIcon('community', e.target.files[0]);
        });
    }
});

async function uploadIcon(type, file) {
    try {
        const formData = new FormData();
        formData.append('icon', file);
        formData.append('type', type);

        const response = await fetch('/api/icons/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload icon');
        }

        const data = await response.json();
        document.getElementById(`${type}Icon`).src = data.url;
    } catch (error) {
        console.error('Error uploading icon:', error);
        alert('Failed to upload icon');
    }
}

async function resetIcon(type) {
    try {
        const response = await fetch(`/api/icons/reset/${type}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to reset icon');
        }

        const data = await response.json();
        document.getElementById(`${type}Icon`).src = data.url;
    } catch (error) {
        console.error('Error resetting icon:', error);
        alert('Failed to reset icon');
    }
} 