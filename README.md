# EV Charging Station Finder

A web-based application that enables electric vehicle owners to locate nearby charging stations, reserve parking slots, manage charging sessions, and complete payments.

## Project Structure

```
src/
├── components/       # React UI components
├── services/         # Business logic services
├── models/           # TypeScript interfaces and types
├── utils/            # Helper functions and utilities
└── test/             # Testing setup and generators
```

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library + fast-check
- **Linting**: ESLint with TypeScript support

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

## Data Models

The application uses the following core data models:

- **Coordinates**: Geographic location data
- **Station**: Charging station or petrol pump information
- **ParkingSlot**: Individual parking space with charging capability
- **ChargingSession**: Active or completed charging session
- **PaymentTransaction**: Payment information and status
- **Receipt**: Receipt document data

All models are defined in `src/models/` with full TypeScript type safety.

## Development Guidelines

- TypeScript strict mode is enabled
- All code must pass ESLint checks
- Property-based tests use fast-check with minimum 100 iterations
- Unit tests focus on specific examples and edge cases
- Target code coverage: 80% minimum

## License

MIT
