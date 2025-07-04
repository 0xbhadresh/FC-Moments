# Pinata Setup Guide

This guide will help you set up Pinata for IPFS uploads in your Reels FC app.

## 1. Create a Pinata Account

1. Go to [Pinata](https://app.pinata.cloud/) and create an account
2. Verify your email address

## 2. Create an API Key

1. Visit the [Keys Page](https://app.pinata.cloud/developers/keys)
2. Click "New Key" in the top right
3. Select "Admin" privileges (recommended for getting started)
4. Give your key a name (e.g., "Reels FC Upload")
5. Click "Create Key"
6. **IMPORTANT**: Copy your JWT token immediately - it's only shown once!

## 3. Get Your Gateway URL

1. Visit the [Gateways Page](https://app.pinata.cloud/gateway)
2. Copy your gateway domain (e.g., `aquamarine-casual-tarantula-177.mypinata.cloud`)

## 4. Configure Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Pinata Configuration
PINATA_JWT=your_jwt_token_here
NEXT_PUBLIC_GATEWAY_URL=your_gateway_domain.mypinata.cloud
```

Replace:

- `your_jwt_token_here` with the JWT you copied from step 2
- `your_gateway_domain.mypinata.cloud` with your gateway domain from step 3

## 5. Test the Setup

1. Restart your development server
2. Try uploading a video through the upload page
3. Check the browser console for upload logs
4. Verify the file appears in your Pinata dashboard

## Troubleshooting

### "Failed to get signed upload URL" Error

- Check that your `PINATA_JWT` is correct
- Ensure your JWT hasn't expired
- Verify the API key has the correct permissions

### "Network error during upload" Error

- Check your internet connection
- Verify the gateway URL is correct
- Try refreshing the page and trying again

### File Size Issues

- Pinata has generous file size limits
- If you encounter issues, check the file size in your Pinata dashboard
- Consider compressing videos if they're very large

## Security Notes

- Never commit your `.env.local` file to version control
- The JWT token provides full access to your Pinata account
- Consider using scoped API keys for production
- The signed URL approach keeps your JWT secure on the server side
