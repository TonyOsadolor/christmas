require('dotenv').config();
const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Auth using your downloaded credentials JSON file
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

// API Route: Get the list of 25 tracks from the Google Drive folder
app.get('/api/playlist', async (req, res) => {
    try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        const queryParams = {
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            orderBy: 'name',
        };

        const response = await drive.files.list(queryParams);

        const tracks = response.data.files.map((file, index) => ({
            id: file.id,
            title: file.name,
            url: `/stream/${file.id}`
        }));

        res.json(tracks);
    } catch (error) {
        console.error('Detailed Google Drive Error:', error);
        res.status(500).json({ error: 'Failed to load playlist', details: error.message });
    }
});

// Streaming Route: Fetch .wma from Google Drive, transcode to MP3, and pipe to browser
app.get('/stream/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Set response headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Get a readable stream of the file directly from Google Drive
        const driveStream = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        // Pass the raw Google Drive .wma stream into FFmpeg for on-the-fly MP3 conversion
        ffmpeg(driveStream.data)
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (err) => {
                // Ignore client disconnect errors to prevent server crash
                if (!err.message.includes('stdout: pipe:5')) {
                    console.error('FFmpeg transcoding error:', err);
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        // console.error('Streaming error:', error);
        res.status(500).json({ error: 'Failed to stream audio file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});