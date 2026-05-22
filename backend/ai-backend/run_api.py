"""
Run this script to start the Blue Carbon AI API server.
Usage: python run_api.py
       OR: uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
"""
import os
import sys
from pathlib import Path

# Ensure we run from the ai-backend directory so relative paths resolve correctly
os.chdir(Path(__file__).parent)

import uvicorn

if __name__ == "__main__":
    print("Starting Blue Carbon AI API on http://localhost:8000")
    print("API Docs available at http://localhost:8000/docs")
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
