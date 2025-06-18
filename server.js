const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Helper functions
const ensureDataFile = (filename, defaultData) => {
    const filePath = path.join(__dirname, 'data', filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

const readData = (filename) => {
    const filePath = path.join(__dirname, 'data', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeData = (filename, data) => {
    const filePath = path.join(__dirname, 'data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data files if they don't exist
ensureDataFile('users.json', [
    { id: '1', name: 'John Doe', email: 'john@example.com', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', status: 'active', points: 0, completedChallenges: [] },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', status: 'active', points: 0, completedChallenges: [] }
]);

ensureDataFile('challenges.json', [
    { id: '1', title: 'Weekly Fitness Challenge', type: 'fitness', startDate: '2024-01-01', endDate: '2024-01-07', status: 'active', points: 100 },
    { id: '2', title: 'Health & Wellness', type: 'health', startDate: '2024-01-08', endDate: '2024-01-14', status: 'active', points: 150 }
]);

ensureDataFile('features.json', [
    { id: '1', name: 'Social Feed', status: 'active', testers: ['user1', 'user2'] },
    { id: '2', name: 'Challenge Tracker', status: 'testing', testers: ['user3'] }
]);

ensureDataFile('challenge-types.json', [
    { id: '1', name: 'Fitness', description: 'Physical fitness challenges' },
    { id: '2', name: 'Health', description: 'Health and wellness challenges' },
    { id: '3', name: 'Social', description: 'Social interaction challenges' },
    { id: '4', name: 'Learning', description: 'Educational challenges' }
]);

ensureDataFile('interests.json', [
    { id: '1', name: 'Fitness', description: 'Physical fitness and exercise', createdAt: '2024-01-01' },
    { id: '2', name: 'Health', description: 'Health and wellness', createdAt: '2024-01-01' },
    { id: '3', name: 'Technology', description: 'Technology and innovation', createdAt: '2024-01-01' }
]);

// Initialize admin credentials file
// ensureDataFile('admin.json', {
//     username: 'admin',
//     password: 'admin' // In production, this should be hashed
// });

// Manually create admin.json with correct credentials
const adminFilePath = path.join(__dirname, 'data', 'admin.json');
fs.writeFileSync(adminFilePath, JSON.stringify({
    username: 'admin',
    password: 'admin'
}, null, 2));

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
    console.log('Admin login attempt:', req.body);
    const { username, password } = req.body;
    const adminCredentials = readData('admin.json');
    
    if (username === adminCredentials.username && password === adminCredentials.password) {
        res.json({ 
            token: 'admin-token-' + Date.now(),
            isAdmin: true
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Password change endpoint
app.post('/api/auth/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminCredentials = readData('admin.json');
    
    // Validate current password
    if (currentPassword !== adminCredentials.password) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    
    // Update password
    adminCredentials.password = newPassword;
    writeData('admin.json', adminCredentials);
    
    res.json({ message: 'Password changed successfully' });
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        
        // Check if user already exists
        const users = readData('users.json');
        const existingUser = users.find(user => user.email === email);
        
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: hashedPassword,
            status: 'active',
            points: 0,
            completedChallenges: [],
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        writeData('users.json', users);
        
        res.status(201).json({ 
            message: 'User registered successfully',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login endpoint
app.post('/api/auth/user-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user
        const users = readData('users.json');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({ error: 'Account is not active' });
        }
        
        res.json({
            token: 'user-token-' + user.id,
            userId: user.id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// CRUD endpoints for users, challenges, and features
['users', 'challenges', 'features'].forEach(resource => {
    const filename = `${resource}.json`;
    
    app.get(`/api/${resource}`, (req, res) => {
        res.json(readData(filename));
    });

    app.get(`/api/${resource}/:id`, (req, res) => {
        const data = readData(filename);
        const item = data.find(item => item.id === req.params.id);
        if (!item) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(item);
    });

    app.post(`/api/${resource}`, (req, res) => {
        const data = readData(filename);
        const newItem = { id: Date.now().toString(), ...req.body };
        data.push(newItem);
        writeData(filename, data);
        res.json(newItem);
    });

    app.put(`/api/${resource}/:id`, (req, res) => {
        const data = readData(filename);
        const index = data.findIndex(item => item.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Not found' });
        }
        data[index] = { ...data[index], ...req.body };
        writeData(filename, data);
        res.json(data[index]);
    });

    app.delete(`/api/${resource}/:id`, (req, res) => {
        const data = readData(filename);
        const index = data.findIndex(item => item.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Not found' });
        }
        data.splice(index, 1);
        writeData(filename, data);
        res.json({ message: 'Deleted successfully' });
    });
});

// Challenge Types endpoints
app.get('/api/challenge-types', (req, res) => {
    res.json(readData('challenge-types.json'));
});

app.get('/api/challenge-types/:id', (req, res) => {
    const data = readData('challenge-types.json');
    const item = data.find(item => item.id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
});

app.post('/api/challenge-types', (req, res) => {
    const data = readData('challenge-types.json');
    const newItem = { id: Date.now().toString(), ...req.body };
    data.push(newItem);
    writeData('challenge-types.json', data);
    res.json(newItem);
});

app.put('/api/challenge-types/:id', (req, res) => {
    const data = readData('challenge-types.json');
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Not found' });
    }
    data[index] = { ...data[index], ...req.body };
    writeData('challenge-types.json', data);
    res.json(data[index]);
});

app.delete('/api/challenge-types/:id', (req, res) => {
    const data = readData('challenge-types.json');
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Not found' });
    }
    data.splice(index, 1);
    writeData('challenge-types.json', data);
    res.json({ message: 'Deleted successfully' });
});

// Interests endpoints
app.get('/api/interests', (req, res) => {
    res.json(readData('interests.json'));
});

app.get('/api/interests/:id', (req, res) => {
    const data = readData('interests.json');
    const item = data.find(item => item.id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
});

app.post('/api/interests', (req, res) => {
    const data = readData('interests.json');
    const newItem = { 
        id: Date.now().toString(), 
        ...req.body, 
        createdAt: new Date().toISOString().split('T')[0] 
    };
    data.push(newItem);
    writeData('interests.json', data);
    res.json(newItem);
});

app.put('/api/interests/:id', (req, res) => {
    const data = readData('interests.json');
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Not found' });
    }
    data[index] = { ...data[index], ...req.body };
    writeData('interests.json', data);
    res.json(data[index]);
});

app.delete('/api/interests/:id', (req, res) => {
    const data = readData('interests.json');
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Not found' });
    }
    data.splice(index, 1);
    writeData('interests.json', data);
    res.json({ message: 'Deleted successfully' });
});

// Icons endpoints
app.get('/api/icons', (req, res) => {
    res.json([
        { name: 'default-challenge.png', path: '/images/default-challenge.png' },
        { name: 'default-profile.png', path: '/images/default-profile.png' },
        { name: 'default-community.png', path: '/images/default-community.png' }
    ]);
});

app.post('/api/icons/upload', (req, res) => {
    // Mock icon upload response
    res.json({ url: '/images/default-challenge.png' });
});

app.post('/api/icons/reset/:type', (req, res) => {
    const type = req.params.type;
    let defaultPath = '/images/default-challenge.png';
    
    if (type === 'profile') {
        defaultPath = '/images/default-profile.png';
    } else if (type === 'community') {
        defaultPath = '/images/default-community.png';
    }
    
    res.json({ url: defaultPath });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    const users = readData('users.json');
    const features = readData('features.json');
    const challenges = readData('challenges.json');
    
    res.json({
        totalUsers: users.length,
        activeFeatures: features.filter(f => f.status === 'active').length,
        pendingFeedback: 5 // Mock data
    });
});

// User challenge completion endpoint
app.post('/api/users/:userId/complete-challenge', (req, res) => {
    const { userId } = req.params;
    const { challengeId } = req.body;
    
    const users = readData('users.json');
    const challenges = readData('challenges.json');
    
    const user = users.find(u => u.id === userId);
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Check if user already completed this challenge
    if (user.completedChallenges && user.completedChallenges.includes(challengeId)) {
        return res.status(400).json({ error: 'Challenge already completed' });
    }
    
    // Add points to user
    user.points = (user.points || 0) + challenge.points;
    
    // Add challenge to completed list
    if (!user.completedChallenges) {
        user.completedChallenges = [];
    }
    user.completedChallenges.push(challengeId);
    
    // Update user data
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex] = user;
    writeData('users.json', users);
    
    res.json({
        message: 'Challenge completed successfully',
        pointsEarned: challenge.points,
        totalPoints: user.points,
        completedChallenges: user.completedChallenges
    });
});

// Get user points and completed challenges
app.get('/api/users/:userId/points', (req, res) => {
    const { userId } = req.params;
    const users = readData('users.json');
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        userId: user.id,
        points: user.points || 0,
        completedChallenges: user.completedChallenges || []
    });
});

// Get all users with points (for admin dashboard)
app.get('/api/users/points', (req, res) => {
    const users = readData('users.json');
    
    const usersWithPoints = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        points: user.points || 0,
        completedChallenges: user.completedChallenges || []
    }));
    
    res.json(usersWithPoints);
});

// Admin route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// User dashboard route
app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

// Login page route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Admin login page route
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Signup page route
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Default route - serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Challenges CRUD
app.get('/api/challenges', (req, res) => {
    const challenges = readData('challenges.json');
    res.json(challenges);
});

app.get('/api/challenges/:id', (req, res) => {
    const challenges = readData('challenges.json');
    const challenge = challenges.find(c => c.id === req.params.id);
    if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
});

app.post('/api/challenges', (req, res) => {
    const challenges = readData('challenges.json');
    const newChallenge = {
        id: Date.now().toString(),
        ...req.body,
        points: parseInt(req.body.points) || 0
    };
    challenges.push(newChallenge);
    writeData('challenges.json', challenges);
    res.json(newChallenge);
});

app.put('/api/challenges/:id', (req, res) => {
    const challenges = readData('challenges.json');
    const index = challenges.findIndex(c => c.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Challenge not found' });
    }
    
    challenges[index] = {
        ...challenges[index],
        ...req.body,
        points: parseInt(req.body.points) || challenges[index].points || 0
    };
    
    writeData('challenges.json', challenges);
    res.json(challenges[index]);
});

app.delete('/api/challenges/:id', (req, res) => {
    const challenges = readData('challenges.json');
    const index = challenges.findIndex(c => c.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Challenge not found' });
    }
    challenges.splice(index, 1);
    writeData('challenges.json', challenges);
    res.json({ message: 'Challenge deleted successfully' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/logout');
    console.log('- POST /api/auth/change-password');
    console.log('- GET/POST/PUT/DELETE /api/users');
    console.log('- GET/POST/PUT/DELETE /api/features');
    console.log('- GET/POST/PUT/DELETE /api/challenges');
    console.log('- GET/POST/PUT/DELETE /api/challenge-types');
    console.log('- GET/POST/PUT/DELETE /api/interests');
}); 