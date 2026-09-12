# Drive City 🚗🏙️

A browser-based 3D arcade driving game built with Three.js.

## Features

- Third-person driving
- Random player-car color every session
- WASD / arrow controls
- Space accelerator boost
- 500 MPH speedometer
- Procedural city with tall buildings, parks, roads and streetlights
- Dynamic shadows and reflective materials
- AI traffic with varied speeds
- Traffic signals
- Crash effects and synthesized sound effects
- In-game radio with local uploads

## Run

Open `index.html` in a modern browser, or enable GitHub Pages for the repository.

## Radio music

The browser cannot automatically discover files inside a GitHub folder. To use permanent repository radio tracks:

1. Upload MP3 files to `assets/music/`.
2. In `index.html`, find `const repoTracks=[]`.
3. Add filenames, for example:

```js
const repoTracks=['song1.mp3','song2.mp3'];
```

The game also has an **ADD MUSIC** button so you can test audio files directly from your computer without changing the repository.

Only upload music you have permission to distribute.
