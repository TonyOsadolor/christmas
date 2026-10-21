require('dotenv').config();
const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');

// Tell fluent-ffmpeg where the binary is located
ffmpeg.setFfmpegPath(ffmpegInstaller);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Initialize Google Auth using JSON string from environment variable (for Vercel)
// For local development, it can fall back to parsing your credentials string
let authConfig = {
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
};

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    authConfig.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
} else {
    // Local fallback to file if running locally
    authConfig.keyFile = path.join(__dirname, 'credentials.json');
}

const auth = new google.auth.GoogleAuth(authConfig);
const drive = google.drive({ version: 'v3', auth });

// Playlist Route
app.get('/api/playlist', async (req, res) => {
    try {
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            orderBy: 'name',
        });

        const tracks = response.data.files.map((file) => ({
            id: file.id,
            title: file.name,
            url: `/stream/${file.id}` 
        }));

        res.json(tracks);
    } catch (error) {
        console.error('Google Drive Error:', error);
        res.status(500).json({ error: 'Failed to load playlist', details: error.message });
    }
});

// Streaming Route
app.get('/stream/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Transfer-Encoding', 'chunked');

        const driveStream = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        ffmpeg(driveStream.data)
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (err) => {
                if (!err.message.includes('stdout: pipe:5')) {
                    console.error('FFmpeg error:', err);
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Failed to stream audio file' });
    }
});

// Export app for Vercel serverless handler (do not call app.listen on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;