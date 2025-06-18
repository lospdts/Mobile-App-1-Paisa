// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login';
}

// API endpoints
const API = {
    users: '/api/users',
    features: '/api/features',
    feedback: '/api/feedback',
    export: '/api/export/users',
    import: '/api/import/users',
    challenges: '/api/challenges',
    interests: '/api/interests',
    icons: '/api/icons',
    challengeTypes: '/api/challenge-types'
};

// Chart configurations
const chartConfigs = {
    userGrowth: {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'User Growth',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    },
    featureCompletion: {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 99, 132)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    },
    feedbackSentiment: {
        type: 'pie',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 99, 132)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    },
    featureRatings: {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Rating',
                data: [],
                backgroundColor: 'rgb(75, 192, 192)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5
                }
            }
        }
    }
};

// Initialize charts
let charts = {};
document.addEventListener('DOMContentLoaded', () => {
    charts.userGrowth = new Chart(
        document.getElementById('userGrowthChart'),
        chartConfigs.userGrowth
    );
    charts.featureCompletion = new Chart(
        document.getElementById('featureCompletionChart'),
        chartConfigs.featureCompletion
    );
    charts.feedbackSentiment = new Chart(
        document.getElementById('feedbackSentimentChart'),
        chartConfigs.feedbackSentiment
    );
    charts.featureRatings = new Chart(
        document.getElementById('featureRatingsChart'),
        chartConfigs.featureRatings
    );

    // Load initial data
    loadUsers();
    loadFeatures();
    loadFeedback();
    loadChallenges();
    loadInterests();
    loadIcons();
    loadChallengeTypes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    });

    // Export Users
    document.getElementById('exportUsersBtn').addEventListener('click', exportUsers);

    // Import Users
    document.getElementById('importUsersBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importUsers);

    // Add Feature
    document.getElementById('addFeatureBtn').addEventListener('click', () => {
        document.getElementById('addFeatureModal').classList.remove('hidden');
    });
    document.getElementById('cancelAddFeature').addEventListener('click', () => {
        document.getElementById('addFeatureModal').classList.add('hidden');
    });
    document.getElementById('addFeatureForm').addEventListener('submit', addFeature);

    // Filter Feedback
    document.getElementById('filterFeedbackBtn').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        loadFeedback(startDate, endDate);
    });

    // Add Challenge
    document.getElementById('addChallengeBtn').addEventListener('click', () => {
        document.getElementById('addChallengeModal').classList.remove('hidden');
    });
    document.getElementById('cancelAddChallenge').addEventListener('click', () => {
        document.getElementById('addChallengeModal').classList.add('hidden');
    });
    document.getElementById('addChallengeForm').addEventListener('submit', addChallenge);

    // Add Interest
    document.getElementById('addInterestBtn').addEventListener('click', () => {
        document.getElementById('addInterestModal').classList.remove('hidden');
    });
    document.getElementById('cancelAddInterest').addEventListener('click', () => {
        document.getElementById('addInterestModal').classList.add('hidden');
    });
    document.getElementById('addInterestForm').addEventListener('submit', addInterest);

    // Icon upload handlers
    document.getElementById('weeklyChallengesIconInput').addEventListener('change', (e) => uploadIcon('weeklyChallenges', e));
    document.getElementById('profileIconInput').addEventListener('change', (e) => uploadIcon('profile', e));
    document.getElementById('communityIconInput').addEventListener('change', (e) => uploadIcon('community', e));

    // Add Challenge Type
    document.getElementById('addChallengeTypeBtn').addEventListener('click', () => {
        document.getElementById('addChallengeTypeModal').classList.remove('hidden');
    });
    document.getElementById('cancelAddChallengeType').addEventListener('click', () => {
        document.getElementById('addChallengeTypeModal').classList.add('hidden');
    });
    document.getElementById('addChallengeTypeForm').addEventListener('submit', addChallengeType);
}

