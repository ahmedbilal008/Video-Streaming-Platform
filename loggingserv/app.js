const express = require('express');
const cookieParser = require('cookie-parser');
const logsRouter = require('./routes/logs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const allowedOrigin = process.env.FRONTEND_URL;

app.use(cors({ origin: allowedOrigin, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(cookieParser());
app.use('/api/logs', logsRouter);

app.listen(PORT, () => {
    console.log(`Logging Service running on port ${PORT}`);
});
