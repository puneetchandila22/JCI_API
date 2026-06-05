import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => res.send('JCI SmartFactory API is running'));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/v1', apiRoutes);

// start only after DB is connected
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
