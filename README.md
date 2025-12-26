# Hanasato

A local image viewer built with Electron and React, featuring a Pinterest-style waterfall layout, GPU acceleration, advanced image viewing/editing, and multi-language support.

![](./imgs/image_10.avif)
![](./imgs/image_12.avif)
![](./imgs/image_11.avif)

## Key Features

### Core Functionality
- **Fast Local Scanning** - Quickly scans directories and sub-directories using `fast-glob`
- **Waterfall Layout** - Pinterest-style responsive grid with configurable column count (2-8 columns)
- **Infinite Scrolling** - Smooth lazy loading as you scroll
- **Multi-Tab Support** - Open multiple directories in separate tabs with persistent state
- **Dark/Light Mode** - Toggle between themes with preference persistence

### Advanced Image Viewer
- **Full-Screen Modal** - Click any image for immersive viewing
- **Zoom & Pan** - Mouse wheel zoom (0.5x-5x) with drag mode for panning
- **Slideshow Mode** - Auto-advance through images with 3-second intervals
- **Image Editing**:
  - **Crop** - Draw selection area and save cropped region
  - **Resize** - Custom width/height resizing
  - **Rename/Save As** - Copy with new filename

### Organization
- **Star/Favorite System** - Copy images to dedicated Starred Images folder
- **Quick Star** - Hover-to-show star button on thumbnails (toggleable)
- **Batch Deletion** - Multi-select mode with floating action bar
- **Search & Filter** - Filter by filename, path, or folder name
- **Sorting** - Sort by name, date, or size (ascending/descending)

### Navigation
- **Directory History** - Back/forward navigation with mouse button support
- **Recently Accessed** - Persistent list of recent directories
- **Drag & Drop** - Drop folders directly to load
- **File Location** - Open containing folder for any image

### Customization
- **Multi-Language Support** - English, Chinese (简体中文), Japanese (日本語)
- **Auto Language Detection** - Defaults to system language
- **Customizable Keybindings** - Remap all keyboard shortcuts
- **Configurable Settings**:
  - Click outside to close viewer
  - Confirmation prompts
  - Action feedback alerts
  - Max image size (viewport width)

### Performance
- **GPU Acceleration** - Hardware-accelerated rendering
- **Zero-Copy** - Optimized image loading
- **Image Caching** - Efficient memory management
- **Lazy Loading** - Load images on demand

## Keyboard Shortcuts

### Image Viewer
| Key | Action |
|-----|--------|
| `←` / `→` | Previous / Next image |
| `+` / `-` | Zoom in / out |
| `0` | Reset zoom |
| `d` | Toggle drag mode (when zoomed) |
| `Space` | Toggle slideshow |
| `Delete` | Delete image |
| `s` | Star/Unstar image |
| `c` | Copy to clipboard |
| `l` | Open file location |
| `x` | Crop mode |
| `r` | Resize mode |
| `Escape` | Close viewer |

### Main Window
| Key | Action |
|-----|--------|
| `Ctrl+O` | Open directory |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `f` | View favorites |
| `Delete` | Toggle delete mode |
| `m` | Toggle dark mode |
| `h` | Toggle history panel |
| `,` | Open settings |
| `?` | Open help |

## Technology Stack

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React 18](https://reactjs.org/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[fast-glob](https://github.com/mrmlnc/fast-glob)** - High-performance file scanning
- **[Electron Forge](https://www.electronforge.io/)** - Build and packaging

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/CamelliaV/hanasato.git

# Navigate to project directory
cd hanasato

# Install dependencies
npm install
```

### Running

```bash
# Development mode (with DevTools)
npm run dev

# Production mode
npm start
```

### Building

```bash
# Create distributable package
npm run make

# Package without creating installer
npm run package
```

### Platform-Specific Packages

The build system supports:
- **Windows** - Squirrel installer (.exe)
- **macOS** - ZIP archive
- **Linux** - DEB, RPM, and ZIP packages

#### Arch Linux

```bash
# Build and install from PKGBUILD
makepkg -si
```

## Architecture

```
├── main.js           # Electron main process
├── preload.js        # Secure IPC bridge (contextBridge)
├── renderer/
│   └── index.html    # React single-page application
├── locales/          # i18n translation files
│   ├── en.json
│   ├── zh-CN.json
│   └── ja.json
└── assets/           # Icons and desktop entry
```

### Security

- **Context Isolation** - Renderer process isolated from Node.js
- **Custom Protocol** - `local-image://` protocol for secure local file access
- **No Remote Content** - All resources loaded locally
- **ASAR Integrity** - Packaged with integrity validation

## Supported Formats

Images: `jpg`, `jpeg`, `png`, `gif`, `bmp`, `webp`, `avif`, `svg`, `ico`, `tiff`, `tif`

## License

MIT License
