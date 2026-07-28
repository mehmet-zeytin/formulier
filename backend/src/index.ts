import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import werkorderRoutes from './routes/werkorderRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/werkorders', werkorderRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Formulier API çalışıyor' });
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});