// Quick MongoDB Connection Test
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 MongoDB Connection Test\n');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

// Show safe version of URI (hiding password)
if (process.env.MONGO_URI) {
    const safeUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@');
    console.log('URI format:', safeUri);
}

console.log('\nAttempting connection...\n');

mongoose.connect(process.env.MONGO_URI)
    .then((conn) => {
        console.log('✅ SUCCESS! Connected to MongoDB');
        console.log('Host:', conn.connection.host);
        console.log('Database:', conn.connection.name);
        process.exit(0);
    })
    .catch((err) => {
        console.log('❌ FAILED:', err.message);

        // Check for common issues
        if (process.env.MONGO_URI) {
            const uri = process.env.MONGO_URI;

            // Check for unencoded special chars
            const passwordMatch = uri.match(/:([^@]+)@/);
            if (passwordMatch) {
                const password = passwordMatch[1];
                const specialChars = ['@', '#', '$', '%', '&', '+', '/', '?', '='];
                const hasSpecial = specialChars.some(c => password.includes(c));

                if (hasSpecial) {
                    console.log('\n⚠️  Your password contains special characters!');
                    console.log('   These need to be URL-encoded:');
                    console.log('   @ → %40');
                    console.log('   # → %23');
                    console.log('   $ → %24');
                    console.log('   % → %25');
                    console.log('   & → %26');
                    console.log('   + → %2B');
                    console.log('   / → %2F');
                }
            }
        }

        process.exit(1);
    });
