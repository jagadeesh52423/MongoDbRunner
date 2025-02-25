import { Request, Response } from 'express';
import DatabaseConnection from '../config/db';
import { ConnectionStore } from '../utils/ConnectionStore';

export class ConnectionController {
    static async testConnection(req: Request, res: Response) {
        try {
            const { name, uri, config } = req.body;
            const client = await DatabaseConnection.getConnection(uri);
            await DatabaseConnection.closeConnection(uri);
            await ConnectionStore.saveConnection(name, uri, config);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    }

    static async listConnections(req: Request, res: Response) {
        try {
            const connections = await ConnectionStore.listConnections();
            res.json(connections);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    static async deleteConnection(req: Request, res: Response) {
        try {
            const { name } = req.params;
            const success = await ConnectionStore.deleteConnection(name);
            if (!success) {
                return res.status(404).json({ error: 'Connection not found' });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
}
