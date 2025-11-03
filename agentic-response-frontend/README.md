# Agentic Response

A terminal-style chat interface with real-time streaming logs. Built with React, TypeScript, and Tailwind CSS.

## Features

- Real-time chat interface with message streaming
- Live terminal logs showing server events
- Resizable terminal panel
- Collapsible terminal view
- Message history persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm) to install)
- Backend API running on `localhost:8081`

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Build

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/      # React components
│   ├── ui/         # UI components (shadcn/ui)
│   └── ...
├── pages/          # Page components
├── hooks/          # Custom React hooks
└── lib/            # Utility functions
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Router** - Routing
- **TanStack Query** - Data fetching

## Development

The project uses:
- ESLint for code linting
- TypeScript for type checking
- Vite for fast development builds

Run `npm run lint` to check for linting errors.
