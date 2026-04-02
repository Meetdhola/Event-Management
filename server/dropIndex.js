const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      await mongoose.connection.collection('resources').dropIndex('name_1');
      console.log('Index name_1 dropped successfully');
    } catch (err) {
      console.log('Index drop error or already dropped:', err.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });
