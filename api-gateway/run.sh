#!/bin/bash

# Usage: ./run.sh [prod|local] [--detach]

# Default values
DETACH_MODE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    prod|local)
      PROFILE=$arg
      ;;
    --detach)
      DETACH_MODE=true
      ;;
    *)
      echo "Invalid argument: $arg"
      echo "Usage: $0 [prod|local] [--detach]"
      exit 1
      ;;
  esac
done

# Ensure profile is set
if [ -z "$PROFILE" ]; then
  echo "Usage: $0 [prod|local] [--detach]"
  exit 1
fi

# Set Java home
export JAVA_HOME=~/openjdk-21.0.1
export PATH=$JAVA_HOME/bin:$PATH

# Build the Docker image
./gradlew bootBuildImage --imageName finance-manager-application/api-gateway

# Determine Docker run mode
DOCKER_RUN_OPTS="-p 5001:5001 -e SPRING_PROFILES_ACTIVE=$PROFILE"
if [ "$DETACH_MODE" = true ]; then
  DOCKER_RUN_OPTS="$DOCKER_RUN_OPTS -d"
fi

# Run Docker container
#docker run $DOCKER_RUN_OPTS finance-manager-application/api-gateway:latest --restart=always
