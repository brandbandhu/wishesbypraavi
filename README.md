# Praavi Diwali Greeting

A React + TypeScript + Vite website with cinematic Canvas fireworks and personalized Diwali greeting cards. Preview and downloaded PNG use the same fixed-size Canvas. No account, backend, or server rendering is required.

## Development

Use Node.js 22.12+ (or 24 LTS) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:8080.

## Checks and production build

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Deploy the `dist/` directory to a static web host. The app uses standard Vite configuration, with React and Tailwind CSS plugins.

Fireworks play on every visit and loop until the visitor scrolls down. They resume on returning to the top, pause when the tab is hidden, and respect reduced-motion preferences.

The supplied “Deepavali (Festival Of Lights)” MP3 accompanies the greeting at low volume. Music starts enabled on every fresh visit and plays automatically where browser policy permits, otherwise on the first tap/click or Enter/Space. Visitors can turn it off for the current visit using the music control. Playback pauses while the tab is hidden. The track is hosted with the app and needs no external music service.
