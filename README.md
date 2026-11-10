# Silent Screen Syndrome

Silent Screen Syndrome is a Final Year Project that helps guardians monitor and
support a child's communication, learning, mood, and progress.

The project has two separate applications:

- **Frontend:** React Native with JavaScript for Android and iOS.
- **Backend:** Node.js, Express, and MongoDB Atlas for the REST API and data
  storage.

The main testing target is an Android emulator or a physical Android phone
connected through Android Studio.

## Project Requirements

Install these tools before starting:

1. **Node.js LTS** and npm
2. **Android Studio**
3. **Android SDK and Android Emulator**
4. **JDK 17**
5. **MongoDB Atlas account**
6. **Git** (for team collaboration)

For Android Studio, make sure an Android SDK platform, SDK Platform-Tools,
Android SDK Build-Tools, and at least one emulator system image are installed.

## Project Structure

```text
silent-screen-syndrome/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # MongoDB/Mongoose schemas
│   │   ├── routes/          # REST API routes
│   │   └── server.js        # Backend entry point
│   ├── .env.example         # Environment variable template
│   └── package.json         # Backend dependencies and scripts
│
├── frontend/
│   ├── android/             # Android Studio project
│   ├── ios/                 # iOS native project
│   ├── src/
│   │   ├── api/             # Axios client and API functions
│   │   ├── assets/          # Images, audio, and animations
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Shared application state
│   │   ├── modules/         # Feature modules
│   │   ├── navigation/      # Screen navigation
│   │   └── utils/            # Helpers and offline queue
│   ├── App.js               # Main React Native component
│   └── package.json         # Frontend dependencies and scripts
│
├── .gitignore
└── README.md
```

### Frontend Modules

The `frontend/src/modules` folder follows the project requirements:

- `m01_onboarding` - Guardian account, child profile, and language selection
- `m02_avatar` - Doctor avatar and text-to-speech integration
- `m03_games` - Object naming, color matching, and sound imitation games
- `m04_speech_ai` - Keyword spotting and speech clarity scoring
- `m05_vision_ai` - Face emotion and stress analysis
- `m06_difficulty` - Dynamic difficulty and level scaling
- `m07_intervention` - Calming breaks, breathing, and parent alerts
- `m08_sync` - Offline storage and background synchronization
- `m09_dashboard` - Parent analytics and progress charts
- `m10_reports` - PDF report generation and sharing

## First-Time Setup

Run these commands from the project root in PowerShell:

```powershell
npm install --prefix backend
npm install --prefix frontend
Copy-Item backend\.env.example backend\.env
```

Open `backend\.env` and set real values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/silent-screen-syndrome
JWT_SECRET=use-a-long-random-secret
CLIENT_ORIGIN=*
```

In MongoDB Atlas, add your development IP address under **Network Access** and
create a database user under **Database Access**. Never commit the `.env` file
or share its password and secret.

## Running the Application

### 1. Start the backend

Open a terminal in the project root:

```powershell
npm run dev --prefix backend
```

The API runs on:

```text
http://localhost:5000
```

You can test the server health endpoint in a browser:

```text
http://localhost:5000/api/health
```

### 2. Start the frontend Metro server

Open a second terminal:

```powershell
npm start --prefix frontend
```

### 3. Run on an Android emulator

1. Open Android Studio.
2. Open **Device Manager**.
3. Start an Android Virtual Device.
4. Keep the backend terminal running.
5. Run:

```powershell
npm run android --prefix frontend
```

The frontend uses `http://10.0.2.2:5000/api` for the Android emulator. The
address `10.0.2.2` points to the host computer from inside the emulator.

### 4. Run on a physical Android phone

1. Enable **Developer Options** and **USB debugging** on the phone.
2. Connect the phone with a USB cable and accept the debugging prompt.
3. Confirm that Android Studio detects the phone.
4. Find the computer's local IPv4 address with `ipconfig`.
5. Open `frontend/src/api/client.js`.
6. Replace `10.0.2.2` with the computer's IPv4 address, for example:

```js
export const API_URL = 'http://192.168.1.10:5000/api';
```

7. Keep the phone and computer on the same network.
8. Start the backend, start Metro, and run:

```powershell
npm run android --prefix frontend
```

If Windows Firewall blocks the connection, allow Node.js on the private
network.

## API Overview

The backend currently provides:

- `GET /api/health` - Check whether the API is running
- `POST /api/auth/register` - Create a guardian account
- `POST /api/auth/login` - Log in a guardian
- `GET /api/profiles` - Get the logged-in guardian's child profiles
- `POST /api/profiles` - Create a child profile
- `POST /api/sync` - Upload offline session records
- `GET /api/reports` - Get learning session records

Protected endpoints require this header:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Team Development Rules

- Keep backend code inside `backend/src`.
- Keep mobile code inside `frontend/src`.
- Add new screens to the correct module folder.
- Put reusable UI in `frontend/src/components`.
- Put API calls in `frontend/src/api`; do not call Axios directly from every
  screen.
- Do not commit `.env`, `node_modules`, build folders, or personal credentials.
- Before sharing changes, run the app on an emulator or phone and describe what
  you tested.
- Use clear commit messages and create separate branches for major features.

## Common Commands

```powershell
# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Start backend in development mode
npm run dev --prefix backend

# Start Metro
npm start --prefix frontend

# Build and run Android
npm run android --prefix frontend

# Run frontend lint
npm run lint --prefix frontend

# Run frontend tests
npm test --prefix frontend
```

## Troubleshooting

- **MongoDB connection error:** Check `backend\.env`, Atlas Network Access,
  database credentials, and the connection string.
- **Emulator cannot reach the API:** Use `10.0.2.2`, not `localhost`.
- **Phone cannot reach the API:** Use the computer's local IPv4 address and
  keep both devices on the same Wi-Fi network.
- **Android build error:** Check that Android Studio, SDK tools, JDK 17, and
  environment variables are configured correctly.
- **Metro cache issue:** Stop Metro and run
  `npx react-native start --reset-cache` from `frontend`.
