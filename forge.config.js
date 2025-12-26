const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'hanasato',
    executableName: 'hanasato',
    icon: './assets/icon',
    appBundleId: 'com.camelliav.hanasato',
    appCategoryType: 'public.app-category.graphics-design',
    // Include locales and assets
    extraResource: ['./assets', './locales'],
    // Ignore makepkg directories and other build artifacts
    ignore: [
      /^\/pkg$/,
      /^\/src$/,
      /^\/PKGBUILD$/,
      /^\/\.SRCINFO$/,
      /^\/.*\.pkg\.tar\..*/,
      /^\/imgs$/,
      /^\/\.git$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'hanasato',
        setupIcon: './assets/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'hanasato',
          productName: 'Hanasato',
          genericName: 'Image Viewer',
          description: 'Fast local image viewer with Pinterest-style layout and i18n support',
          categories: ['Graphics', 'Viewer', 'Photography'],
          icon: './assets/icon.png',
          section: 'graphics',
          priority: 'optional',
          mimeType: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/avif',
            'image/bmp',
            'image/svg+xml',
            'image/tiff',
          ],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'hanasato',
          productName: 'Hanasato',
          genericName: 'Image Viewer',
          description: 'Fast local image viewer with Pinterest-style layout and i18n support',
          categories: ['Graphics', 'Viewer', 'Photography'],
          icon: './assets/icon.png',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
