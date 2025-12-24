const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'local-image-viewer',
    executableName: 'local-image-viewer',
    icon: './assets/icon',
    appBundleId: 'com.camelliav.local-image-viewer',
    appCategoryType: 'public.app-category.graphics-design',
    // Linux-specific
    extraResource: ['./assets'],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'local_image_viewer',
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
          name: 'local-image-viewer',
          productName: 'Local Image Viewer',
          genericName: 'Image Viewer',
          description: 'Fast local image viewer with Pinterest-style layout',
          categories: ['Graphics', 'Viewer', 'Photography'],
          icon: './assets/icon.png',
          section: 'graphics',
          priority: 'optional',
          mimeType: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'local-image-viewer',
          productName: 'Local Image Viewer',
          genericName: 'Image Viewer',
          description: 'Fast local image viewer with Pinterest-style layout',
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
