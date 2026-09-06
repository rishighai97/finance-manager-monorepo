export JAVA_HOME=/home/rishi/.jdks/azul-23.0.2
export PATH=$JAVA_HOME/bin:$PATH
cd /home/rishi/Desktop/finance-manager-application/transaction-service-1
./gradlew bootrun --args='--spring.profiles.active=local'

