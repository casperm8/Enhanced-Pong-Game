# 🎮 Pong Mobile - Native App

Enhanced Pong Game converted to a native mobile app using Capacitor, with advanced touch controls, accelerometer tilt gameplay, and haptic feedback.

## ✨ Mobile Features

### Control Modes
- **Touch Control (Default)**: Tap or drag on the canvas to move your paddle - intuitive and responsive
- **Tilt Control**: Rotate your device to move the paddle - immersive accelerometer-based gameplay
- **Toggle anytime** with the "Control Mode" button

### Haptic Feedback
- 🔵 **Light haptics** on wall bounces and mode switches
- 🟡 **Medium haptics** on paddle hits and difficulty changes  
- 🔴 **Heavy haptics** on scoring events
- Gracefully disables on unsupported devices

### Optimization for Mobile
- Landscape-optimized layout
- Safe area and notch support (iPhone, Android)
- Responsive scaling for all screen sizes
- Full-screen immersive mode
- Battery-efficient 60 FPS rendering

### Gameplay Features
- **4 Difficulty Levels**: Easy → Medium → Hard → Insane
- **Real-time Stats**: Ball speed, paddle speed, bounce counter
- **Smooth Physics**: Realistic ball physics with paddle spin
- **AI Opponent**: Difficulty-adaptive computer AI

## 📱 Supported Platforms

- **iOS** 14.0+ (iPhone 6s and later)
- **Android** 6.0+ (API 23+)
- **Web**: Any modern browser with touch support

## 🚀 Quick Start

### Install & Build

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Add platforms
npm run cap:add:ios
npm run cap:add:android
```

### Run on iOS

```bash
npm run cap:sync
npm run cap:open:ios
# Select your team in Xcode and run
```

### Run on Android

```bash
npm run cap:sync
npm run cap:open:android
# Connect device or start emulator, then run
```

## 🎮 How to Play

### Touch Mode
1. Tap "Start" to begin
2. Drag your finger up/down on the canvas to move your paddle
3. Return the ball to score
4. Hit "Pause" to pause, "Difficulty" to change level

### Tilt Mode
1. Tap "Control Mode" to switch to tilt
2. Tap "Start" to begin
3. Rotate your device to move the paddle (left = paddle down, right = paddle up)
4. Same scoring rules apply

### Tips
- **Positioning**: Keep your paddle centered to react to fast shots
- **Spin**: Hit the ball at the paddle's edge for more spin
- **Progressive difficulty**: Master Easy before trying Insane
- **Haptic feedback**: The vibrations tell you what's happening!

## 🎯 Difficulty Levels

| Level | Computer Speed | Ball Max Speed | Challenge |
|-------|---|---|---|
| 🟢 Easy | 2.5 | 6 | Perfect for beginners |
| 🟡 Medium | 4 | 8 | Balanced gameplay |
| 🔴 Hard | 5.5 | 10 | For experienced players |
| 🔵 Insane | 7 | 12 | Expert mode - extremely challenging |

## 📊 Game Statistics

- **Ball Speed**: Current velocity magnitude (0-12 depending on difficulty)
- **Paddle Speed**: Your paddle's movement speed (6 units/frame)
- **Bounces**: Total ball bounces (walls + paddles) in current game

## ⚙️ Configuration

Edit `capacitor.config.ts` to customize:

```typescript
appId: 'com.pongmobile.game'  // Your app's unique identifier
appName: 'Pong Mobile'          // Display name
orientation: 'landscape'        // Always landscape
```

## 🔧 Development

### File Structure

```
src/
  ├── index.html          # Mobile UI (touch/tilt controls)
  ├── styles.css          # Responsive styling for all screens
  ├── game-mobile.js      # Game logic with mobile features
  └── (accelerometer, haptics, orientation)

capacitor.config.ts       # Capacitor configuration
package.json              # Dependencies and build scripts
```

### Making Changes

```bash
# Edit files in src/

# Rebuild
npm run build

# Sync to native projects
npm run cap:sync

# Re-run in Xcode or Android Studio
```

### Testing Accelerometer

**Physical Device**: Tilt control works on any device with an accelerometer

**iOS Simulator**: Limited sensor support - use device rotation simulation

**Android Emulator**: Use extended controls > Sensors to adjust accelerometer

## 📦 Building for App Stores

### iOS App Store

1. Open `ios/App/App.xcodeproj` in Xcode
2. Set provisioning profiles
3. Product > Archive
4. Organize > Distribute App
5. Complete submission process

### Google Play Store

1. Open Android project in Android Studio
2. Build > Generate Signed Bundle/APK
3. Upload to Google Play Console
4. Complete store listing
5. Submit for review

## 🐛 Troubleshooting

**Tilt control not working?**
- Ensure device has accelerometer (all modern phones do)
- Check app has necessary permissions
- Test on physical device (simulators have limited sensor support)

**No haptic feedback?**
- Some devices may not support haptics
- Feature degrades gracefully - game still works
- Check device's haptics settings

**Scaling looks wrong?**
- The app automatically scales for your device
- Try rotating device to landscape
- Check that safe areas are respected on notched devices

**Performance issues?**
- Reduce difficulty level (speeds up AI)
- Close other apps
- Try disabling haptics in settings

## 📄 License

GNU General Public License v3.0

Free to use, modify, and distribute for personal and educational purposes.

---

**Enjoy Pong on mobile! 📱🎮✨**

For native app setup and deployment details, see [MOBILE_SETUP.md](MOBILE_SETUP.md)
