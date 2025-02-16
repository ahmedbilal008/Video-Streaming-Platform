const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { createClient } = require('@supabase/supabase-js');
const validateToken = require('../utils/validateToken');
const logAction = require('../utils/logAction');
require('dotenv').config();


const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
// Helper function to reset the uploading field in the users table
const resetUploadingStatus = async (userId) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ uploading: null })
            .eq('id', userId);

        if (error) {
            console.error('Error resetting uploading status:', error.message);
        }
    } catch (err) {
        console.error('Error resetting uploading status:', err.message);
    }
};

const upload = multer({ storage: multer.memoryStorage() }); 
// POST route to upload video
router.post('/upload', upload.single('video'), async (req, res) => {
    let userId = null;

    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No video file provided' });
        }

        // Extract title from the request body
        const { title } = req.body;
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Video title is required' });
        }

        // Check if user is currently uploading
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('uploading')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (userData.uploading) {
            const lastUploadTime = new Date(userData.uploading);
            const timeDifferenceMinutes = (new Date() - lastUploadTime) / (1000 * 60);

            if (timeDifferenceMinutes < 5) {
                return res.status(400).json({ message: 'Already uploading. Please wait for a moment before trying again.' });
            }
        }

        // Set the uploading field to the current time
        await supabase
            .from('users')
            .update({ uploading: new Date() })
            .eq('id', userId);

        // Get size of the uploaded file in MB
        const currentVideoSizeMb = (req.file.size / (1024 * 1024)).toFixed(2);

        // Check total storage usage
        const { data: storageData, error: storageError } = await supabase
            .from('videos')
            .select('size_mb')
            .eq('user_id', userId)
            .is('deleted_at', null);

        if (storageError) throw storageError;

        const totalStorageMb = storageData.reduce((acc, video) => acc + parseFloat(video.size_mb), 0);
        const newTotalStorageMb = totalStorageMb + parseFloat(currentVideoSizeMb);

        if (newTotalStorageMb > 50) {
            await resetUploadingStatus(userId);
            return res.status(400).json({ message: 'Exceeding total storage limit of 50MB' });
        }

        // Check daily bandwidth usage
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const { data: bandwidthData, error: bandwidthError } = await supabase
            .from('videos')
            .select('size_mb, uploaded_at')
            .eq('user_id', userId)
            .gte('uploaded_at', `${today}T00:00:00`)
            .lte('uploaded_at', `${today}T23:59:59`);

        if (bandwidthError) throw bandwidthError;

        const totalBandwidthMb = bandwidthData.reduce((acc, video) => acc + parseFloat(video.size_mb), 0);
        const newTotalBandwidthMb = totalBandwidthMb + parseFloat(currentVideoSizeMb);

        if (newTotalBandwidthMb > 100) {
            await resetUploadingStatus(userId);
            return res.status(400).json({ message: `Exceeding daily bandwidth limit of 100 MB` });
        }

        // Proceed to upload the video to Cloudinary
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: 'video', folder: 'videos' },
            async (error, result) => {
                if (error) {
                    await resetUploadingStatus(userId);
                    return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
                }

                // Save video info to Supabase
                const sizeMb = (result.bytes / (1024 * 1024)).toFixed(2);
                const videoId = result.public_id.replace(/^videos\//, '');
                const { data, error: dbError } = await supabase.from('videos').insert([{
                    user_id: userId,
                    filename: videoId,
                    filepath: result.secure_url,
                    title,
                    uploaded_at: new Date(),
                    size_mb: sizeMb,
                    deleted_at: null,
                }]);

                if (dbError) {
                    await resetUploadingStatus(userId);
                    return res.status(500).json({ message: 'Database insertion failed', error: dbError.message });
                }

                // Log successful upload
                setImmediate(() => {
                    logAction(userId, 'UPLOAD_VIDEO', 'User uploaded a new video', 'VideoUploadService');
                });

                await resetUploadingStatus(userId); // Reset the uploading status after success

                res.status(200).json({ message: 'File uploaded successfully', file: result });
            }
        );

        const bufferStream = require('stream').PassThrough();
        bufferStream.end(req.file.buffer);
        bufferStream.pipe(result);

    } catch (err) {
        // Reset the uploading status on any other error
        await resetUploadingStatus(userId);

        // Log error and send response
        setImmediate(() => {
            logAction(userId, 'UPLOAD_VIDEO', `Error: ${err.message}`, 'VideoUploadService');
        });

        res.status(500).json({ message: 'Error uploading video', error: err.message });
    }
});

// Backend: Update video fetch routes to include pagination
const limit = 16; // Set the limit to 16 videos per page

// Fetch all videos with pagination
router.get('/stream', async (req, res) => {
    let userId = null;
    const { start = 0 } = req.query; // Default start to 0

    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        const { data, count, error } = await supabase
            .from('videos')
            .select('*', { count: 'exact' })
            .is('deleted_at', null) // Exclude deleted videos
            .order('uploaded_at', { ascending: false })
            .range(Number(start), Number(start) + limit - 1);

        if (error) {
            throw error;
        }

        // Log the fetch action
        setImmediate(() => {
            logAction(userId, 'FETCH_VIDEOS', 'User fetched videos with pagination', 'VideoFetchService');
        });

        res.status(200).json({ videos: data, total: count });
    } catch (err) {
        setImmediate(() => {
            logAction(userId, 'FETCH_VIDEOS', `Error: ${err.message}`, 'VideoFetchService');
        });

        res.status(500).json({ message: 'Error fetching videos', error: err.message });
    }
});

