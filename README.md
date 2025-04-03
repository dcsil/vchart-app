# VChart Application

Welcome to the VChart application! This project is built with Next.js.

## Table of Contents

- [Installation](#installation)
- [Developer Setup](#developer-setup)
- [Available Scripts](#available-scripts)
- [Deployed Website](#deployed-website)

## Installation

Before running the application, ensure you have [Node.js](https://nodejs.org/) installed on your machine. This project requires Node.js version 16 or higher.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/dcsil/vchart-app.git
   cd vchart-app
   ```

2. **Install dependencies:**

   If you prefer to install dependencies manually, run:

   ```bash
   npm install
   ```

## Developer Setup

To streamline the process of setting up your development environment, we have provided a bootstrap script located at `script/bootstrap`. This script performs the following tasks:

- **Node.js Check:** Verifies that Node.js is installed and meets the minimum version requirement.
- **Dependency Installation:** Installs all required npm dependencies.
- **Development Server Startup:** Launches the Next.js development server.

### How to Use the Bootstrap Script

1. **Make the script executable (if necessary):**

   ```bash
   chmod +x script/bootstrap
   ```

2. **Run the bootstrap script:**

   ```bash
   ./script/bootstrap
   ```

   The script will output progress messages as it:

   - Checks for Node.js installation
   - Installs project dependencies
   - Starts the development server

   Once the script completes, your development environment should be up and running.

## Available Scripts

In the project directory, you can run:

- **`npm run dev`**  
  Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

- **`npm run build`**  
  Builds the app for production to the `.next` folder.

- **`npm run start`**  
  Runs the built app in production mode.

- **`npm run test`**  
  Launches the test runner using Jest.

## Deployed Website

The VChart application is live! You can view the deployed version at:
[https://vchart-app-beta.vercel.app](https://vchart-app-beta.vercel.app/)

## Credentials

You can log in using the following credentials:

- **Username**: `test`
- **Password**: `password`
