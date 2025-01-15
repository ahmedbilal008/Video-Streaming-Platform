
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT;
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({ origin: allowedOrigin, credentials: true,allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`User Account Service running on http://localhost:${PORT}`);
});
