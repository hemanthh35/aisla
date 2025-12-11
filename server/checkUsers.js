const mongoose = require('mongoose');
const fs = require('fs');

const MONGO_URI = 'mongodb+srv://nadukulahemanth:SpHYVa7BCmlHOwT4@cluster0.fx9xp1x.mongodb.net/aisla?retryWrites=true&w=majority&appName=labs';

async function checkUsers() {
    try {
        await mongoose.connect(MONGO_URI);

        const users = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).toArray();

        // Write to JSON file
        fs.writeFileSync('users_data.json', JSON.stringify(users, null, 2));
        console.log('Users data saved to users_data.json');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
