const axios = require('axios');
require('dotenv').config();
const LOGGING_SERVICE_URL = process.env.LOGGING_SERVICE_URL;

async function logAction(userId, action, description, service) {
    try {
        await axios.post(`${LOGGING_SERVICE_URL}/api/logs/add`, {
            user_id: userId,
            action,
            description,
            service,
        });
    } catch (err) {
        console.error(`Logging failed: ${err.message}`);
    }
}

module.exports = logAction;
