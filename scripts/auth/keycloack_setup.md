mkdir -p ~/keycloak-certs
cd ~/keycloak-certs

# Generate a private key

openssl genpkey -algorithm RSA -out key.pem

# Generate a certificate signing request

openssl req -new -key key.pem -out cert.csr

# Generate a self-signed certificate (valid for 365 days)

openssl x509 -req -days 365 -in cert.csr -signkey key.pem -out cert.pem

You'll now have key.pem (private key) and cert.pem (certificate).

Step 2: Convert to PKCS12 format
Keycloak uses Java keystores, so we need to convert the certificate into a .p12 (PKCS12) keystore.

openssl pkcs12 -export \
 -inkey key.pem \
 -in cert.pem \
 -out keycloak.p12 \
 -name keycloak \
 -password pass:changeit

🔑 Replace changeit with a password of your choice (but remember it for the next step).

Step 3: Import the keystore into Keycloak
Move the keycloak.p12 file somewhere accessible (e.g., inside your Keycloak project folder).

Now start Keycloak with the appropriate environment variables or CLI options:

KEYCLOAK_HOME/bin/kc.sh start \
 --https-key-store-file=PATH/TO/keycloak.p12 \
 --https-key-store-password=changeit

Or set environment variables:

export KC_HTTPS_KEY_STORE_FILE=PATH/TO/keycloak.p12
export KC_HTTPS_KEY_STORE_PASSWORD=changeit

KEYCLOAK_HOME/bin/kc.sh start

Optional: Trust the certificate (to avoid browser warnings)

To avoid "not secure" warnings in your browser:

Open Keychain Access.
Drag cert.pem into System → Certificates.
Double-click it, open Trust, and set “When using this certificate” to “Always Trust”.
Restart your browser.

sh /Users/rishighai/Desktop/softwares/keycloak-26.2.0/bin/kc.sh start --https-key-store-file=/Users/rishighai/keycloak-certs/keycloak.p12 \
 --https-key-store-password=changeit --hostname=localhost

username: rishighai
password: admin

## ---------------------------------------

You'll need to set up Keycloak with proper configuration:

Create a new realm called "finance-manager"
Create a client:

Client ID: finance-manager-client
Access Type: confidential
Valid Redirect URIs: http://localhost:5000/login/oauth2/code/keycloak
Web Origins: http://localhost:5000, http://localhost:8100
Note the client secret after creating the client

Create the following roles:

account_read
account_write
transaction_read
transaction_write

Configure User Registration:

Go to Realm Settings -> Login
Enable "User Registration"
Enable "Email as Username"
Enable "Verify Email"

Configure Email Settings:

Go to Realm Settings -> Email
Configure SMTP settings for email verification

Configure Authentication Flow:

Go to Authentication -> Flows
Edit the "browser" flow
Make sure "Verify Email" is required
