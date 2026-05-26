# Héméa

Héméa is a React Native (Expo) application for tracking biological analyses results from PDF medical reports.

## Features

- Upload PDF lab reports
- OCR to automatically extract values from reports
- Track and visualize values over time
- Local database storage on the device

## Project Structure

The project follows a hexagonal architecture:

- **Domain**: Contains the core business entities and logic
- **Ports**: Interfaces that define the interactions with external systems
- **Adapters**: Implementations of the ports interfaces
- **Application**: Contains the use cases of the application
- **Infrastructure**: Database and external service configurations
- **Presentation**: UI components, screens, and navigation

## Setup and Installation

1. Install dependencies:

```bash
npm install
```

2. Start the application:

```bash
npm start
```

Then follow Expo instructions to run on iOS simulator or physical device.

## Running on iOS Simulator

### Start the iPhone Simulator

First, make sure the iOS Simulator is running:

```bash
open -a Simulator
```

Or boot it via command line:

```bash
xcrun simctl boot "iPhone 16"
```

### Start the App on iPhone Simulator

With the simulator running and Expo dev server started (`npm start`), press:

```
i
```

in the Expo CLI to launch the app on iOS.

Alternatively, run directly in one command:

```bash
npx expo start --ios
```

Or specify a specific simulator device:

```bash
npx expo run:ios --device "iPhone 16"
```

### List Available Simulators

To see all available iOS simulators:

```bash
xcrun simctl list devices
```

## Testing

Tests are located in `__tests__` folders next to the files they test. Run tests with:

```bash
npm test
```

## Mutation Testing

Mutation testing helps measure the effectiveness of test cases by introducing small changes (mutations) to the code and checking if tests can detect them.

Run mutation tests on core domain and application code:

```bash
npm run mutation
```

Run mutation tests on a specific file or pattern:

```bash
npm run mutation:file "src/domain/entities/BiologicalAnalysis.ts"
```

Mutation test results will be available in the `reports/mutation/html` directory. Open `index.html` to view a detailed report.

The mutation score indicates the percentage of mutations that were caught by tests:

- 💚 High (>80%): Excellent test coverage
- 🟡 Medium (60-80%): Good test coverage
- 🔴 Low (<60%): Tests need improvement

## Technologies Used

- React Native with Expo
- TypeScript
- Expo SQLite for local storage
- React Navigation for navigation
- Mistral API for OCR processing
- React Native Chart Kit for visualizations

## Development

This application demonstrates a clean architecture approach to mobile development:

- Separation of concerns with hexagonal architecture
- Dependency injection for services and repositories
- Clean interfaces between different layers

## Deploy on Iphone

List all devices

```bash
xcrun xctrace list devices
```

Prebuild & deploy

```bash
npx expo prebuild && npx expo run:ios --device "00XXXXXX-XXXXXXXXXXXX1E" --configuration Release
```

## License

MIT
