const express = require('express');
const dotenv = require('dotenv');
const usageRoutes = require('./routes/usage');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

const PORT = process.env.PORT;
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({ origin: allowedOrigin, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/usage', usageRoutes);

app.listen(PORT, () => {
    console.log(`Usage Monitoring Service running on port ${PORT}`);
});
