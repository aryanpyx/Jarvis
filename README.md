# Jarvis AI Assistant
# 🧠 JARVIS - AI Voice Assistant

**JARVIS** is a full-stack, multilingual, voice-enabled AI assistant inspired by the Iron Man universe. This intelligent assistant supports GPT-powered conversations, wake word detection, auto-speaking replies, smart command recognition, and a sleek responsive UI — making it your perfect virtual companion across desktop and mobile

---

## 🚀 Features

- 🤖 **AI-Powered Conversations** - Uses GPT-4o-mini for intelligent replies
- 🌐 **Multilingual Support** - Chat in **English** and **हिंदी**
- 🎤 **Voice Input** - Speak instead of typing using Speech Recognition
- 🔊 **Text-to-Speech** - JARVIS speaks responses back to you in selected language
- 🗣️ **Wake Word Detection** - Say "JARVIS" or "जार्विस" to activate hands-free
- 🧠 **Smart Send** - Automatically detects commands like “send” or “भेजो”
- 💬 **Chat History** - View and manage previous conversations
- ⚙️ **Custom Settings** - Change language, theme, personality, and voice options
- 🔐 **Secure Auth** - Login system powered by Convex Auth
- 📱 **Responsive UI** - Works seamlessly on mobile, tablet, and desktop

---
=> Used app bilder models and LLM models like chatgpt, trae, chef by convex etc.
---
## 🎮 Demo

Live Demo: http://localhost:5174/

> ✅ Interact with JARVIS in real time with voice and chat!

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend/LLM**: GPT-4o-mini / Gemini API fallback
- **Voice Recognition**: Web Speech API (SpeechRecognition)
- **Text-to-Speech**: SpeechSynthesis API
- **Wake Word Detection**: Custom JS Engine with language detection
- **Auth & Storage**: Convex.dev
- **Deployment**: Vercel / Netlify

---

## 📦 Installation

```bash
git clone https://github.com/aryanpyx/jarvis-ai.git
cd jarvis-ai
npm install
npm run dev

* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
