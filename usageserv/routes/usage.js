const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const validateToken = require('../utils/validateToken');
const logAction = require('../utils/logAction');
require('dotenv').config();
const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Bandwidth limit per day (in MB)
const DAILY_BANDWIDTH_LIMIT = 100;

// API to fetch daily bandwidth usage
router.get('/daily-usage', async (req, res) => {
    let userId = null; // Initialize userId as null
    try {
        // Validate the user token
        const user = validateToken(req);
        //console.log('User:', user);
        userId = user.id; 
        
        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Query videos uploaded today
        const { data, error } = await supabase
            .from('videos')
            .select('size_mb, uploaded_at')
            .eq('user_id', userId)
            .gte('uploaded_at', `${today}T00:00:00`)
            .lte('uploaded_at', `${today}T23:59:59`);

        if (error) throw error;

        // Calculate total bandwidth usage
        const totalUsageMb = data.reduce((acc, video) => acc + parseFloat(video.size_mb), 0);
        const isThresholdExceeded = totalUsageMb > DAILY_BANDWIDTH_LIMIT;

        // Use setImmediate for logging success
        setImmediate(() => {
            logAction(userId, 'CHECK_BANDWIDTH', 'User checked daily bandwidth usage', 'UsageMonitoringService');
        });

        res.status(200).json({
            totalUsageMb,
            dailyLimitMb: DAILY_BANDWIDTH_LIMIT,
            isThresholdExceeded,
            message: isThresholdExceeded
                ? 'Daily bandwidth limit exceeded. No further uploads allowed.'
                : 'Bandwidth usage is within the daily limit.',
        });
    } catch (err) {
        // Log failure asynchronously with setImmediate
        setImmediate(() => {
            logAction(userId, 'CHECK_BANDWIDTH', `Error: ${err.message}`, 'UsageMonitoringService');
        });

        res.status(500).json({ message: 'Error fetching daily bandwidth usage', error: err.message });
    }
});

module.exports = router;
