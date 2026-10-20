# Etica GUI Wallet - Build Instructions

## Prerequisites

### Node.js Version
**Required: Node.js 16.x LTS** (recommended: 16.20.2)

This version ensures compatibility with:
- Electron 23.1.1
- electron-builder 20.38.3
- All project dependencies

### Installing Node.js with NVM (Windows)

1. Download NVM for Windows from: https://github.com/coreybutler/nvm-windows/releases
2. Run `nvm-setup.exe`
3. **Important:** If your Windows username contains special characters (accents, spaces), install to:
   - NVM path: `C:\nvm`
   - Node symlink: `C:\nodejs`
4. Open a new PowerShell/CMD window
5. Install and use Node 16:

```powershell
nvm install 16.20.2
nvm use 16.20.2
node --version   # Should show v16.20.2
npm --version    # Should show 8.x.x
```

### Installing Node.js with NVM (Linux/WSL)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then:
nvm install 16.20.2
nvm use 16.20.2
node --version   # Should show v16.20.2
```

---

## Build Instructions

### Windows Build (from Windows PowerShell/Git Bash)

```powershell
# Navigate to project directory
cd C:\path\to\etica-gui

# Install dependencies
npm install

# Build Windows executable
npm run dist-win
```

**Output:** `dist/Windows-eticawallet-{version}.7z`

### Linux Build

**Option A: From Windows** (usually works for this project)

```powershell
cd C:\path\to\etica-gui
npm install
npm run dist-linux
```

**Option B: From Linux/WSL** (recommended for Linux builds)

```bash
cd /path/to/etica-gui
npm install
npm run dist-linux
```

**Output:** `dist/Linux-eticawallet-{version}.tar.gz`

### macOS Build (from macOS only)

```bash
cd /path/to/etica-gui
npm install
npm run dist-osx
```

**Output:** `dist/MacOS-eticawallet-{version}.pkg`

---

## Build Outputs

All build artifacts are placed in the `dist/` folder:

| Platform | Command | Output File |
|----------|---------|-------------|
| Windows | `npm run dist-win` | `Windows-eticawallet-{version}.7z` |
| Linux | `npm run dist-linux` | `Linux-eticawallet-{version}.tar.gz` |
| macOS | `npm run dist-osx` | `MacOS-eticawallet-{version}.pkg` |

---

## Project Structure (Build-Related)

```
etica-gui/
├── bin/
│   ├── win/          # Windows geth binary
│   ├── linux/        # Linux geth binary
│   └── macos/        # macOS geth binary
├── build/
│   ├── icon.ico      # Windows icon
│   └── icon.icns     # macOS/Linux icon
├── needs/
│   └── static-nodes.json   # Bootstrap nodes (included in build)
├── dist/             # Build output directory
├── package.json      # Build configuration
└── BUILD.md          # This file
```

---

## Important Notes

### Before Building Windows Version
Ensure geth.exe is unzipped in `bin/win/`. Check `bin/win/geth-unzip-in-this-folder/` if the binary is compressed.

### Version Number
Update version in `package.json` before building a new release:
```json
{
  "version": "1.0.15"
}
```

### Cross-Platform Building

| Build From | Windows | Linux | macOS |
|------------|---------|-------|-------|
| Windows | Yes | Yes* | No |
| Linux | No | Yes | No |
| macOS | No | Yes | Yes |

*Linux builds from Windows work for this project since there are no complex native modules.

### Troubleshooting

**"node: command not found"**
- Ensure Node.js is installed and in your PATH
- Restart your terminal after installing Node/NVM

**NVM path issues (Windows)**
- If username has special characters, reinstall NVM to `C:\nvm`
- Run NVM directly: `C:\nvm\nvm.exe use 16.20.2`

**Build fails with native module errors**
- Delete `node_modules/` folder
- Run `npm install` again
- Ensure you're using Node 16.x

**Permission errors on Windows**
- Run PowerShell as Administrator
- Or use Git Bash

---

## Quick Reference

```bash
# Check versions
node --version    # Should be v16.x.x
npm --version     # Should be 8.x.x

# Full build sequence
npm install
npm run dist-win      # Windows
npm run dist-linux    # Linux

# Development (run without building)
npm start
```

---

## Shortcuts (Development)

- Open DevTools: `Ctrl + Shift + I`
- Reload page: `Ctrl + R`
