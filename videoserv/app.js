const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const videoRoutes = require('./routes/videoRoutes');


dotenv.config();
const app = express();
const PORT = process.env.PORT;
const allowedOrigin = process.env.FRONTEND_URL;

const corsOptions = {
    origin: allowedOrigin, // Frontend URL
    methods: ['GET', 'POST', 'DELETE'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // Allowed headers
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use('/api/videos', videoRoutes);

app.listen(PORT, () => {
    console.log(`Video Service running on http://localhost:${PORT}`);
});
