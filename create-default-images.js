const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create default images
const images = [
    { name: 'default-challenge.png', color: '#4CAF50' },
    { name: 'default-profile.png', color: '#2196F3' },
    { name: 'default-community.png', color: '#FF9800' }
];

// Ensure directories exist
const dirs = ['public/images', 'public/uploads/icons'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Generate images
images.forEach(({ name, color }) => {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 200, 200);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.split('.')[0].replace('default-', '').toUpperCase(), 100, 100);

    // Save to both locations
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join('public/images', name), buffer);
    fs.writeFileSync(path.join('public/uploads/icons', name), buffer);
}); 