
---
# Local Image Viewer
---

- A vibe coding product —— local image viewer built with Electron and React, featuring a Pinterest-style waterfall layout, infinite scrolling, directory navigation, deletion and fav.

![](./imgs/image_10.avif)
![](./imgs/image_12.avif)
![](./imgs/image_11.avif)

## ✨ Key Features

- **⚡ Fast Local Scanning:** Quickly scans directories and sub-directories for images using `fast-glob`.
- **🖼️ Waterfall Layout:** Displays images in a beautiful and efficient Pinterest-style grid.
- **🖱️ Infinite Scrolling:** Smoothly loads more images as you scroll down the gallery.
- **🎨 Dark & Light Modes:** Toggles between themes with a single click, remembering your preference.
- **🔍 Full-Screen Viewer:** Click any image to open a full-screen modal with keyboard navigation (`←`, `→` for next/previous, `Esc` to close).
- **⭐ Star/Favorite System:**
  - Copy any image to a dedicated `Starred Images` folder in your system's Pictures directory.
  - A dedicated "View Starred" button to quickly switch to your favorites gallery.
- **🗑️ Batch Deletion:**
  - Enter "Select to Delete" mode to choose multiple images.
  - A floating action bar shows your selection count.
  - Delete all selected images to the recycle bin/trash in one operation.
- **🔎 Search & Filter:** Instantly filter the current gallery by filename or folder path.
- **📂 File System Integration:**
  - Open an image's containing folder directly from the app.
  - All deletions move files to the system's recycle bin/trash, not permanently.
- **🔒 Secure by Design:** Uses a custom `local-image://` protocol to securely load local files without disabling web security.

## 🛠️ Technology Stack

- **[Electron](https://www.electronjs.org/)**: Core framework for building the cross-platform desktop application.
- **[React](https://reactjs.org/)**: Used for building the user interface.
- **[Tailwind CSS](https://tailwindcss.com/)**: For utility-first styling.
- **[Node.js](https://nodejs.org/)**: Powers the main process for all file system operations.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/en/download/) (which includes `npm`) installed on your system.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/CamelliaV/local-image-viewer.git
    ```

2.  **Navigate into the project directory:**

    ```bash
    cd local-image-viewer
    ```

3.  **Install the dependencies:**
    ```bash
    npm install
    ```

### Running the Application

- **To run the app in development mode** (with DevTools open):

  ```bash
  npm run dev
  ```

- **To run the app in a standard production-like mode:**
  ```bash
  npm start
  ```

## ⚙️ How It Works

The application is built on a standard Electron architecture:

- **Main Process (`main.js`):** This is the Node.js backend of the app. It is responsible for creating the browser window, handling all file system interactions (scanning directories, deleting files, copying files), and managing all Inter-Process Communication (IPC) channels.

- **Renderer Process (`renderer/index.html`):** This is the frontend of the app, built entirely with React. It handles all user interface elements and logic. It cannot access the file system directly.

- **Preload Script (`preload.js`):** This is the secure bridge between the frontend and backend. It uses Electron's `contextBridge` to safely expose specific functions from the Main process (like `getImages` or `deleteImage`) to the Renderer process.

- **Custom Protocol (`local-image://`):** To securely display images from the user's local disk without disabling web security, the app registers a custom protocol. When the frontend tries to load `<img src="local-image:///path/to/image.png">`, the Main process intercepts this request, translates it to a real file path, and serves the file's content.
