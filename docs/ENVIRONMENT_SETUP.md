# Environment Configuration Guide

This guide explains how to set up and switch between development and production environments for the Artisan Bakery Telegram Mini App.

## 🚀 Quick Start

### 1. Development Setup

1. **Copy environment template:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Fill in your development values:**
   \`\`\`env
   DATABASE_URL=your_development_database_url
   TELEGRAM_BOT_TOKEN=your_development_bot_token
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the app:**
   - Local: http://localhost:3000
   - The app will automatically use mock data and authentication

### 2. Production Deployment

1. **Set environment variables in your deployment platform:**
   \`\`\`env
   DATABASE_URL=your_production_database_url
   TELEGRAM_BOT_TOKEN=your_production_bot_token
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NODE_ENV=production
   \`\`\`

2. **Deploy your application**

3. **Configure your Telegram bot to use the production URL**

## 🔧 Configuration System

### Environment Detection

The app automatically detects the environment based on `NODE_ENV`:

- **Development** (`NODE_ENV=development`):
  - Uses mock data and authentication
  - Enables debug logging
  - Disables payments and analytics
  - Shows debug information in UI

- **Production** (`NODE_ENV=production`):
  - Uses real Telegram authentication
  - Enables all features
  - Optimized for performance
  - Hides debug information

### Configuration Files

- **`.env.local`** - Development environment (not committed to git)
- **`.env.production`** - Production environment template
- **`.env.example`** - Template with all available variables

### Available Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app's public URL |
| `TELEGRAM_WEBHOOK_SECRET` | No | Optional webhook security |
| `NEXT_PUBLIC_ENABLE_MOCK_DATA` | No | Force mock data in production |
| `NEXT_PUBLIC_ENABLE_DEBUG` | No | Enable debug logging |

## 🧪 Testing Modes

### 1. Full Mock Mode (Development)
\`\`\`env
NODE_ENV=development
NEXT_PUBLIC_ENABLE_MOCK_DATA=true
\`\`\`
- Uses mock user, products, and orders
- No real API calls
- Perfect for UI development

### 2. Hybrid Mode (Development with Real Data)
\`\`\`env
NODE_ENV=development
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
DATABASE_URL=your_real_database_url
\`\`\`
- Uses real database
- Mock Telegram authentication
- Good for testing with real data

### 3. Production Mode
\`\`\`env
NODE_ENV=production
\`\`\`
- Full Telegram integration
- Real database and authentication
- All features enabled

## 🔒 Security Best Practices

### Environment Variables Security

1. **Never commit sensitive data:**
   - `.env.local` is in `.gitignore`
   - Use `.env.example` for templates

2. **Use different tokens for different environments:**
   - Development bot token for testing
   - Production bot token for live app

3. **Validate configuration:**
   \`\`\`typescript
   import { validateConfig } from '@/lib/config'
   
   const { isValid, errors } = validateConfig()
   if (!isValid) {
     console.error('Configuration errors:', errors)
   }
   \`\`\`

## 🛠️ Development Workflow

### Local Development
1. Use mock mode for rapid UI development
2. Test with real database when needed
3. Use development bot token for Telegram testing

### Staging/Testing
1. Deploy to staging environment
2. Use production-like configuration
3. Test full Telegram integration

### Production Deployment
1. Set production environment variables
2. Deploy application
3. Update Telegram bot configuration

## 🐛 Debugging

### Enable Debug Mode
\`\`\`env
NEXT_PUBLIC_ENABLE_DEBUG=true
\`\`\`

This will show:
- Configuration details in console
- API call logs
- Authentication flow
- Environment detection

### Common Issues

1. **"Please open this app through Telegram"**
   - Check if `NODE_ENV=development` for local testing
   - Verify Telegram bot token in production

2. **Database connection errors**
   - Verify `DATABASE_URL` format
   - Check database accessibility

3. **Authentication failures**
   - Ensure bot token is correct
   - Check Telegram Web App configuration

## 📱 Telegram Bot Setup

### Development Bot
1. Create a new bot with @BotFather
2. Set the Web App URL to `http://localhost:3000`
3. Use this bot token for development

### Production Bot
1. Use your main bot or create a new one
2. Set the Web App URL to your production domain
3. Configure menu button or inline keyboard

## 🔄 Switching Environments

### From Development to Production
1. Update environment variables in deployment platform
2. Change `NODE_ENV` to `production`
3. Deploy application
4. Update Telegram bot Web App URL

### From Production to Development
1. Set `NODE_ENV=development` in `.env.local`
2. Start local development server
3. Use development bot for testing

## 📊 Monitoring

### Configuration Validation
The app automatically validates configuration on startup and logs any issues.

### Environment Status
Check the browser console for environment status and configuration details when debug mode is enabled.
