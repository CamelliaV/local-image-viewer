# Maintainer: CamelliaV
pkgname=local-image-viewer
pkgver=1.0.0
pkgrel=1
pkgdesc="Fast local image viewer with Pinterest-style layout"
arch=('x86_64')
url="https://github.com/camelliav/local-image-viewer"
license=('MIT')
depends=('electron' 'gtk3' 'nss' 'libxss' 'libxtst' 'xdg-utils' 'libnotify' 'libappindicator-gtk3' 'trash-cli')
makedepends=('npm' 'nodejs')
source=("$pkgname-$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
    cd "$srcdir/$pkgname-$pkgver"
    npm install
    npm run make -- --platform=linux --arch=x64
}

package() {
    cd "$srcdir/$pkgname-$pkgver"

    # Install the app
    install -dm755 "$pkgdir/opt/$pkgname"
    cp -r out/local-image-viewer-linux-x64/* "$pkgdir/opt/$pkgname/"

    # Create executable symlink
    install -dm755 "$pkgdir/usr/bin"
    ln -s "/opt/$pkgname/local-image-viewer" "$pkgdir/usr/bin/local-image-viewer"

    # Install desktop file
    install -Dm644 assets/local-image-viewer.desktop "$pkgdir/usr/share/applications/local-image-viewer.desktop"

    # Install icon (if exists)
    if [ -f "assets/icon.png" ]; then
        install -Dm644 assets/icon.png "$pkgdir/usr/share/icons/hicolor/256x256/apps/local-image-viewer.png"
    fi

    # Fix permissions
    chmod -R 755 "$pkgdir/opt/$pkgname"
}
