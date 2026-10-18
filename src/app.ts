import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import facilityRoutes from './routes/facility.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Rate Limiter: Maksimal 1000 request per 15 menit per IP (fleksibel untuk pengujian)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    status: 'error',
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.',
  },
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis hasil upload foto bukti laporan
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Muat Spesifikasi Swagger OpenAPI
let swaggerDocument: any = {};
try {
  const swaggerPath = path.join(__dirname, 'docs/swagger.json');
  if (fs.existsSync(swaggerPath)) {
    swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  } else {
    const cwdSwaggerPath = path.join(process.cwd(), 'src/docs/swagger.json');
    if (fs.existsSync(cwdSwaggerPath)) {
      swaggerDocument = JSON.parse(fs.readFileSync(cwdSwaggerPath, 'utf8'));
    }
  }
} catch (err) {
  console.error('Gagal memuat dokumentasi swagger:', err);
}

// Rute Dokumentasi Interaktif Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint Root & Health Check API
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to CARES Backend API!',
    documentation: '/api-docs',
    version: 'v1.0.0',
  });
});

// Router Versi 1 (Standar RESTful API: /api/v1/...)
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/facilities', facilityRoutes);
v1Router.use('/reports', reportRoutes);
v1Router.use('/admin', adminRoutes);
v1Router.use('/notifications', notificationRoutes);

// Daftarkan rute standar versioning
app.use('/api/v1', v1Router);
app.use('/api', v1Router);

// Rute Direct / Root untuk kompatibilitas penuh skenario pengujian yang sudah ada
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/facilities', facilityRoutes);
app.use('/reports', reportRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);

export default app;