import express from 'express';
import { ConnectionStore } from '../utils/ConnectionStore';

const router = express.Router();

router.post('/test', async (req, res) => {
  try {
    const { name, uri, config } = req.body;
    await ConnectionStore.saveConnection(name, uri, config);
    res.json({ success: true });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const connections = await ConnectionStore.listConnections();
    // Format connections before sending
    const formattedConnections = connections.map(conn => ({
      name: conn.name,
      uri: conn.uri,
      config: {
        host: conn.config?.host || '',
        port: conn.config?.port || 27017,
        database: conn.config?.database || '',
        username: conn.config?.username || '',
        password: conn.config?.password || '',
        options: conn.config?.options || {}
      }
    }));
    res.json(formattedConnections);
  } catch (error) {
    console.error('List connections error:', error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const success = await ConnectionStore.deleteConnection(name);
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Connection not found' 
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
});

export default router;
