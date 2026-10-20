const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const cats = await mongoose.connection.db.collection('categories').find({}).toArray();
    console.log(`Total categories in DB: ${cats.length}\n`);
    cats.forEach(c => {
        console.log(`ID: ${c._id} | Name: "${c.nameCategory}" | Image: ${c.imageCategory}`);
    });
    await mongoose.disconnect();
}

check().catch(console.error);
