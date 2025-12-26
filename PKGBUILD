# Maintainer: CamelliaV
pkgname=hanasato
pkgver=1.0.0
pkgrel=1
pkgdesc="Hanasato - Fast local image viewer with Pinterest-style layout - optimized for Zen4 + NVIDIA Blackwell"
arch=('x86_64')
url="https://github.com/camelliav/hanasato"
license=('MIT')
depends=(
    'electron'           # Use system Electron for better integration
    'gtk3'
    'nss'
    'libxss'
    'libxtst'
    'xdg-utils'
    'libnotify'
    'libappindicator-gtk3'
    # NVIDIA Blackwell (50 series) specific
    'nvidia-utils'       # NVIDIA driver utilities
    'libvdpau'           # VDPAU runtime
    'libva-nvidia-driver' # VA-API for NVIDIA (optional but recommended)
)
makedepends=('npm' 'nodejs')
optdepends=(
    'nvidia-settings: NVIDIA GPU configuration'
    'vulkan-tools: Vulkan diagnostics'
    'nvtop: NVIDIA GPU monitoring'
    'lib32-nvidia-utils: 32-bit NVIDIA support'
)
options=('!strip' '!debug')

# Zen4/znver4 optimizations
export CFLAGS="-march=znver4 -mtune=znver4 -O3 -pipe -fno-plt -fexceptions \
    -Wp,-D_FORTIFY_SOURCE=2 -Wformat -Werror=format-security \
    -fstack-clash-protection -fcf-protection \
    -mavx512f -mavx512dq -mavx512cd -mavx512bw -mavx512vl \
    -mavx512vbmi -mavx512vbmi2 -mavx512vnni -mavx512bitalg \
    -mavx512vpopcntdq -mavx512bf16"
export CXXFLAGS="$CFLAGS"
export LDFLAGS="-Wl,-O1,--sort-common,--as-needed,-z,relro,-z,now"

# Use all cores for parallel compilation
export MAKEFLAGS="-j$(nproc)"

build() {
    cd "$startdir"

    # Install dependencies with production flags
    npm install --production=false

    # Package with optimizations
    npm run package -- --platform=linux --arch=x64

    # Strip Electron debug symbols for smaller size (optional)
    # find out/hanasato-linux-x64 -type f -name "*.so" -exec strip --strip-unneeded {} \; 2>/dev/null || true
}

package() {
    cd "$startdir"

    # Install the app
    install -dm755 "$pkgdir/opt/$pkgname"
    cp -r out/hanasato-linux-x64/* "$pkgdir/opt/$pkgname/"

    # Create executable wrapper with performance flags
    install -dm755 "$pkgdir/usr/bin"
    cat > "$pkgdir/usr/bin/hanasato" << 'EOF'
#!/bin/bash
# Performance flags for Zen4 CPU + NVIDIA Blackwell GPU + KDE
export ELECTRON_ENABLE_LOGGING=0
export ELECTRON_NO_ATTACH_CONSOLE=1

# NVIDIA Blackwell GPU optimizations
export __GL_THREADED_OPTIMIZATION=1
export __GL_SHADER_DISK_CACHE=1
export __GL_SHADER_DISK_CACHE_SKIP_CLEANUP=1
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json

# NVIDIA VA-API (requires libva-nvidia-driver)
export LIBVA_DRIVER_NAME=nvidia
export NVD_BACKEND=direct

# WebGPU/Vulkan for Blackwell architecture
export MESA_VK_DEVICE_SELECT_FORCE_DEFAULT_DEVICE=1

# KDE/Wayland optimizations
if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
    export QT_QPA_PLATFORM=wayland
    export GDK_BACKEND=wayland
fi

exec /opt/hanasato/hanasato \
    --enable-features=UseSkiaRenderer,CanvasOopRasterization,VaapiVideoDecoder \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --enable-accelerated-video-decode \
    --enable-accelerated-mjpeg-decode \
    --num-raster-threads=4 \
    "$@"
EOF
    chmod 755 "$pkgdir/usr/bin/hanasato"

    # Install desktop file with GPU acceleration hint
    install -dm755 "$pkgdir/usr/share/applications"
    cat > "$pkgdir/usr/share/applications/hanasato.desktop" << EOF
[Desktop Entry]
Name=Hanasato
Comment=Fast local image viewer with Pinterest-style layout
Exec=hanasato %U
Icon=hanasato
Terminal=false
Type=Application
Categories=Graphics;Viewer;
MimeType=image/jpeg;image/png;image/gif;image/webp;image/avif;image/bmp;image/svg+xml;
StartupWMClass=hanasato
Keywords=image;photo;picture;viewer;gallery;hanasato;
EOF

    # Install icon
    if [ -f "assets/icon.png" ]; then
        install -Dm644 assets/icon.png "$pkgdir/usr/share/icons/hicolor/512x512/apps/hanasato.png"
    fi
    if [ -f "assets/icon-256.png" ]; then
        install -Dm644 assets/icon-256.png "$pkgdir/usr/share/icons/hicolor/256x256/apps/hanasato.png"
    fi

    # Fix permissions
    chmod -R 755 "$pkgdir/opt/$pkgname"

    # Install license
    install -Dm644 /dev/null "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
