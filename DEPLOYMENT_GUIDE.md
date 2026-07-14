# 🚀 Deployment Guide - Pong Mobile

Complete guide for deploying Pong Mobile to production across iOS, Android, and Web platforms.

## Table of Contents

1. [Backend Deployment](#backend-deployment)
2. [iOS App Store](#ios-app-store)
3. [Google Play Store](#google-play-store)
4. [Web Hosting](#web-hosting)
5. [Domain & SSL](#domain--ssl)
6. [Monitoring](#monitoring)

---

## Backend Deployment

### Heroku (Easiest)

#### Prerequisites
- Heroku account
- Heroku CLI installed
- Git repository

#### Steps

```bash
# Login to Heroku
heroku login

# Create app
heroku create pong-game-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-key-here
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pong
heroku config:set CORS_ORIGIN=https://pong.example.com

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**MongoDB Atlas Setup:**

1. Create cluster at mongodb.com/atlas
2. Create database user
3. Get connection string
4. Add connection string to Heroku config

### AWS EC2

#### Launch Instance

```bash
# 1. Launch Ubuntu 20.04 LTS instance
# 2. Configure security group (ports 22, 80, 443, 8080)
# 3. Create key pair

# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/yourusername/Enhanced-Pong-Game.git
cd Enhanced-Pong-Game/server

# Install dependencies
npm install --production

# Create .env file
sudo nano .env

# Start with PM2
pm2 start server.js --name "pong-server"
pm2 save

# Setup PM2 auto-restart
pm2 startup
```

#### Setup Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/default
```

Replace contents:

```nginx
upstream pong_app {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name pong.example.com;

    location / {
        proxy_pass http://pong_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass ws://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Test config
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

#### SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d pong.example.com

# Auto-renew
sudo certbot renew --dry-run
```

### Docker Deployment

#### Build Docker Image

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001 8080

CMD ["node", "server.js"]
```

```bash
# Build
docker build -t pong-server:latest .

# Run
docker run -d \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://mongodb:27017/pong \
  -p 3001:3001 \
  -p 8080:8080 \
  pong-server:latest
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3'

services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  server:
    build: .
    ports:
      - "3001:3001"
      - "8080:8080"
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/pong?authSource=admin
      JWT_SECRET: your-secret-key
    volumes:
      - ./logs:/app/logs

volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

---

## iOS App Store

### Prerequisites

- Apple Developer Account ($99/year)
- Mac with Xcode 13+
- iOS 14.0+ support

### Build Configuration

#### 1. Update App Identifiers

```bash
cd ios/App
# Open App.xcodeproj in Xcode
```

In Xcode:
- Select Project > App
- General tab > Bundle Identifier: `com.yourcompany.pong`
- Select Team
- Update Version: 1.0.0
- Update Build: 1

#### 2. Create App Store Listing

In App Store Connect:
1. Create new app
2. Set name, subtitle, bundle ID
3. Set pricing tier
4. Set availability
5. Upload screenshots & app preview
6. Write description & keywords
7. Set age rating

#### 3. Build & Archive

```bash
# Build for release
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build

# Create archive
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath build/App.xcarchive \
  archive
```

#### 4. Upload to App Store

```bash
# Using Xcode
# Product > Archive
# Organizer > Distribute App
# App Store Connect > Upload

# Or command line
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist exportOptions.plist \
  -exportPath build/

xcrun altool --upload-app \
  -f build/App.ipa \
  -t ios \
  -u apple@example.com \
  -p @keychain:"App Store Connect API Key"
```

### Submit for Review

1. In App Store Connect > "Prepare for Submission"
2. Complete build information
3. Review all metadata
4. Submit for Review
5. Apple reviews (typically 1-2 days)

---

## Google Play Store

### Prerequisites

- Google Play Developer Account ($25 one-time)
- Android keystore
- Capacitor Android setup

### Build Configuration

#### 1. Create Keystore

```bash
keytool -genkey -v -keystore pong-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias pong-key

# Store securely!
```

#### 2. Update build.gradle

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../pong-release.keystore")
            storePassword "your-store-password"
            keyAlias "pong-key"
            keyPassword "your-key-password"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 3. Build Release APK/AAB

```bash
cd android

# Build APK
./gradlew assembleRelease

# Or build Android App Bundle (recommended)
./gradlew bundleRelease
```

#### 4. Upload to Play Store

In Google Play Console:

1. Create new app
2. Complete store listing
3. Upload screenshots & graphics
4. Write app description
5. Set content rating
6. Upload AAB file
7. Review and release

```bash
# Or use command line
gplay publish android/app/build/outputs/bundle/release/app-release.aab
```

### Release Strategy

1. **Closed Testing**: 10% of users
2. **Open Testing**: 25% of users
3. **Production**: 100% rollout

Each stage: 1-2 days before auto-promotion

---

## Web Hosting

### Netlify (Free)

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Install
npm install -g vercel

# Deploy
vercel --prod
```

### Firebase Hosting

```bash
# Install
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy --only hosting
```

### Custom Domain

```bash
# Update nameservers at domain registrar
# to point to hosting provider

# Example (Netlify):
# NS1: dns1.netlify.com
# NS2: dns2.netlify.com
# NS3: dns3.netlify.com
# NS4: dns4.netlify.com
```

---

## Domain & SSL

### Setup Domain

1. Register domain at registrar (GoDaddy, Namecheap, etc.)
2. Update nameservers to hosting provider
3. Create DNS records:
   - A record for backend
   - CNAME for www
   - MX for email (optional)

### SSL Certificate

```bash
# Let's Encrypt (Free)
sudo certbot certonly --standalone -d pong.example.com

# Certificate files:
# - /etc/letsencrypt/live/pong.example.com/cert.pem
# - /etc/letsencrypt/live/pong.example.com/privkey.pem

# Auto-renew
sudo certbot renew --dry-run
```

---

## Monitoring

### Sentry (Error Tracking)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring

```bash
# UptimeRobot free tier
# Add HTTP endpoint monitoring
https://api.pong.example.com/health
```

### Performance Monitoring

```bash
# DataDog / New Relic
# Monitor:
# - Response times
# - Database queries
# - WebSocket connections
# - Memory usage
# - CPU usage
```

### Logs

```bash
# View PM2 logs
pm2 logs

# Or setup centralized logging
# - LogRocket
# - Stackdriver
# - CloudWatch
```

---

## Checklist

- [ ] Backend deployed & tested
- [ ] MongoDB backup configured
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Error tracking setup
- [ ] Performance monitoring enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] JWT secrets secured
- [ ] iOS app submitted
- [ ] Google Play app submitted
- [ ] Web app live
- [ ] Analytics configured
- [ ] Support page created
- [ ] Privacy policy & ToS added

---

## Troubleshooting

**App rejection in App Store?**
- Review rejection reason
- Check compliance with App Store guidelines
- Update privacy policy
- Ensure no hardcoded secrets

**WebSocket connection fails?**
- Check firewall rules
- Verify CORS headers
- Check WebSocket path
- Review browser console

**High latency?**
- Use CDN for static assets
- Reduce sync interval
- Add regional servers
- Optimize database queries

---

**Successfully deployed! 🚀**
