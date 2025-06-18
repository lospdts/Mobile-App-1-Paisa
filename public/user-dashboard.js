// Global variables
let currentUser = null;
let currentChallenge = null;
let allChallenges = [];
let userCompletedChallenges = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from authentication
    currentUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
    };
    
    loadUserData();
    loadChallenges();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

async function loadUserData() {
    try {
        const response = await fetch(`/api/users/${currentUser.id}/points`);
        const userData = await response.json();
        
        currentUser.points = userData.points;
        userCompletedChallenges = userData.completedChallenges;
        
        updateUserDisplay();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateUserDisplay() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userPoints').textContent = currentUser.points || 0;
    document.getElementById('totalPoints').textContent = currentUser.points || 0;
    document.getElementById('completedChallenges').textContent = userCompletedChallenges.length;
}

async function loadChallenges() {
    try {
        const response = await fetch('/api/challenges');
        allChallenges = await response.json();
        
        const activeChallenges = allChallenges.filter(challenge => 
            challenge.status === 'active' && 
            !userCompletedChallenges.includes(challenge.id)
        );
        
        const completedChallenges = allChallenges.filter(challenge => 
            userCompletedChallenges.includes(challenge.id)
        );
        
        document.getElementById('availableChallenges').textContent = activeChallenges.length;
        
        displayActiveChallenges(activeChallenges);
        displayCompletedChallenges(completedChallenges);
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

function displayActiveChallenges(challenges) {
    const container = document.getElementById('challengesContainer');
    
    if (challenges.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500">No active challenges available at the moment.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = challenges.map(challenge => `
        <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-semibold text-gray-900">${challenge.title}</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ${challenge.points || 0} pts
                </span>
            </div>
            <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Type:</span> ${challenge.type}
                </p>
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Start:</span> ${new Date(challenge.startDate).toLocaleDateString()}
                </p>
                <p class="text-sm text-gray-600">
                    <span class="font-medium">End:</span> ${new Date(challenge.endDate).toLocaleDateString()}
                </p>
            </div>
            <button 
                onclick="showCompletionModal('${challenge.id}')"
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
                Complete Challenge
            </button>
        </div>
    `).join('');
}

function displayCompletedChallenges(challenges) {
    const container = document.getElementById('completedChallengesContainer');
    
    if (challenges.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500">No completed challenges yet. Start with an active challenge!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = challenges.map(challenge => `
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm">
            <div class="flex justify-between items-start mb-4">
                <h4 class="text-lg font-semibold text-gray-900">${challenge.title}</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Completed
                </span>
            </div>
            <div class="space-y-2 mb-4">
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Type:</span> ${challenge.type}
                </p>
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Points Earned:</span> ${challenge.points || 0}
                </p>
                <p class="text-sm text-gray-600">
                    <span class="font-medium">Completed:</span> ${new Date(challenge.endDate).toLocaleDateString()}
                </p>
            </div>
        </div>
    `).join('');
}

function showCompletionModal(challengeId) {
    const challenge = allChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    currentChallenge = challenge;
    
    const modal = document.getElementById('completionModal');
    const content = document.getElementById('completionModalContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <h4 class="font-medium text-gray-900">${challenge.title}</h4>
                <p class="text-sm text-gray-600">Are you sure you want to mark this challenge as completed?</p>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p class="text-sm text-blue-800">
                    <span class="font-medium">Points to earn:</span> ${challenge.points || 0}
                </p>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p class="text-sm text-yellow-800">
                    <span class="font-medium">Note:</span> This action cannot be undone. Make sure you have actually completed the challenge requirements.
                </p>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    modal.classList.add('hidden');
    currentChallenge = null;
}

async function confirmChallengeCompletion() {
    if (!currentChallenge) return;
    
    try {
        const response = await fetch(`/api/users/${currentUser.id}/complete-challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                challengeId: currentChallenge.id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.error}`);
            return;
        }
        
        const result = await response.json();
        
        // Update local data
        currentUser.points = result.totalPoints;
        userCompletedChallenges = result.completedChallenges;
        
        // Update display
        updateUserDisplay();
        loadChallenges();
        
        // Show success message
        alert(`Congratulations! You earned ${result.pointsEarned} points for completing "${currentChallenge.title}"!`);
        
        closeCompletionModal();
    } catch (error) {
        console.error('Error completing challenge:', error);
        alert('Failed to complete challenge. Please try again.');
    }
}

function logout() {
    // In a real app, this would clear authentication tokens
    alert('Logout functionality would be implemented here');
    // Redirect to login page or home page
    window.location.href = '/login.html';
} 