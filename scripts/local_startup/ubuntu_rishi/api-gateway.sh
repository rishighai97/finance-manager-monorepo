export JAVA_HOME=/home/rishi/.jdks/azul-23.0.2
export PATH=$JAVA_HOME/bin:$PATH
cd /home/rishi/Desktop/finance-manager-application/api-gateway
./gradlew bootrun --args='--spring.profiles.active=local'
