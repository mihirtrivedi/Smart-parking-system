import express from 'express';
import path from 'path';
import parkingRoutes from './routes/parking.routes';

const app = express();

app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/api/v1/parking', parkingRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

export default app;
