# 🏆 Tournament Leaderboard App

A local tournament leaderboard application for managing live team scores, player status, match rankings, and saved match history. The app is designed for tournament organizers who want a simple way to control and display match data from their own computer.

## 📸 Preview

### Main Leaderboard
![Leaderboard/Admin Panel Preview](https://tarun11.in/assets/panel.png)

### Match Rankings
![Overall Rankings Preview](https://tarun11.in/assets/rankings.png)

---

## 🚀 Local Setup Guide

### 1. Install Node.js

Your computer needs Node.js to run the application.

1. Visit [Node.js](https://nodejs.org/).
2. Download the **LTS (Long Term Support)** version.
3. Run the installer and keep the default settings.
4. Make sure **NPM** is installed along with Node.js.
5. Restart your computer if prompted.

You can check the installation with:

```bash
node --version
npm --version
```

---

### 2. Open the Project

1. Download and extract the project folder.
2. Open a Terminal or Command Prompt inside the project folder.

**Windows**

Open the project folder, click the address bar, type:

```text
cmd
```

Then press **Enter**.

**macOS**

Open Terminal and type:

```bash
cd 
```

Drag the project folder into the Terminal window and press **Enter**.

---

### 3. Install Required Modules

Run the following command inside the project folder:

```bash
npm install
```

Wait for the installation to finish. A `node_modules` folder will be created.

> You normally only need to run `npm install` once.

---

### 4. Start the App

Run:

```bash
npm run dev
```

The app should start at:

```text
http://localhost:3000
```

Keep the Terminal window open while using the app. Closing it will stop the application.

---

## 🌐 App Pages

| Page | Local Address |
|---|---|
| 🏆 Main Leaderboard | `http://localhost:3000/` |
| 📊 Match Rankings | `http://localhost:3000/rankings` |
| 🎛️ Admin Panel | `http://localhost:3000/admin` |

> **Tip:** You can open the Admin Panel on another device connected to the same Wi-Fi network by using your computer's local IP address instead of `localhost`.

---

## 🎮 Managing Matches

### Live Updates

Open the **Admin Panel** to manage the current match.

You can:

- Change team names
- Adjust team points
- Update player status
- Mark players as eliminated
- Manage the current match information

Changes are automatically saved to:

```text
data.json
```

The Main Leaderboard updates as the match data changes.

---

## 💾 Saving Match History

When a match is finished:

1. Open the **Admin Panel**.
2. Check that the **DAY** and **MATCH** numbers are correct.
3. Click **End Match & Save Data**.

The current results will be saved permanently inside:

```text
data/matches/
```

Saved results can also be viewed from the **Match History** section of the Admin Panel.

---

## 🔄 Resetting for the Next Match

After saving the completed match, click:

**Reset Scores**

This clears the current live scoreboard so it is ready for the next match.

> Resetting the live scores does **not** delete your previously saved match history.

---

## 📁 Important Data Files

```text
project/
├── data.json
└── data/
    └── matches/
```

- `data.json` — stores the current live leaderboard.
- `data/matches/` — stores completed match results.

---

## 🛠️ Troubleshooting

### `Command not found: npm`

Node.js may not be installed correctly.

Try:

1. Reinstalling Node.js from [nodejs.org](https://nodejs.org/).
2. Making sure NPM is included during installation.
3. Restarting the Terminal.
4. Restarting your computer if necessary.

### `Port 3000 is already in use`

Another copy of the application may already be running.

Go to the old Terminal window and press:

```text
Ctrl + C
```

Then start the application again:

```bash
npm run dev
```

---

## ⚡ Quick Start

After the first-time setup, you normally only need:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/
```

---


## 📌 Notes

- Keep the Terminal running while using the application.
- Save a completed match before resetting scores.
- Keep a backup of the `data` folder if the match history is important.
- Use the Admin Panel to manage the tournament while the leaderboard is being displayed.

---

Built for tournament organizers who need a clean and convenient way to manage live leaderboard data.

- Built with ❤ by [Tarun](https://instagram.com/t4run_11) 
