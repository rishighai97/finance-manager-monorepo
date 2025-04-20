# Gateway Service

This is the API Gateway service for the Finance Manager application, built with Spring Boot.

## Directory Structure

```
api_gateway/
├── src/
│   ├── main/
│   │   ├── java/               # Java source code
│   │   ├── resources/          # Application properties and resources
│   │   └── ...
│   └── test/                   # Test classes
├── Dockerfile                  # Docker configuration
├── build.gradle                # Gradle build file
└── ...
```

## Features

- User authentication and authorization
- API Gateway for other microservices
- Session management

## API Endpoints

- `/auth/signup` - Create a new user account
- `/auth/login` - Authenticate a user
- `/auth/logout` - Logout a user session

## Docker Setup

### Building the Docker Image

To build the Docker image for the Gateway Service:

```bash
cd api_gateway
docker build -t finance-manager-api-gateway  .
```

### Running the Docker Container

To run the Gateway Service container:

```bash
docker run finance-manager-api-gateway -p 5001:5001 finance-manager-api-gateway 


docker run -d --name finance-manager-api-gateway -p 5001:5001 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/finance_manager \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=admin \
  finance-manager-api-gateway
```

This will start the Gateway Service on port 5001, accessible at http://localhost:5001.

### Environment Variables

The following environment variables can be passed to the container:

- `SPRING_PROFILES_ACTIVE`: Spring profile to activate (default: prod)
- `SPRING_DATASOURCE_URL`: JDBC URL for the database
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password

## Development Without Docker

### Prerequisites

- JDK 17+
- Gradle 7.x+
- PostgreSQL database

### Building the Application

```bash
./gradlew build
```

### Running the Application

```bash
./gradlew bootRun
```

Or with a specific profile:

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

## Configuration

The application configuration is in `src/main/resources/application.properties`. For local development, you can override these settings in `application-local.properties`.

## Database Setup

The service connects to a PostgreSQL database. Make sure the database is set up before starting the service. In a Docker environment, the database connection is configured using environment variables.