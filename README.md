# LaBIReact Mobile

LaBIReact Mobile is a React Native (Expo) application for tracking biological analyses results from PDF medical reports.

## Features

- Upload PDF lab reports
- OCR to automatically extract CRP values from reports
- Track and visualize CRP values over time
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

2. Configure your DeepSeek API key:
Replace `YOUR_API_KEY_HERE` in `App.tsx` with your actual DeepSeek API key.

3. Start the application:
```bash
npm start
```

Then follow Expo instructions to run on iOS simulator or physical device.

## Testing

Tests are located in `__test__` folders next to the files they test. Run tests with:

```bash
npm test
```

## Technologies Used

- React Native with Expo
- TypeScript
- Expo SQLite for local storage
- React Navigation for navigation
- DeepSeek API for OCR processing
- React Native Chart Kit for visualizations

## Development

This application demonstrates a clean architecture approach to mobile development:

- Separation of concerns with hexagonal architecture
- Dependency injection for services and repositories
- Clean interfaces between different layers

## License

MIT 