// API Functions
async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// User Management
async function loadUsers() {
    try {
        const users = await fetchWithAuth(API.users);
        updateUsersTable(users);
        updateUserStats(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${user.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editUser('${user.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteUser('${user.id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateUserStats(users) {
    document.getElementById('totalUsers').textContent = users.length;
    // Update user growth chart
    const dates = [...new Set(users.map(u => new Date(u.createdAt).toLocaleDateString()))].sort();
    const counts = dates.map(date => 
        users.filter(u => new Date(u.createdAt).toLocaleDateString() === date).length
    );
    charts.userGrowth.data.labels = dates;
    charts.userGrowth.data.datasets[0].data = counts;
    charts.userGrowth.update();
}

// Feature Management
async function loadFeatures() {
    try {
        const features = await fetchWithAuth(API.features);
        updateFeaturesTable(features);
        updateFeatureStats(features);
    } catch (error) {
        console.error('Error loading features:', error);
    }
}

function updateFeaturesTable(features) {
    const tbody = document.getElementById('featuresTableBody');
    tbody.innerHTML = features.map(feature => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${feature.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${feature.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${feature.testers?.length || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editFeature('${feature.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteFeature('${feature.id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateFeatureStats(features) {
    document.getElementById('activeFeatures').textContent = 
        features.filter(f => f.status === 'in_progress').length;

    // Update feature completion chart
    const statusCounts = {
        completed: features.filter(f => f.status === 'completed').length,
        in_progress: features.filter(f => f.status === 'in_progress').length,
        not_started: features.filter(f => f.status === 'not_started').length
    };
    charts.featureCompletion.data.datasets[0].data = [
        statusCounts.completed,
        statusCounts.in_progress,
        statusCounts.not_started
    ];
    charts.featureCompletion.update();
}

async function addFeature(event) {
    event.preventDefault();
    const name = document.getElementById('featureName').value;
    const description = document.getElementById('featureDescription').value;

    try {
        await fetchWithAuth(API.features, {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
        document.getElementById('addFeatureModal').classList.add('hidden');
        document.getElementById('addFeatureForm').reset();
        loadFeatures();
    } catch (error) {
        console.error('Error adding feature:', error);
    }
}

// Feedback Management
async function loadFeedback(startDate, endDate) {
    try {
        const url = new URL(API.feedback, window.location.origin);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);
        
        const feedback = await fetchWithAuth(url);
        updateFeedbackAnalysis(feedback);
        document.getElementById('pendingFeedback').textContent = 
            feedback.filter(f => !f.reviewed).length;
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

function updateFeedbackAnalysis(feedback) {
    // Update sentiment chart
    const sentimentCounts = {
        positive: feedback.filter(f => f.sentiment === 'positive').length,
        neutral: feedback.filter(f => f.sentiment === 'neutral').length,
        negative: feedback.filter(f => f.sentiment === 'negative').length
    };
    charts.feedbackSentiment.data.datasets[0].data = [
        sentimentCounts.positive,
        sentimentCounts.neutral,
        sentimentCounts.negative
    ];
    charts.feedbackSentiment.update();

    // Update feature ratings chart
    const featureRatings = {};
    feedback.forEach(f => {
        if (!featureRatings[f.featureId]) {
            featureRatings[f.featureId] = { sum: 0, count: 0 };
        }
        featureRatings[f.featureId].sum += f.rating;
        featureRatings[f.featureId].count++;
    });

    const features = Object.keys(featureRatings);
    const ratings = features.map(f => 
        featureRatings[f].sum / featureRatings[f].count
    );

    charts.featureRatings.data.labels = features;
    charts.featureRatings.data.datasets[0].data = ratings;
    charts.featureRatings.update();

    // Update recent feedback list
    const recentFeedback = document.getElementById('recentFeedback');
    recentFeedback.innerHTML = feedback.slice(-5).map(f => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between">
                <span class="font-medium">${f.featureName}</span>
                <span class="text-sm text-gray-500">${new Date(f.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="mt-2 text-gray-600">${f.comment}</p>
            <div class="mt-2 flex items-center">
                <span class="text-sm text-gray-500">Rating: ${f.rating}/5</span>
                <span class="ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${f.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                      f.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}">
                    ${f.sentiment}
                </span>
            </div>
        </div>
    `).join('');
}

// Data Export/Import
async function exportUsers() {
    try {
        const response = await fetchWithAuth(API.export);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Error exporting users:', error);
    }
}

async function importUsers(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        await fetch(API.import, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        loadUsers();
    } catch (error) {
        console.error('Error importing users:', error);
    }
}

// UI Components
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function getStatusColor(status) {
    return {
        'not_started': 'bg-gray-100 text-gray-800',
        'in_progress': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800'
    }[status] || 'bg-gray-100 text-gray-800';
}

function getSentimentColor(sentiment) {
    return {
        'positive': 'bg-green-100 text-green-800',
        'neutral': 'bg-gray-100 text-gray-800',
        'negative': 'bg-red-100 text-red-800'
    }[sentiment] || 'bg-gray-100 text-gray-800';
}

// Chart Initialization
function initializeCharts() {
    // Initialize Chart.js charts
    const ctx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'User Growth',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        }
    });

    // Initialize other charts similarly
}

// Chart Update Functions
function updateUserGrowthChart(data) {
    // Update user growth chart
}

function updateFeatureCompletionChart(data) {
    // Update feature completion chart
}

function updateFeedbackTrendsChart(data) {
    // Update feedback trends chart
}

function updateFeatureRatingsChart(ratings) {
    // Update feature ratings chart
}

function updateSentimentChart(sentiment) {
    // Update sentiment analysis chart
}

// Modal Functions
function showAddUserModal() {
    // Implementation for adding new user
}

function showAddFeatureModal() {
    // Implementation for adding new feature
}

function showExportModal() {
    // Implementation for export modal
}

function showImportModal() {
    // Implementation for import modal
}

// API Functions
async function updateFeatureStatus(featureId, status) {
    try {
        await fetch(`/api/admin/features/${featureId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        loadFeatures();
        showNotification('Feature status updated', 'success');
    } catch (error) {
        console.error('Error updating feature status:', error);
        showNotification('Error updating feature status', 'error');
    }
}

async function updateAssignedTesters(featureId, count) {
    try {
        await fetch(`/api/admin/features/${featureId}/testers`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ count: parseInt(count) })
        });
        loadFeatures();
        showNotification('Assigned testers updated', 'success');
    } catch (error) {
        console.error('Error updating assigned testers:', error);
        showNotification('Error updating assigned testers', 'error');
    }
}

async function editUser(userId) {
    // Implementation for editing user
}

async function viewUserDetails(userId) {
    // Implementation for viewing user details
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            loadUsers();
            showNotification('User deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user', 'error');
        }
    }
}

// Weekly Challenges Management
async function loadChallenges() {
    try {
        const challenges = await fetchWithAuth(API.challenges);
        updateChallengesTable(challenges);
    } catch (error) {
        console.error('Error loading challenges:', error);
        showNotification('Failed to load challenges', 'error');
    }
}

function updateChallengesTable(challenges) {
    const tbody = document.getElementById('challengesTableBody');
    tbody.innerHTML = challenges.map(challenge => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${challenge.title}</td>
            <td class="px-6 py-4 whitespace-nowrap">${challenge.type}</td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(challenge.startDate).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(challenge.endDate).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${challenge.status === 'active' ? 'bg-green-100 text-green-800' : 
                      challenge.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}">
                    ${challenge.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editChallenge('${challenge.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteChallenge('${challenge.id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function addChallenge(event) {
    event.preventDefault();
    
    const challenge = {
        title: document.getElementById('challengeTitle').value,
        typeId: document.getElementById('challengeType').value,
        description: document.getElementById('challengeDescription').value,
        startDate: document.getElementById('challengeStartDate').value,
        endDate: document.getElementById('challengeEndDate').value,
        rewardPoints: parseInt(document.getElementById('challengeReward').value)
    };

    try {
        await fetchWithAuth(API.challenges, {
            method: 'POST',
            body: JSON.stringify(challenge)
        });
        document.getElementById('addChallengeModal').classList.add('hidden');
        document.getElementById('addChallengeForm').reset();
        loadChallenges();
        showNotification('Challenge added successfully', 'success');
    } catch (error) {
        console.error('Error adding challenge:', error);
        showNotification('Failed to add challenge', 'error');
    }
}

async function editChallenge(id) {
    try {
        const challenges = await fetchWithAuth(API.challenges);
        const challenge = challenges.find(c => c.id === id);
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        // Populate the form with challenge data
        document.getElementById('challengeTitle').value = challenge.title;
        document.getElementById('challengeDescription').value = challenge.description;
        document.getElementById('challengeStartDate').value = challenge.startDate;
        document.getElementById('challengeEndDate').value = challenge.endDate;
        document.getElementById('challengeReward').value = challenge.rewardPoints;

        // Show the modal
        document.getElementById('addChallengeModal').classList.remove('hidden');

        // Update the form submission handler
        const form = document.getElementById('addChallengeForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updatedChallenge = {
                title: document.getElementById('challengeTitle').value,
                description: document.getElementById('challengeDescription').value,
                startDate: document.getElementById('challengeStartDate').value,
                endDate: document.getElementById('challengeEndDate').value,
                rewardPoints: parseInt(document.getElementById('challengeReward').value)
            };

            try {
                await fetchWithAuth(`${API.challenges}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedChallenge)
                });
                document.getElementById('addChallengeModal').classList.add('hidden');
                form.reset();
                loadChallenges();
                showNotification('Challenge updated successfully', 'success');
            } catch (error) {
                console.error('Error updating challenge:', error);
                showNotification('Failed to update challenge', 'error');
            }
        };
    } catch (error) {
        console.error('Error loading challenge:', error);
        showNotification('Failed to load challenge details', 'error');
    }
}

async function deleteChallenge(id) {
    if (!confirm('Are you sure you want to delete this challenge?')) {
        return;
    }

    try {
        await fetchWithAuth(`${API.challenges}/${id}`, {
            method: 'DELETE'
        });
        loadChallenges();
        showNotification('Challenge deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting challenge:', error);
        showNotification('Failed to delete challenge', 'error');
    }
}

// Interest Topics Management
async function loadInterests() {
    try {
        const interests = await fetchWithAuth(API.interests);
        updateInterestsTable(interests);
    } catch (error) {
        console.error('Error loading interests:', error);
        showNotification('Failed to load interest topics', 'error');
    }
}

function updateInterestsTable(interests) {
    const tbody = document.getElementById('interestsTableBody');
    tbody.innerHTML = interests.map(interest => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${interest.name}</td>
            <td class="px-6 py-4">${interest.description}</td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(interest.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editInterest('${interest.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteInterest('${interest.id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function addInterest(event) {
    event.preventDefault();
    
    const interest = {
        name: document.getElementById('interestName').value,
        description: document.getElementById('interestDescription').value
    };

    try {
        await fetchWithAuth(API.interests, {
            method: 'POST',
            body: JSON.stringify(interest)
        });
        document.getElementById('addInterestModal').classList.add('hidden');
        document.getElementById('addInterestForm').reset();
        loadInterests();
        showNotification('Interest topic added successfully', 'success');
    } catch (error) {
        console.error('Error adding interest topic:', error);
        showNotification('Failed to add interest topic', 'error');
    }
}

async function editInterest(id) {
    try {
        const interests = await fetchWithAuth(API.interests);
        const interest = interests.find(i => i.id === id);
        if (!interest) {
            throw new Error('Interest topic not found');
        }

        // Populate the form with interest data
        document.getElementById('interestName').value = interest.name;
        document.getElementById('interestDescription').value = interest.description;

        // Show the modal
        document.getElementById('addInterestModal').classList.remove('hidden');

        // Update the form submission handler
        const form = document.getElementById('addInterestForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updatedInterest = {
                name: document.getElementById('interestName').value,
                description: document.getElementById('interestDescription').value
            };

            try {
                await fetchWithAuth(`${API.interests}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedInterest)
                });
                document.getElementById('addInterestModal').classList.add('hidden');
                form.reset();
                loadInterests();
                showNotification('Interest topic updated successfully', 'success');
            } catch (error) {
                console.error('Error updating interest topic:', error);
                showNotification('Failed to update interest topic', 'error');
            }
        };
    } catch (error) {
        console.error('Error loading interest topic:', error);
        showNotification('Failed to load interest topic details', 'error');
    }
}

async function deleteInterest(id) {
    if (!confirm('Are you sure you want to delete this interest topic?')) {
        return;
    }

    try {
        await fetchWithAuth(`${API.interests}/${id}`, {
            method: 'DELETE'
        });
        loadInterests();
        showNotification('Interest topic deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting interest topic:', error);
        showNotification('Failed to delete interest topic', 'error');
    }
}

// Icon Management
async function loadIcons() {
    try {
        const icons = await fetchWithAuth(API.icons);
        updateIcons(icons);
    } catch (error) {
        console.error('Error loading icons:', error);
        showNotification('Failed to load icons', 'error');
    }
}

function updateIcons(icons) {
    document.getElementById('weeklyChallengesIcon').src = icons.weeklyChallenges;
    document.getElementById('profileIcon').src = icons.profile;
    document.getElementById('communityIcon').src = icons.community;
}

async function uploadIcon(section, event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('icon', file);

    try {
        const response = await fetch(`${API.icons}/${section}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload icon');
        }

        const result = await response.json();
        document.getElementById(`${section}Icon`).src = result.path;
        showNotification('Icon updated successfully', 'success');
    } catch (error) {
        console.error('Error uploading icon:', error);
        showNotification('Failed to upload icon', 'error');
    }
}

async function resetIcon(section) {
    if (!confirm('Are you sure you want to reset this icon to default?')) {
        return;
    }

    try {
        const response = await fetchWithAuth(`${API.icons}/${section}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to reset icon');
        }

        const result = await response.json();
        document.getElementById(`${section}Icon`).src = result.path;
        showNotification('Icon reset to default', 'success');
    } catch (error) {
        console.error('Error resetting icon:', error);
        showNotification('Failed to reset icon', 'error');
    }
}

// Challenge Types Management
async function loadChallengeTypes() {
    try {
        const types = await fetchWithAuth(API.challengeTypes);
        updateChallengeTypesTable(types);
        updateChallengeTypeSelect(types);
    } catch (error) {
        console.error('Error loading challenge types:', error);
        showNotification('Failed to load challenge types', 'error');
    }
}

function updateChallengeTypesTable(types) {
    const tbody = document.getElementById('challengeTypesTableBody');
    tbody.innerHTML = types.map(type => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${type.name}</td>
            <td class="px-6 py-4">${type.description}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editChallengeType('${type.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                <button onclick="deleteChallengeType('${type.id}')" class="ml-2 text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function updateChallengeTypeSelect(types) {
    const select = document.getElementById('challengeType');
    select.innerHTML = types.map(type => 
        `<option value="${type.id}">${type.name}</option>`
    ).join('');
}

async function addChallengeType(event) {
    event.preventDefault();
    
    const type = {
        name: document.getElementById('challengeTypeName').value,
        description: document.getElementById('challengeTypeDescription').value
    };

    try {
        await fetchWithAuth(API.challengeTypes, {
            method: 'POST',
            body: JSON.stringify(type)
        });
        document.getElementById('addChallengeTypeModal').classList.add('hidden');
        document.getElementById('addChallengeTypeForm').reset();
        loadChallengeTypes();
        showNotification('Challenge type added successfully', 'success');
    } catch (error) {
        console.error('Error adding challenge type:', error);
        showNotification('Failed to add challenge type', 'error');
    }
}

async function editChallengeType(id) {
    try {
        const types = await fetchWithAuth(API.challengeTypes);
        const type = types.find(t => t.id === id);
        if (!type) {
            throw new Error('Challenge type not found');
        }

        // Populate the form with type data
        document.getElementById('challengeTypeName').value = type.name;
        document.getElementById('challengeTypeDescription').value = type.description;

        // Show the modal
        document.getElementById('addChallengeTypeModal').classList.remove('hidden');

        // Update the form submission handler
        const form = document.getElementById('addChallengeTypeForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const updatedType = {
                name: document.getElementById('challengeTypeName').value,
                description: document.getElementById('challengeTypeDescription').value
            };

            try {
                await fetchWithAuth(`${API.challengeTypes}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedType)
                });
                document.getElementById('addChallengeTypeModal').classList.add('hidden');
                form.reset();
                loadChallengeTypes();
                showNotification('Challenge type updated successfully', 'success');
            } catch (error) {
                console.error('Error updating challenge type:', error);
                showNotification('Failed to update challenge type', 'error');
            }
        };
    } catch (error) {
        console.error('Error loading challenge type:', error);
        showNotification('Failed to load challenge type details', 'error');
    }
}

async function deleteChallengeType(id) {
    if (!confirm('Are you sure you want to delete this challenge type? This will affect all challenges of this type.')) {
        return;
    }

    try {
        await fetchWithAuth(`${API.challengeTypes}/${id}`, {
            method: 'DELETE'
        });
        loadChallengeTypes();
        showNotification('Challenge type deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting challenge type:', error);
        showNotification('Failed to delete challenge type', 'error');
    }
} 