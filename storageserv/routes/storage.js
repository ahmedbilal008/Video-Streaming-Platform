const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const validateToken = require('../utils/validateToken');
const logAction = require('../utils/logAction');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Maximum storage limit per user (in MB)
const MAX_STORAGE_MB = 50;

// Fetch user's storage usage
router.get('/usage', async (req, res) => {
    let userId = null; // Initialize userId as null
    try {
        // Validate the user token
        const user = validateToken(req);
        //console.log('User:', user);
        userId = user.id; // Assign userId after token validation

        // Query the total size of undeleted videos for the user
        const { data, error } = await supabase
            .from('videos')
            .select('size_mb')
            .eq('user_id', userId)
            .is('deleted_at', null);

        if (error) throw error;

        // Calculate the total storage usage
        const totalSizeMb = data.reduce((acc, video) => acc + parseFloat(video.size_mb), 0);

        // Log success
        setImmediate(() =>
            logAction(userId, 'CHECK_STORAGE', 'User checked storage usage', 'StorageManagementService')
        );

        res.status(200).json({
            totalSizeMb,
            maxStorageMb: MAX_STORAGE_MB,
            usagePercentage: ((totalSizeMb / MAX_STORAGE_MB) * 100).toFixed(2),
        });
    } catch (err) {
        // Log failure with userId if available, otherwise send null
        console.error('Error:', err.message);
        setImmediate(() =>
            logAction(userId, 'CHECK_STORAGE', `Error: ${err.message}`, 'StorageManagementService')
        );
        res.status(500).json({ message: 'Error fetching storage usage', error: err.message });
    }
});

module.exports = router;
