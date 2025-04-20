# Finance Manager UI

This is the frontend UI for the Finance Manager application, built with Ionic Angular.

## Directory Structure

```
ui/
├── src/
│   ├── app/             # Angular components
│   ├── assets/          # Static assets
│   ├── environments/    # Environment configurations
│   └── ...
├── Dockerfile           # Docker configuration
├── package.json         # NPM dependencies
└── ...
```

## Environment Configuration

The API endpoints are configured in the `environments/environment.ts` file. In a Docker environment, these will be overridden to connect to the containerized backend services.

## Docker Setup

### Building the Docker Image

To build the Docker image for the UI:

```bash
cd ui
docker build -t finance-manager-ui .
```

### Running the Docker Container

To run the UI container:

```bash
cd 
```

This will start the Ionic development server on port 8100, accessible at http://localhost:8100.

### Environment Variables

The following environment variables can be passed to the container:

- `API_ENDPOINT`: Base URL for the backend API (default: http://localhost:5001)

Example with custom API endpoint:

```bash
docker run -d --name finance-ui -p 8100:8100 finance-manager-ui
```

## Development Without Docker

### Prerequisites

- Node.js (version 16 or higher)
- NPM (version 8 or higher)
- Ionic CLI (`npm install -g @ionic/cli`)

### Installation

```bash
cd ui
npm install
```

### Running the Development Server

```bash
ionic serve
```

For external access (same as in Docker):

```bash
ionic serve --external
```

## Updating API Endpoints

If you need to update the API endpoints to point to different backend services, modify the `environments/environment.ts` file:

```typescript
export const environment = {
  production: false,
  apiEndpoints: {
    gatewayService: "http://localhost:5001",
    accountService: "http://localhost:5003",
    transactionService: "http://localhost:5004",
    statementUploaderService: "http://localhost:5002",
  },
};
```

## Building for Production

```bash
ionic build --prod
```

This will generate production-ready static files in the `www` directory.