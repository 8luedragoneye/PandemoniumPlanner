import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import activityRoutes from './routes/activities';
import roleRoutes from './routes/roles';
import signupRoutes from './routes/signups';
import pairRoutes from './routes/pairs';
import fillProviderRoutes from './routes/fillProviders';
import fillAssignmentRoutes from './routes/fillAssignments';
import premadeActivityRoutes from './routes/premadeActivities';
import prisma from './lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/signups', signupRoutes);
app.use('/api/pairs', pairRoutes);
app.use('/api/fill-providers', fillProviderRoutes);
app.use('/api/fill-assignments', fillAssignmentRoutes);
app.use('/api/premade-activities', premadeActivityRoutes);

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
