const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const validateToken = require('../utils/validateToken');
require('dotenv').config();
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/add', async (req, res) => {
    const { user_id, action, description, service } = req.body;
    if (!action || !description || !service) {
        return res.status(400).json({ message: 'Invalid input: action, description, and service are required.' });
    }

    try {
        // Insert log into the database
        const { error } = await supabase
            .from('logs')
            .insert([
                {
                    user_id,
                    action_type: action,
                    description,
                    service_name: service,
                    created_at: new Date(),
                },
            ]);

        if (error) throw error;

        res.status(201).json({ message: 'Log added successfully' });
    } catch (err) {
        console.error('Error adding log:', err.message);
        res.status(500).json({ message: 'Failed to add log', error: err.message });
    }
});

router.get('/user/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { start = 0 } = req.query;
    const limit = 100;

    try {
        // Get the total count of logs for the user
        const { count, error: countError } = await supabase
            .from('logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);

        if (countError) throw countError;

        const totalLogs = count || 0;

        // Adjust the range based on the total logs
        const end = Math.min(Number(start) + limit - 1, totalLogs - 1);

        // Fetch logs for the user with pagination
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(Number(start), end);

        if (error) throw error;

        res.status(200).json({ logs: data, total: totalLogs });
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
    }
});


router.get('/all', async (req, res) => {
    const { start = 0 } = req.query;
    const limit = 100;

    try {
        // Validate the token and get the user's details
        const user = validateToken(req);

        // Check if the user has admin privileges
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError) throw userError;
        if (!userData || userData.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }

        // Get the total count of logs
        const { count, error: countError } = await supabase
            .from('logs')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        const totalLogs = count || 0;

        // Adjust the range based on the total logs
        const end = Math.min(Number(start) + limit - 1, totalLogs - 1);

        // Fetch logs for all users with pagination
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(Number(start), end);

        if (logsError) throw logsError;

        res.status(200).json({ logs, total: totalLogs });
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
    }
});



// Default fallback for invalid routes
router.all('*', (req, res) => {
    res.status(404).json({ message: 'Invalid route' });
});

module.exports = router;
