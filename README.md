Volume Booster Pro
Volume Booster Pro is a lightweight Chromium-based browser extension that allows users to boost their browser's audio volume far beyond the default 100% limit—up to 600%! Utilizing the modern HTML5 Web Audio API, it amplifies sound smoothly without causing distortion, making it perfect for quiet videos, podcasts, and movies.

🚀 Features
Up to 600% Amplification: Boost your audio level from 1% up to 600% with a single slider.

Tab-Specific Control: Independently control the volume of individual tabs without affecting global system sound.

Web Audio API Integration: Uses gain nodes to cleanly boost audio without degrading sound quality.

Dark/Modern UI: Comes with a clean, intuitive, and highly responsive user interface.

Lightweight & Fast: Minimal memory footprint that won't lag your browser.

## 🛠️ Installation (Quick & Easy)

1. **Download the Extension:** Click on the `volume-booster-extension.zip` file above in this repository, then click the **Download raw file** button to save it to your computer.
2. **Extract the File:** Unzip the downloaded folder somewhere safe (like your Desktop or Documents).
3. **Open Extensions Page:** Open Google Chrome (or any Chromium browser like Brave, Edge, or Opera) and navigate to `chrome://extensions/`.
4. **Enable Developer Mode:** Toggle the **Developer mode** switch in the top-right corner to ON.
5. **Load the Extension:** Click the **Load unpacked** button in the top-left corner, select the extracted `volume-booster-extension` folder (the one containing `manifest.json`), and you're good to go!
💻 Tech Stack
Frontend: HTML5, CSS3, JavaScript (ES6+)

Core API: Web Audio API (AudioContext, GainNode)

Extension Architecture: Manifest V3

🔒 Privacy & Permissions
This extension requires the following permissions to function correctly:

activeTab / tabs: To target and modify audio streams on the specific page you want to amplify.

scripting: To safely inject the audio controller logic into the active tab.

No personal data, browsing history, or keystrokes are ever collected, tracked, or sent to external servers.

📄 License
This project is licensed under the MIT License - see the LICENSE file for details
