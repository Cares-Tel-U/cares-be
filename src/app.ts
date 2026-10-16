import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import facilityRoutes from './routes/facility.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Rate Limiter: Maksimal 100 request per 15 menit per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.' },
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// PENTING: Folder Statis untuk Akses Foto Bukti
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint Tes Server
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CARES Backend API!' });
});

// Registrasi Seluruh Route Backend
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/facilities', facilityRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);

export default app;