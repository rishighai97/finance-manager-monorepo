export JAVA_HOME=/home/rishi/.jdks/openjdk-21.0.1
export PATH=$JAVA_HOME/bin:$PATH
cd /home/rishi/Desktop/finance-manager-application/account-service
./gradlew bootrun --args='--spring.profiles.active=local'
