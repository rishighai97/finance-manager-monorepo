docker run --network="host" --name mykeycloak -p 8500:8443 -p 8501:9000 \
        -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=change_me \
        mykeycloak \
        start --optimized --hostname=localhost