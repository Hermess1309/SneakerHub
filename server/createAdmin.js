const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/user.model');
require('dotenv').config();

const email = 'thanhhuy123@gmail.com';
const password = '123456';

const createAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookstore";
        console.log(`Connecting to MongoDB at ${uri}...`);
        
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            user.password = hashedPassword;
            user.isAdmin = true;
            user.fullName = "Đoàn Thanh Huy";
            await user.save();
            console.log("Account already existed. Successfully updated it to Admin status with the new password!");
        } else {
            user = await User.create({
                fullName: "Đoàn Thanh Huy",
                email: email,
                password: hashedPassword,
                isAdmin: true
            });
            console.log("Admin account created successfully!");
        }

        console.log("User Details:");
        console.log(`- Name: ${user.fullName}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- isAdmin: ${user.isAdmin}`);
        
        mongoose.connection.close();
    } catch (error) {
        console.error("Error occurred while creating admin account:", error);
        process.exit(1);
    }
};

createAdmin();
