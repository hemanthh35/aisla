# Chat Widget Debugging Guide

## Issues Fixed

### 1. Proxy Configuration
**Problem**: Proxy was set to `0.0.0.0:5000` which doesn't work for client connections
**Fix**: Changed to `http://localhost:5000` in `client/src/setupProxy.js`

## Steps to Fix Chat

### 1. Restart React Development Server
The proxy change requires a restart:
```bash
cd client
npm start
```

### 2. Test the Chat Backend
Backend is working correctly (confirmed). Test:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/chat/status" -Method GET
```

### 3. Check Browser Console
Open your browser's developer console (F12) and look for:
- Network errors (401, 404, 500)
- CORS errors
- Connection refused errors
- SSE stream errors

### 4. Common Issues & Solutions

#### Issue: Chat button appears but clicking does nothing
- **Solution**: Check browser console for JavaScript errors
- Make sure AIChatWidget.css is loading

#### Issue: "Network error" or "Failed to fetch"
- **Solution**: Ensure backend is running on port 5000
- Check if React proxy is working (should show in terminal)

#### Issue: Chat opens but doesn't send messages
- **Solution**: Check if Ollama or Gemini is configured
- Run: `/api/chat/status` to verify AI provider

#### Issue: Messages send but no response
- **Solution**: Check if SSE streaming is working
- Look for "text/event-stream" in Network tab

### 5. Verify Setup

Run these commands to verify everything:

```powershell
# Check if servers are running
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Check if port 5000 is listening
netstat -an | Select-String "5000"

# Test chat endpoint
$body = @{ message = "hello" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/chat/stream" -Method POST -Body $body -ContentType "application/json"
```

## What Was Fixed

1. ✅ **Proxy configuration** - Changed from `0.0.0.0:5000` to `localhost:5000`
2. ✅ **Backend verified** - Chat endpoints are working correctly
3. ✅ **Code review** - AIChatWidget component is correctly implemented

## Next Steps

**YOU MUST RESTART THE REACT SERVER** for the proxy change to take effect:

1. Stop the React dev server (Ctrl+C in the terminal running it)
2. Start it again: `cd client && npm start`
3. Open http://localhost:3000 in your browser
4. Look for the chat button in the bottom-right corner
5. Click it and try sending a message

## Testing the Chat

Once restarted, test with these messages:
- "Hello" - Should get a greeting
- "What is AISLA?" - Should explain the platform
- "Help me with experiments" - Should provide guidance

If still not working, check the browser console (F12) and share any error messages.
