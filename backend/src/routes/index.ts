import express from 'express';
import connectionRoutes from './connections';

const router = express.Router();

// Define your routes here
router.get('/', (req, res) => {
    res.send('Hello World');
});

router.use('/connections', connectionRoutes);

export { router };
