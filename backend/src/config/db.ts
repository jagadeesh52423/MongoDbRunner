import { MongoClient } from 'mongodb';

class DatabaseConnection {
    private static instances: Map<string, MongoClient> = new Map();

    static async getConnection(uri: string): Promise<MongoClient> {
        if (!this.instances.has(uri)) {
            const client = new MongoClient(uri);
            await client.connect();
            this.instances.set(uri, client);
        }
        return this.instances.get(uri)!;
    }

    static async closeConnection(uri: string): Promise<void> {
        const client = this.instances.get(uri);
        if (client) {
            await client.close();
            this.instances.delete(uri);
        }
    }
}

export default DatabaseConnection;
