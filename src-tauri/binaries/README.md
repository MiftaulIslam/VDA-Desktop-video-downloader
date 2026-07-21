# Bundled binaries

VDA ships three external binaries as Tauri sidecars (declared under
`bundle.externalBin` in `tauri.conf.json`):

| Binary    | Purpose                                            |
| --------- | -------------------------------------------------- |
| `yt-dlp`  | Fetches video metadata and downloads streams.      |
| `ffmpeg`  | Muxes video-only + audio-only streams into one mp4. |
| `ffprobe` | Stream inspection used by ffmpeg/yt-dlp.           |

These `.exe` files are **gitignored** (~550 MB total). Restore them with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fetch-binaries.ps1
```

## Naming

Each binary exists under two names:

- `name-x86_64-pc-windows-msvc.exe` — the target-triple form Tauri's bundler
  requires for `externalBin`; placed next to the app executable (renamed to
  `name.exe`) in packaged builds.
- `name.exe` — plain form used during `tauri dev`.

The Rust side (`src/binaries.rs`) resolves whichever is present, so both dev
and packaged builds find the binaries.
