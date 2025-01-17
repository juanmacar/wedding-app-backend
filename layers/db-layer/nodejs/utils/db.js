const { MongoClient, ServerApiVersion } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

const connectToDatabase = async (uri) => {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        // Create a MongoClient with a MongoClientOptions object to set the Stable API version
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        // Connect the client to the server
        await client.connect();
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");

        const db = client.db('casamiento2025'); // Using your actual database name
        
        cachedClient = client;
        cachedDb = db;
        return db;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
};

const closeConnection = async () => {
    if (cachedClient) {
        try {
            await cachedClient.close();
            cachedClient = null;
            cachedDb = null;
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
};

module.exports = {
    connectToDatabase,
    closeConnection
};
