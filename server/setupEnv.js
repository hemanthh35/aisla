const fs = require('fs');

const envContent = `# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://nadukulahemanth:SpHYVa7BCmlHOwT4@cluster0.fx9xp1x.mongodb.net/aisla?retryWrites=true&w=majority&appName=labs

# JWT secret key
JWT_SECRET=aisla_jwt_secret_key_2025_hackathon

# Server port
PORT=5000

# Gemini API Key
GEMINI_API_KEY=AIzaSyBdRSSklKN4ALYvMMwX2LFsk375n5JWvaQ
`;

fs.writeFileSync('.env', envContent);
console.log('.env file created successfully!');
