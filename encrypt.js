const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const PASSWORD = 'polybot2025'; // You can change this
const FILES_TO_ENCRYPT = [
    'protected/polybot-source.html',
    // Add more files here as needed
];

// Ensure output directory exists
const protectedDir = path.join(__dirname, 'protected');
if (!fs.existsSync(protectedDir)) {
    fs.mkdirSync(protectedDir, { recursive: true });
}

// Encrypt each file
FILES_TO_ENCRYPT.forEach(file => {
    const inputPath = path.join(__dirname, file);
    const outputPath = inputPath.replace('-source.html', '.html');
    
    if (fs.existsSync(inputPath)) {
        console.log(`Encrypting ${file}...`);
        
        try {
            // Run staticrypt command
            execSync(`npx staticrypt ${inputPath} -p ${PASSWORD} -o ${outputPath} --title "Protected Content" --instructions "Enter password to view protected content"`, {
                stdio: 'inherit'
            });
            
            console.log(`✓ Encrypted to ${outputPath}`);
            
            // Remove source file after encryption
            fs.unlinkSync(inputPath);
            console.log(`✓ Removed source file ${inputPath}`);
        } catch (error) {
            console.error(`Error encrypting ${file}:`, error);
        }
    } else {
        console.log(`Warning: ${file} not found`);
    }
});

console.log('\nEncryption complete!');
console.log(`Password: ${PASSWORD}`);
console.log('Share this password with interviewers to grant access.');