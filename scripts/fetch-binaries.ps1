# Downloads the sidecar binaries (yt-dlp, ffmpeg, ffprobe) that VDA bundles.
# These are gitignored because of their size (~550 MB total), so run this once
# after cloning, before `npm run tauri dev` / `tauri build`.
#
#   powershell -ExecutionPolicy Bypass -File scripts/fetch-binaries.ps1

$ErrorActionPreference = "Stop"
$triple = "x86_64-pc-windows-msvc"
$binDir = Join-Path $PSScriptRoot "..\src-tauri\binaries"
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

Write-Host "Downloading yt-dlp..."
Invoke-WebRequest `
  -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" `
  -OutFile (Join-Path $binDir "yt-dlp-$triple.exe")

Write-Host "Downloading ffmpeg bundle (this is large)..."
$zip = Join-Path $env:TEMP "vda-ffmpeg.zip"
Invoke-WebRequest `
  -Uri "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" `
  -OutFile $zip

$extract = Join-Path $env:TEMP "vda-ffmpeg"
Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $extract -Force

$ffmpeg = (Get-ChildItem -Path $extract -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1).FullName
$ffprobe = (Get-ChildItem -Path $extract -Recurse -Filter "ffprobe.exe" | Select-Object -First 1).FullName

# Plain names are used in development; target-triple names are what Tauri's
# `externalBin` bundler picks up for packaged builds.
foreach ($name in @("ffmpeg", "ffprobe")) {
  $src = if ($name -eq "ffmpeg") { $ffmpeg } else { $ffprobe }
  Copy-Item $src (Join-Path $binDir "$name.exe") -Force
  Copy-Item $src (Join-Path $binDir "$name-$triple.exe") -Force
}

Remove-Item $zip -Force
Write-Host "Done. Binaries are in src-tauri/binaries."
