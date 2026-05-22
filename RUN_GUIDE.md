# 🚀 Blue Carbon Project — Execution Guide

This guide describes how to run both the **AI Backend** and the **React Frontend** inside VS Code.

---

## 🛠️ Step-by-Step Execution (Recommended)

To run both services, open **VS Code** in the project directory (`Blue_Carbon_Sem_4_EDI-main`) and use two terminal panels side-by-side:

### 1. Start the AI Backend 🤖
1. Open a new terminal in VS Code (**Ctrl + Shift + `**).
2. Move into the backend directory:
   ```powershell
   cd backend/ai-backend
   ```
3. *(First time only)* Install python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the API server:
   ```powershell
   python run_api.py
   ```
   *You will see:* `Uvicorn running on http://0.0.0.0:8000`

---

### 2. Start the React Frontend 💻
1. Split the terminal panel in VS Code (click the **Split Terminal** button at the top-right of the terminal panel, or press **Ctrl + \**).
2. Move into the frontend directory:
   ```powershell
   cd frontend
   ```
3. *(First time only)* Install frontend packages:
   ```powershell
   npm install
   ```
4. Start the frontend developer server:
   ```powershell
   npm run dev
   ```
   *You will see:* `➜  Local: http://localhost:5173/`
5. Open your browser and navigate to: **`http://localhost:5173/`**

---

## ⚡ One-Line Shortcuts to Run Both Together

If you want to launch both at the exact same time without typing multiple commands, use one of these one-liners in your VS Code terminal (depending on your shell):

### For Windows PowerShell (VS Code default on Windows)
```powershell
Start-Process powershell "-NoExit -Command 'cd backend/ai-backend; python run_api.py'"; cd frontend; npm run dev
```

### For Git Bash / Linux / macOS
```bash
(cd backend/ai-backend && python run_api.py) & (cd frontend && npm run dev)
```

---

## 🔑 Adding Blockchain Wallet (Optional)
If you want to mint *real* carbon credits on the Sepolia Testnet instead of simulated ones:
1. Create a `.env` file inside `backend/ai-backend/`
2. Add your wallet private key:
   ```env
   PRIVATE_KEY=your_sepolia_wallet_private_key_here
   ```
