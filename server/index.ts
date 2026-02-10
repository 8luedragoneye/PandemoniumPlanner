import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import activityRoutes from './routes/activities';
import roleRoutes from './routes/roles';
import signupRoutes from './routes/signups';
import pairRoutes from './routes/pairs';
import fillProviderRoutes from './routes/fillProviders';
import fillAssignmentRoutes from './routes/fillAssignments';
import premadeActivityRoutes from './routes/premadeActivities';
import bugReportRoutes from './routes/bugReports';
import prisma from './lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In production, serve the built frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/signups', signupRoutes);
app.use('/api/pairs', pairRoutes);
app.use('/api/fill-providers', fillProviderRoutes);
app.use('/api/fill-assignments', fillAssignmentRoutes);
app.use('/api/premade-activities', premadeActivityRoutes);
app.use('/api/bug-reports', bugReportRoutes);

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA catch-all: serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
