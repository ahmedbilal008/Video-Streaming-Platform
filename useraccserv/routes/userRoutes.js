// routes/userRoutes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
const logAction = require('../utils/logAction');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const JWT_SECRET = process.env.JWT_SECRET; // Store securely in environment variables

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // Check if the user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            setImmediate(() => logAction(null, 'REGISTER', 'User already exists with this email', 'UserAccountService'));
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const { error } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword, username: username || 'Default Username' }]);

        if (error) {
            setImmediate(() => logAction(null, 'REGISTER', `Error: ${error.message}`, 'UserAccountService'));
            return res.status(500).json({ message: 'Error saving user data', error: error.message });
        }

        setImmediate(() => logAction(null, 'REGISTER', 'User registered successfully', 'UserAccountService'));
        res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        setImmediate(() => logAction(null, 'REGISTER', `Error: ${err.message}`, 'UserAccountService'));
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

//get username and user data
router.get('/user/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, username, created_at, role')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user data', error: err.message });
    }
});



// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Fetch the user with the given email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            setImmediate(() => logAction(null, 'LOGIN', 'Invalid credentials', 'UserAccountService'));
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            setImmediate(() => logAction(null, 'LOGIN', 'Invalid credentials', 'UserAccountService'));
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token for the user
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        setImmediate(() => logAction(user.id, 'LOGIN', 'User logged in successfully', 'UserAccountService'));
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        setImmediate(() => logAction(null, 'LOGIN', `Error: ${err.message}`, 'UserAccountService'));
        res.status(500).json({ message: 'Error logging in user', error: err.message });
    }
});

// Backend (Logout route)
// router.post('/logout', (req, res) => {
//     res.clearCookie('token', {
//         httpOnly: false,
//         secure: false,  // Set to true in production with HTTPS
//         sameSite: 'none',
//     });
//     setImmediate(() => logAction(req.user?.id || null, 'LOGOUT', 'User logged out successfully', 'UserAccountService'));
//     res.status(200).json({ message: 'Logged out successfully' });
// });

module.exports = router;
