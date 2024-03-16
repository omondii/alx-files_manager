/**
 * MondoDb connector
 */
const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.db = null;
    (async () => {
      try {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}/${database}`;

        const client = await MongoClient.connect(url, { useUnifiedTopology: true });
        this.db = client.db(database);
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        this.db = null;
      }
    })();
  }

  /**
     * Checks if connection was successful or failed
     * @returns {boolean}
     */
  isAlive() {
    if (this.db) {
      return true;
    }
    return false;
  }

  /**
     * Returns the number of documents in the collection users
     * @returns {int}
     */
  async nbUsers() {
    try {
      const count = await this.db.collection('users').countDocuments();
      return count;
    } catch (error) {
      console.error('Error');
      throw error;
    }
  }

  /**
     * Returns the number of documents in the collection files
     * @returns {int}
     */
  async nbFiles() {
    try {
      const count = await this.db.collection('files').countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting file documents:', error);
      throw error;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