// Fetch all videos of a user with pagination
router.get('/user/:user_id', async (req, res) => {
    let userId = null;
    const { start = 0 } = req.query;

    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        const { user_id } = req.params;
        if (user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized to fetch this user\'s videos' });
        }

        const { data, count, error } = await supabase
            .from('videos')
            .select('*', { count: 'exact' })
            .eq('user_id', user_id)
            .is('deleted_at', null) // Exclude deleted videos
            .range(Number(start), Number(start) + limit - 1);

        if (error) {
            throw error;
        }

        // Log the fetch user-specific videos action
        setImmediate(() => {
            logAction(userId, 'FETCH_USER_VIDEOS', `User fetched videos for user_id ${user_id} with pagination`, 'VideoFetchService');
        });

        res.status(200).json({ videos: data, total: count });
    } catch (err) {
        setImmediate(() => {
            logAction(userId, 'FETCH_USER_VIDEOS', `Error: ${err.message}`, 'VideoFetchService');
        });

        res.status(500).json({ message: 'Error fetching videos', error: err.message });
    }
});

// Fetch a specific video (streaming)
router.get('/stream/:filename', async (req, res) => {
    let userId = null;
    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        const { filename } = req.params;
        const { data, error } = await supabase
            .from('videos')
            .select('filepath')
            .eq('filename', filename)
            .is('deleted_at', null)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Log the streaming action
        setImmediate(() => {
            logAction(userId, 'STREAM_VIDEO', `User streamed video ${filename}`, 'VideoStreamService');
        });
        res.status(200).json({ url: data.filepath }); // Redirect to Cloudinary streaming URL
    } catch (err) {
        setImmediate(() => {
            logAction(userId, 'STREAM_VIDEO', `Error: ${err.message}`, 'VideoStreamService');
        });

        res.status(500).json({ message: 'Error streaming video', error: err.message });
    }
});


// Soft delete a video
router.delete('/delete/:filename', async (req, res) => {
    let userId = null;
    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        const { filename } = req.params;

        // Check if the video belongs to the user
        const { data, error } = await supabase
            .from('videos')
            .select('user_id')
            .eq('filename', filename)
            .single();

        if (error || !data || data.user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized or video not found' });
        }

        const cloudinaryResponse = await cloudinary.uploader.destroy(`videos/${filename}`, {
            resource_type: 'video',
        });

        if (cloudinaryResponse.result !== 'ok') {
            throw new Error(`Cloudinary deletion failed for video: ${filename}`);
        }

        // Soft delete the video
        const { updateError } = await supabase
            .from('videos')
            .update({ deleted_at: new Date() })
            .eq('filename', filename);

        if (updateError) {
            throw updateError;
        }

        // Log the delete action
        setImmediate(() => {
            logAction(userId, 'DELETE_VIDEO', `User deleted video ${filename}`, 'VideoDeleteService');
        });

        res.status(200).json({ message: 'Video deleted successfully (soft delete)' });
    } catch (err) {
        setImmediate(() => {
            logAction(userId, 'DELETE_VIDEO', `Error: ${err.message}`, 'VideoDeleteService');
        });

        res.status(500).json({ message: 'Error deleting video', error: err.message });
    }
});

// Soft delete all videos of a user
router.delete('/delete-all', async (req, res) => {
    let userId = null;
    try {
        // Validate the user token
        const user = validateToken(req);
        userId = user.id;

        const { data, error } = await supabase
            .from('videos')
            .select('filename')
            .eq('user_id', userId)
            .is('deleted_at', null);

        if (error || !data) {
            throw new Error('Error fetching user videos');
        }

        const deletePromises = data.map((video) =>
            cloudinary.uploader.destroy(`videos/${video.filename}`, { resource_type: 'video' })
        );
        const results = await Promise.all(deletePromises);

        if (results.some((res) => res.result !== 'ok')) {
            throw new Error('One or more videos failed to delete from Cloudinary');
        }

        const { updateError } = await supabase
            .from('videos')
            .update({ deleted_at: new Date() })
            .eq('user_id', userId);

        if (updateError) {
            throw updateError;
        }

        // Log the delete all action
        setImmediate(() => {
            logAction(userId, 'DELETE_ALL_VIDEOS', 'User deleted all their videos', 'VideoDeleteService');
        });

        res.status(200).json({ message: 'All videos deleted successfully (soft delete)' });
    } catch (err) {
        setImmediate(() => {
            logAction(userId, 'DELETE_ALL_VIDEOS', `Error: ${err.message}`, 'VideoDeleteService');
        });

        res.status(500).json({ message: 'Error deleting all videos', error: err.message });
    }
});

module.exports = router;
