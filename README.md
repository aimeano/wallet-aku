# Wallet Aku

A modern personal finance and expense tracking app built with React, TypeScript, Tailwind, and Supabase.

This project is fully **vibe coded** using AI-assisted tools like Lovable. I used AI heavily for generating code, UI ideas, debugging, and helping me ship the app faster while learning along the way.

---

## About The Project

Wallet Aku is a lightweight finance tracker app that helps users:

* Track expenses and income
* Monitor balances
* Manage recurring transactions
* Use a clean mobile-friendly UI
* Store data with Supabase

The app was built mainly for personal use, but also became a way for me to learn how modern web apps are actually built and deployed.

---

## Why I Built This

Most budget tracking apps nowadays require a monthly subscription just to use basic features. I didnt really want to pay for another subscription, so I decided to make my own free app for myself.

I also wanted to experiment with vibe coding and see how far I could go using AI tools to build a real product.

---

## What I Learned

Even though this project is fully vibe coded, I still learned alot from building and maintaining it.

### Frontend Development

* React component structure
* TypeScript basics
* Tailwind CSS
* Responsive UI design
* Handling forms and state

### Backend & Database

* Supabase integration
* Authentication flows
* Database tables and relationships
* Environment variables and secrets
* API connections

### Deployment & GitHub

* Git workflows
* Managing `.env` files securely
* Deploying apps
* Fixing broken builds
* Debugging production issues

### AI-Assisted Development

* Writing better prompts
* Understanding generated code
* Iterating quickly
* Using AI as a development partner instead of just copying code
* Learning through experimentation

---

## Tech Stack

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Supabase
* Lovable

---

## Getting Started

### Clone the repo

```bash id="0gq0yk"
git clone https://github.com/aimeano/wallet-aku.git
cd wallet-aku
```

### Install dependencies

```bash id="oz3nbo"
npm install
```

### Create environment variables

Create a `.env` file:

```env id="bpkihd"
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Run locally

```bash id="kq5q63"
npm run dev
```

---

## Environment Variables

This project uses environment variables for Supabase credentials.

The `.env` file is intentionally excluded from GitHub because secrets shouldnt be public. Learned that one the hard way.

---

## Disclaimer

This is a fully **vibe coded** project.

A large portion of the codebase, UI generation, debugging, and implementation was assisted by AI tools. This repository is more about learning, experimenting, and shipping ideas fast rather than showing perfect software engineering practices.

---

## Future Improvements

* Better analytics
* Budgeting system
* Offline support
* Export/import features
* Better accessibility
* More polished mobile UX

---

## Lessons From Building Publicly

One of the biggest things I learned from this project is that you can learn very fast by actually building things instead of only consuming tutorials.

Even with AI helping alot, you still need:

* problem solving
* debugging
* decision making
* testing
* patience when things randomly break

---

## License

MIT
