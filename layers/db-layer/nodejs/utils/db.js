import mongoose from 'mongoose';

let connection = null;

export const connectToDatabase = async (uri) => {
    if (connection) {
        return connection;
    }

    try {
        mongoose.set('strictQuery', false);
        connection = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log("Successfully connected to MongoDB!");
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
};

export const closeConnection = async () => {
    if (connection) {
        try {
            await mongoose.disconnect();
            connection = null;
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    }
};
