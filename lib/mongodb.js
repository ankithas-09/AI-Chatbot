const { MongoClient } = require('mongodb');  // Corrected import

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Add Mongo URI to env file');
}

client = new MongoClient(uri, options);
clientPromise = client.connect();

module.exports = clientPromise;  // Use CommonJS syntax
