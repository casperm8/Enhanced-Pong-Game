# Enhanced Pong Game - Mobile App Setup

This guide will help you set up the Capacitor mobile app for iOS and Android.

## Prerequisites

### For iOS Development
- Mac with Xcode (13+)
- iOS SDK
- CocoaPods

### For Android Development
- Android Studio
- Android SDK (API 23+)
- Java Development Kit (JDK 11+)

### Common
- Node.js (14+) and npm
- Git

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Web Assets

```bash
npm run build
```

### 3. Set Up iOS

```bash
npm run cap:add:ios
npm run cap:sync
npm run cap:open:ios
```

Xcode will open. Select your development team and build:
- Select the project in Xcode
- Go to Signing & Capabilities
- Select your team
- Run the app (Cmd + R)

### 4. Set Up Android

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

Android Studio will open. Build and run:
- Wait for gradle sync to complete
- Connect an Android device or start an emulator
- Click "Run" or press Shift + F10

## Development Workflow

### Making Changes

1. Edit files in `src/`
2. Run `npm run build` to rebuild web assets
3. Run `npm run cap:sync` to update native projects
4. Re-run the app in Xcode or Android Studio

### Testing Accelerometer (Tilt Controls)

**iOS Simulator:**
- In Xcode, go to Features > Location > None
- Then Device > Rotate Left/Right to test orientation
- Note: Accelerometer simulation is limited in simulators

**Android Emulator:**
- Use the emulator's extended controls (three dots menu)
- Go to "Sensors" tab
- Adjust accelerometer values

**Physical Devices:**
- Tilt controls work on real devices with accelerometers
- Test thoroughly before release

## Mobile Features

### 1. Haptic Feedback
- **Light**: Wall bounces, mode switches
- **Medium**: Paddle hits, difficulty changes
- **Heavy**: Scoring events
- Disables gracefully on unsupported devices

### 2. Tilt Controls
- Activate via "Control Mode" button
- Rotates device to move paddle
- Maps accelerometer X-axis to paddle position
- Smooth interpolation for responsive feel

### 3. Touch Controls (Default)
- Tap or drag on canvas to move paddle
- Natural and intuitive for mobile
- Works on all touch devices

### 4. Screen Orientation
- Locked to landscape for optimal gameplay
- Automatically rotates when device is rotated
- Optimal for 16:9 and wider screens

### 5. Safe Area Support
- Respects notches and safe areas
- Uses viewport-fit=cover for full-screen
- Button layout avoids unsafe areas

## Building for Distribution

### iOS App Store

1. Ensure provisioning profiles are set up
2. In Xcode: Product > Build
3. Product > Archive
4. Organizer > Distribute App
5. Follow the App Store submission process

### Google Play Store

1. Generate signed APK/AAB in Android Studio:
   - Build > Generate Signed Bundle/APK
   - Create or select keystore
   - Select "Bundle (Google Play)" for AAB format
2. Upload to Google Play Console
3. Complete store listing and submit

## Configuration

Edit `capacitor.config.ts` to customize:

```typescript
- appId: Change to your app's unique ID
- appName: Display name in app stores
- plugins: Configure orientation, haptics, etc.
```

## Troubleshooting

### "Pod install failed"
- Run `cd ios && pod install && cd ..`
- Delete `Pods` folder and `Podfile.lock`, then retry

### "Gradle sync failed"
- In Android Studio: File > Sync Now
- Update Android SDK and tools from SDK Manager
- Check JAVA_HOME environment variable

### "Capacitor plugins not working"
- Run `npm run cap:sync` after adding/updating plugins
- Rebuild the native project
- Check plugin documentation for permissions

### "Accelerometer not responding"
- Check device has accelerometer (all modern phones do)
- Ensure app has required permissions
- Test on physical device (simulators have limited sensor support)

## Performance Tips

1. **Rendering**: Uses Canvas rendering for 60 FPS
2. **Physics**: Optimized collision detection
3. **Touch**: Debounced event handlers
4. **Memory**: Auto-cleanup when game ends

## Deployment Checklist

- [ ] Increment version in `capacitor.config.ts`
- [ ] Test on multiple devices
- [ ] Test both tilt and touch controls
- [ ] Test haptics on target devices
- [ ] Check battery consumption
- [ ] Review privacy policy for app store
- [ ] Create app store screenshots
- [ ] Write compelling app description

## Support

For issues, see:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Device Motion Plugin](https://capacitorjs.com/docs/apis/device-motion)
- [Haptics Plugin](https://capacitorjs.com/docs/apis/haptics)
- [Screen Orientation Plugin](https://capacitorjs.com/docs/apis/screen-orientation)
