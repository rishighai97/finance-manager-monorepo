# Finance Manager - Environment Configuration

This project is configured to support multiple environments:

- **local**: Default development environment (`http://localhost:5002/5003/5004`)
- **dev**: Development server environment
- **qa**: Quality Assurance environment
- **uat**: User Acceptance Testing environment
- **prod**: Production environment

## Environment Setup

The application uses Angular's environment configuration system to manage different environments. The environment files are located in `src/environments/`:

- `environment.ts` - Default environment (local)
- `environment.dev.ts` - Development environment
- `environment.qa.ts` - QA environment
- `environment.uat.ts` - UAT environment
- `environment.prod.ts` - Production environment

## Running the Application with Different Environments

Use the following npm scripts to run the application with specific environment configurations:

```bash
# Local environment (default)
npm start

# Development environment
npm run start:dev

# QA environment
npm run start:qa

# UAT environment
npm run start:uat

# Production environment
npm run start:prod
ionic serve --external
```

## Building the Application for Different Environments

Use the following npm scripts to build the application with specific environment configurations:

```bash
# Local environment (default)
npm run build

# Development environment
npm run build:dev

# QA environment
npm run build:qa

# UAT environment
npm run build:uat

# Production environment
npm run build:prod
```

## Environment Configuration

The environment configuration files include the following settings:

- `production`: Boolean flag indicating if it's a production build
- `name`: Environment name for identification
- `apiEndpoints`: Base URLs for various microservices
  - `accountService`: URL for account management service
  - `transactionService`: URL for transaction management service
  - `statementUploaderService`: URL for statement uploading service

## Accessing Environment Configuration

You can access the environment configuration in your Angular components and services:

```typescript
import { environment } from "src/environments/environment";

console.log(`Current environment: ${environment.name}`);
console.log(`Account Service URL: ${environment.apiEndpoints.accountService}`);
```

ionic build ios
npx cap open ios
chmod 777 -R ios
pod install
ionic build, then run npx cap copy ios
