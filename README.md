# 1min.ai Image Bulk Generator

A modern, fast, and secure React interface for interacting with 1min.ai's image generation and upscaling APIs. Designed to handle bulk-processing asynchronously via pasting prompts or uploading a `.txt` file.

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Lumi-Script/1min-API-ImageGen-Vite)

## Features

- 🚀 **Multi-threaded Bulk Generation:** Process up to 10 prompts concurrently (streamlined via the React client).
- 📁 **Smart File System Access:** Saves outputs instantly to a chosen desktop folder without zip bottlenecks, or defaults to a clean ZIP download.
- 🌐 **Cloudflare Worker CORS Proxy:** A built-in `_worker.ts` script that securely bypasses browser CORS errors when downloading generated images from 1min.ai servers.
- 🎨 **Dynamic Configs:** Dynamically swaps configuration menus ensuring strict compatibility with models like GPT Image, Flux, and Dzine.
- ⚡ **Gemini Prompt Generation:** Brainstorm 5, 10, or 50 high-quality prompts instantly using Google AI Studio.
- 🔒 **Local & Secure:** Your API keys are strictly saved in `localStorage` and requests are executed locally from your browser.

## Setup & Deployment

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Because the application utilizes a Cloudflare Worker (`_worker.ts`) to bypass image download CORS restrictions, testing locally requires simulating the Cloudflare Edge network rather than using a standard Vite server.

   **Run Local Cloudflare Simulator (Wrangler):**
   ```bash
   npm run build
   npx wrangler dev
   ```

3. Open your browser and navigate to the localhost port provided by Wrangler.

## Usage

1. Open the **API Keys** dropdown in the top right to save your 1min.ai and Google AI Studio keys.
2. Select a model from the left sidebar and configure its parameters.
3. Type prompts line-by-line, or generate them using the Gemini feature.
4. Click **Start Generation**!
