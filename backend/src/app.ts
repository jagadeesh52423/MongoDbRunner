import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { router as yourRoutes } from './routes';
import { env } from './config/env';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', yourRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ 
    error: 'Something broke!', 
    message: err.message 
  });
});

app.listen(env.port, () => {
  console.log(`Server is running at http://localhost:${env.port} in ${env.nodeEnv} mode`);
});

export default app;
