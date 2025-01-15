const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const storageRoutes = require('./routes/storage');

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({ origin: allowedOrigin, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/storage', storageRoutes);
app.listen(PORT, () => {
    console.log(`Storage Management Service running on port ${PORT}`);
});
