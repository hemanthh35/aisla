📚 COMPLETE GUIDE: GET GEMINI API KEY
=====================================

STEP 1: Go to Google AI Studio (FASTEST WAY - No billing required for free tier)
==================================================================================

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select "Create API key in new Google Cloud project"
4. Copy the API key that appears
5. Update your .env file with this key

⚠️  NOTE: Google AI Studio method has rate limits but is instant!


STEP 2: Alternative - Google Cloud Console (For Production/Higher Limits)
=========================================================================

1. Go to: https://console.cloud.google.com

2. Create a New Project:
   - Click on the project selector (top left)
   - Click "NEW PROJECT"
   - Enter project name: "AISLA"
   - Click "CREATE"
   - Wait for project to be created

3. Enable Gemini API:
   - In search bar, type "Generative Language API"
   - Click on it
   - Click "ENABLE"

4. Create API Key:
   - Left sidebar → "Credentials"
   - Click "+ CREATE CREDENTIALS"
   - Select "API Key"
   - Copy the API key

5. (IMPORTANT) Enable Billing:
   - Left sidebar → "Billing"
   - Click "LINK BILLING ACCOUNT"
   - Create or select billing account
   - Add payment method (credit/debit card)
   - This is required for production use

6. Restrict API Key (Optional but recommended):
   - Click the API key you created
   - Under "Application restrictions" → Select "API and referrers"
   - Under "API restrictions" → Select "Generative Language API"
   - Click "SAVE"


STEP 3: Update Your .env File
=============================

1. Open: D:\AIML PROJECTS\hackthon-gitam\server\.env

2. Replace:
   GEMINI_API_KEY=AIzaSyDHBetxgsy...
   
   With:
   GEMINI_API_KEY=<your-new-key-here>

3. Save the file


STEP 4: Test It Works
====================

Run in PowerShell:
cd "d:\AIML PROJECTS\hackthon-gitam\server"
node testGemini.js

You should see:
✅ SUCCESS with gemini-2.0-flash!
Response: Hello!


QUICK SUMMARY:
==============
FASTEST WAY → Google AI Studio (https://aistudio.google.com/app/apikey)
- Copy API key immediately
- Free tier with rate limits
- No billing needed

PRODUCTION WAY → Google Cloud Console
- Better control & higher limits
- Requires billing enabled
- More setup but more reliable


TROUBLESHOOTING:
================

If you still get errors after adding new key:
1. Wait 1-2 minutes (keys take time to activate)
2. Make sure you have internet connection
3. Try restarting your server
4. Check that .env file is saved correctly (no extra spaces)

If billing error:
1. Make sure billing account is linked
2. Check payment method is valid
3. Wait a few minutes for activation

For more help:
https://ai.google.dev/docs/gemini_setup

═════════════════════════════════════════════════════════════
Generated: December 11, 2025
Purpose: Get Gemini API Key for AISLA Project
═════════════════════════════════════════════════════════════
