# Progressive Web App (PWA) Configuration

This project is fully configured as a Progressive Web App with offline-first capabilities, caching strategies, and installability.

## Features

### 🚀 Installation
- **Installable on mobile and desktop** via browser app menu
- **Standalone display mode** - runs like a native app
- **Custom splash screens** based on manifest configuration
- **App icon** with maskable support for adaptive icons

### 📱 Responsive & Adaptive
- **Mobile-first design** with portrait orientation
- **Responsive layouts** for all screen sizes
- **Adaptive icon support** for modern devices

### 🔒 Offline First
- **Service Worker caching** with multiple strategies
- **Network-first API calls** with cache fallback
- **Cache-first static assets** (CSS, JS, images)
- **Automatic cache invalidation** and cleanup

### 📦 Caching Strategies

#### API Requests (`/api/*`)
- Network-first approach
- 10-second network timeout
- 5-minute cache expiration
- Max 50 cached entries

#### Images & Media
- Cache-first approach
- 30-day cache duration
- Max 60 cached entries

#### Static Assets (JS/CSS)
- Cache-first approach
- 7-day cache duration
- Max 50 cached entries

### 🔄 Auto-Update
- Service Worker auto-updates when changes are deployed
- Periodic checks every minute
- Seamless background updates

## Building for PWA

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

The build process automatically:
- Generates optimized PWA manifest
- Creates service worker bundle with Workbox
- Minifies and caches all assets
- Generates source maps for debugging

## Installation Instructions

### iOS (Safari)
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Customize name and tap "Add"

### Android (Chrome)
1. Open in Chrome
2. Tap menu (three dots)
3. Select "Add to Home Screen" or "Install app"
4. Confirm installation

### Desktop (Chromium)
1. Open in Chrome/Edge
2. Click install icon in address bar
3. Confirm installation

## Testing PWA Features

### Test Offline Mode
1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Check "Offline"
4. Navigate the app - should work seamlessly

### Test Cache
1. Open DevTools > Application > Cache Storage
2. View cached requests by type
3. Verify cache sizes and expiration

### Test Service Worker
1. Open DevTools > Application > Service Workers
2. Verify registration status
3. Check console logs for SW lifecycle events

## Configuration Files

- **manifest.json** - PWA metadata (name, icons, theme colors)
- **sw.js** - Custom service worker with caching logic
- **vite.config.ts** - Vite PWA plugin configuration
- **index.html** - PWA meta tags

## Browser Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 87+
- ✅ Safari 15+
- ✅ Android Browser
- ✅ Opera 76+

## Performance

- **Fast load times** with aggressive caching
- **Offline browsing** with cached content
- **Reduced bandwidth** through smart caching
- **Background sync** support for future features

## Security

- All assets loaded over HTTPS in production
- Secure API communication with cache validation
- Service Worker limited to HTTPS contexts
- No sensitive data cached automatically

## Future Enhancements

- [ ] Background sync for appointments
- [ ] Push notifications for reminders
- [ ] Periodic background sync
- [ ] Advanced offline form submission
- [ ] Media streaming optimization
