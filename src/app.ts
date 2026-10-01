import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import facilityRoutes from './routes/facility.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes'; // Import notification routes

const app = express();

app.use(cors());
app.use(express.json());

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
app.use('/notifications', notificationRoutes); // Daftarkan rute /notifications

export default app;