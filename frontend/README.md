# Kayak Frontend

Modern, beautiful React frontend for the Kayak Travel Booking System.

## Features

- ✨ Modern, trendy UI design inspired by official Kayak
- 🎨 Tailwind CSS for styling
- 🎭 Smooth animations with Framer Motion
- 📱 Fully responsive design
- 🔍 Advanced search forms for Flights, Hotels, and Cars
- 📅 Date picker integration
- 🎯 Clean component architecture

## Tech Stack

- React 18
- Vite (build tool)
- Tailwind CSS
- Framer Motion (animations)
- React Router
- React Icons
- React DatePicker

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── Header.jsx  # Navigation header
│   │   ├── Hero.jsx    # Hero section with search
│   │   └── Footer.jsx # Footer with links
│   ├── pages/          # Page components
│   │   └── Home.jsx    # Home page
│   ├── store/          # Redux store (to be implemented)
│   ├── services/       # API services (to be implemented)
│   ├── styles/         # Global styles
│   └── App.jsx         # Main app component
├── public/             # Static assets
└── package.json
```

## Components

### Header
- Navigation tabs (Flights, Hotels, Cars)
- User actions (Sign in, Help)
- Responsive mobile menu

### Hero
- Large search interface
- Tab-based search forms
- Date pickers
- Location inputs
- Beautiful gradient background with image overlay

### Footer
- Company links
- Social media links
- Trust badges
- Legal links

## Styling

The project uses Tailwind CSS with custom Kayak brand colors:

- `kayak-blue`: #0064E5
- `kayak-blue-dark`: #0052B8
- `kayak-blue-light`: #E6F2FF
- `kayak-orange`: #FF5A5F

Custom utility classes:
- `.btn-primary`: Primary button style
- `.btn-secondary`: Secondary button style
- `.input-field`: Input field style
- `.card`: Card component style

## Next Steps

- [ ] Connect to backend API
- [ ] Implement Redux for state management
- [ ] Add search results page
- [ ] Add booking flow
- [ ] Add user authentication
- [ ] Add admin dashboard

