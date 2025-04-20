FROM azul/zulu-openjdk:17-jre

WORKDIR /app

# Install Gradle
ENV GRADLE_VERSION=8.4
ENV GRADLE_HOME=/opt/gradle
ENV PATH=${GRADLE_HOME}/bin:${PATH}

RUN apt-get update && \
    apt-get install -y wget unzip && \
    wget -q https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip && \
    mkdir -p ${GRADLE_HOME} && \
    unzip -q gradle-${GRADLE_VERSION}-bin.zip -d /opt && \
    mv /opt/gradle-${GRADLE_VERSION}/* ${GRADLE_HOME} && \
    rm gradle-${GRADLE_VERSION}-bin.zip && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the source code
COPY . .

# Create Gradle wrapper if not exists (optional)
RUN if [ ! -f gradlew ]; then gradle wrapper; fi

# Cache Gradle dependencies for faster builds
RUN ./gradlew --no-daemon dependencies

# Expose the port the app runs on
EXPOSE 5001

# Run the application with Gradle
CMD ["./gradlew", "--no-daemon", "bootRun"]