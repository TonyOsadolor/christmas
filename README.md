<p align="center">
  <a href="https://github.com/TonyOsadolor/christmas.git" target="_blank">
    <img src="https://avatars.githubusercontent.com/u/81017184?s=400&u=3369f509c78e7c627c8d2d349060ce7a08430276&v=4" width="200" height="auto" alt="Project Logo">
  </a>
</p>

<h1 align="center">Merry Christmas — Cloud Music Streamer for Christmas Songs</h1>

<p align="center">
  A modern, lightweight web-based audio streaming application that converts and plays media directly from Google Drive.
</p>

---

## About The Project

### Overview
**Merry Christmas — Cloud Music Streamer** is a web-based audio streaming platform built with Node.js, Express, and modern JavaScript. It connects directly with Google Drive API storage to stream holiday music and audio tracks without requiring heavy front-end libraries or complex server infrastructures.

### Problem Statement & Solution
Cloud storage providers like Google Drive often host audio files in legacy or non-web-native formats (such as `.wma`). Standard web browsers cannot play `.wma` files natively. 

This application solves the format restriction problem by integrating an on-the-fly **FFmpeg audio transcoding pipeline**. When a user requests a legacy audio format, the server fetches the stream from Google Drive, transcodes the audio directly into standard MP3 format in memory, and pipes the playable stream to the user's browser in real-time.

### Key Objectives
* **On-the-Fly Audio Transcoding:** Convert non-native browser formats (`.wma`) to web-friendly audio (`.mp3`) on the fly using FFmpeg.
* **Direct Cloud Storage Integration:** Stream tracks directly from Google Drive folders without consuming local host storage.
* **Custom HTML5 Audio Player UI:** Provide an interactive playback control system featuring album art rotation, responsive audio equalizer animations, precise progress bar seeking, volume sliders, and mute toggles.
* **Persistent Preferences:** Save user choices (such as Dark/Light theme modes) via HTML5 `localStorage`.

---

## Key Features

* **Custom Audio Interface:** Built-in seeking progress bar, track duration counters, volume slider, and one-click mute controls.
* **Interactive Visuals:** Animated vinyl artwork and audio equalizer bars that react to play/pause state changes.
* **Playback Controls:** Full support for `Next`, `Previous`, `Repeat` (`Off`, `All`, `One`), and `Shuffle` mode toggles.
* **Theme Customization:** Toggle between Dark Mode and Light Mode with seamless style persistence.
* **Rich UI Alerts:** Modern modal popups powered by SweetAlert2.
* **Right-Click Protection:** Context menu disabling for cleaner kiosk-like user experiences.

---

## Tech Stack

### Core System
* **Runtime Environment:** [Node.js](https://nodejs.org/) (v18.0.0+ recommended)
* **Web Framework:** [Express.js](https://expressjs.com/)
* **Language:** JavaScript (ES6+)

### Cloud & Media Processing
* **Cloud API:** Google Drive API (`googleapis` v3)
* **Media Transcoder:** [FFmpeg](https://ffmpeg.org/) via `fluent-ffmpeg`

### Frontend UI
* **Markup & Styling:** HTML5 / CSS3 (CSS Custom Properties for theme switching)
* **Scripting:** Vanilla JavaScript (ES6 Async/Await & HTML5 Audio API)
* **Modal Notifications:** [SweetAlert2](https://sweetalert2.github.io/)

---

## System Architecture & Flow

```
[ Google Drive Storage ] 
        │
        ▼ (Raw Stream / .wma / .mp3)
[ Express Node.js Server ]
        │
        ├── (If .wma) ──► [ FFmpeg Transcoder ] ──► [ Pass MP3 Stream ]
        └── (If .mp3) ───────────────────────────► [ Pass Direct Stream ]
                                                           │
                                                           ▼
                                               [ Custom HTML5 Player UI ]
```

---

## Setup Guide

Follow these instructions to set up and run the project on your local development machine.

### Prerequisites & Workspace Setup

Before running this application locally, ensure you have the following installed:

1. **Node.js**: (Version `18.0.0` or higher recommended). Check using `node -v`.
2. **NPM**: (Version `9.0.0` or higher). Check using `npm -v`.
3. **FFmpeg Engine**: Must be installed on your operating system and added to your system's PATH variable.
   * **Windows:** Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) and add the `bin` folder to System PATH.
   * **macOS:** Install via Homebrew: `brew install ffmpeg`
   * **Linux (Ubuntu/Debian):** Install via APT: `sudo apt update && sudo apt install ffmpeg`
4. **Google Cloud Console Credentials**: A service account or OAuth credentials file (`credentials.json`) with access to the Google Drive folder holding your audio files.

---

## Installation & Configuration Guide

### Step 1: Clone the Repository
Open your terminal and clone the repository:
```bash
git clone https://github.com/TonyOsadolor/christmas.git
cd christmas
```

### Step 2: Install Dependencies
Install all required Node.js package dependencies:
```bash
npm install
```

### Step 3: Google Drive Credentials Setup
1. Obtain your Google Cloud Service Account key file from the Google Cloud Console.
2. Save the file as `credentials.json` inside the root directory of your project:
```
christmas/
├── credentials.json
├── package.json
├── server.js
└── public/
```

### Step 4: Environment Configuration (`.env`)
Create a `.env` file in the root directory by copying the example environment file:
```bash
cp .env.example .env
```

Update your `.env` file with your specific configuration values:
```env
PORT=3000
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

---

## Running the Application

### Local Development Mode
To start the local development server:
```bash
npm start
```
Or if you have `nodemon` installed for auto-reloading:
```bash
npm run dev
```

### Testing the Player
1. Open your web browser and navigate to: `http://localhost:3000`
2. The application will fetch the list of available audio files from your configured Google Drive folder.
3. Click the **Play** button to begin streaming and transcoding audio!

---

## Contribution Guide

We welcome contributions to improve the streamer! Please follow these guidelines when submitting fixes or new features:

### Branching Strategy
* Always create a new branch for your work.
* For new features, use: `feature/feature_name`
* For bug fixes, use: `fix/fix_name`

### Step-by-Step Pull Request (PR) Process

1. **Fetch Latest Main Branch:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create Your Feature Branch:**
   ```bash
   git checkout -b feature/custom-equalizer-preset
   ```

3. **Stage and Commit Your Changes:**
   ```bash
   git add .
   git commit -m "feat: added new custom equalizer presets"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin feature/custom-equalizer-preset
   ```

5. **Open a Pull Request:**
   * Head over to the [GitHub Repository](https://github.com/TonyOsadolor/christmas.git).
   * Click **Compare & Pull Request**.
   * Fill out the PR template describing the changes made, then submit for review.

---

Automatic Vercel Deployment is added too.

## GitHub Cheatsheet Link

Need help with Git commands during development? Check out the official GitHub Git Cheatsheet:
* 📄 [Download Git Cheatsheet (PDF)](https://education.github.com/git-cheat-sheet-education.pdf)

---

## License

This project is open-sourced under the [MIT License](https://opensource.org/licenses/MIT).