import './loadEnv.js';
import validateEnv from './validateEnv.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

validateEnv();

const app = express();

app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));

const defaultLocal = 'http://127.0.0.1:5173';
const rawFront = process.env.FRONTEND_URL;
let origins = (rawFront && rawFront.trim()
  ? rawFront
  : process.env.NODE_ENV === 'production'
    ? ''
    : defaultLocal
)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (origins.length === 0 && process.env.NODE_ENV !== 'production') {
  origins = [defaultLocal];
}

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use(errorMiddleware);

const PORT = Number(process.env.PORT) || 5000;
const uri = process.env.MONGODB_URI.trim();

const HOST = process.env.HOST || '0.0.0.0';

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 15_000,
    maxPoolSize: 10,
  })
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`API listening on http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
