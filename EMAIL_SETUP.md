# Email Notifications Setup - AISLA

## Overview
AISLA sends automated email notifications to students when faculty/admin create new experiments. This guide explains how to set up SendGrid for email functionality.

## Prerequisites
- A SendGrid account (free tier available)
- AISLA server running locally or in production

## Steps to Enable Email Notifications

### 1. Create a SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log in to SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name like "AISLA"
5. Select **Full Access** permissions
6. Copy the generated API key (you'll see it only once!)

### 3. Configure Your Server
1. Open `server/.env` (create it if it doesn't exist)
2. Add these lines:
```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@aisla.com
CLIENT_URL=http://localhost:3000
```

3. Replace:
   - `SG.your_api_key_here` with your actual SendGrid API key
   - `noreply@aisla.com` with your verified sender email (in SendGrid)
   - `http://localhost:3000` with your actual client URL

### 4. Verify Sender Email (Optional but Recommended)
1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Use the same email you configured in `SENDGRID_FROM_EMAIL`
4. Complete the verification process

## Testing Email Notifications

1. Start your server:
```bash
cd server
npm run dev
```

2. Faculty creates a new experiment via the UI
3. Check the server console for email logs:
   - ✅ `Email sent successfully to X recipients` = Success
   - ❌ `SENDGRID_API_KEY is not configured` = Missing configuration
   - ❌ `SendGrid Error` = Invalid API key or sender email

## Troubleshooting

### "SENDGRID_API_KEY is not configured"
**Solution:** Add your API key to `server/.env` and restart the server

### "Email bounced" or "Invalid sender"
**Solution:** Verify the `SENDGRID_FROM_EMAIL` in SendGrid dashboard and update `.env`

### No email in student inbox
**Solution:** 
- Check spam/junk folder
- Verify student email addresses are correct in database
- Check SendGrid dashboard → Email Activity for delivery status

## Free Tier Limits
- SendGrid free tier allows **100 emails/day**
- Perfect for development and testing
- Upgrade for production if needed

## Production Deployment
When deploying to production:
1. Add `SENDGRID_API_KEY` to your hosting platform's environment variables
2. Update `CLIENT_URL` to your production domain
3. Use a branded sender email (domain authentication)
