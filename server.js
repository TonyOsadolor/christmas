require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize Google Drive API with Service Account credentials
const authConfig = {
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
};

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
        authConfig.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
        console.error("Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:", e.message);
    }
} else {
    // Local fallback to file if running locally
    authConfig.keyFile = path.join(__dirname, 'credentials.json');
}

const auth = new google.auth.GoogleAuth(authConfig);

const drive = google.drive({ version: 'v3', auth });
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Playlist Route
app.get('/api/playlist', async (req, res) => {
    try {
        if (!folderId) {
            return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID is not configured.' });
        }

        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType)',
            orderBy: 'name',
        });

        // --- Create a mutable copy using [...] so .sort() actually works ---
        const files = [...(response.data.files || [])];
        
        // Sort naturally by name (01, 02, 03...)
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        const playlist = files.map(file => ({
            id: file.id,
            title: file.name.replace(/\.[^/.]+$/, ""),
            url: `/api/stream/${file.id}`
        }));

        res.json(playlist);
    } catch (error) {
        console.error('FULL DRIVE ERROR:', error);
        res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
    }
});

// --- API: Stream MP3 File Directly with Byte-Range Support ---
app.get('/api/stream/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;

        const metaResponse = await drive.files.get({
            fileId: fileId,
            fields: 'size, mimeType, name'
        });

        const fileSize = parseInt(metaResponse.data.size, 10);
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            });

            const fileStream = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream', headers: { Range: `bytes=${start}-${end}` } }
            );

            fileStream.data.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Type': 'audio/mpeg',
            });

            const fileStream = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            fileStream.data.pipe(res);
        }
    } catch (error) {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
            res.status(500).send('Error streaming audio file');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});