#!/bin/bash

# Script to install self-signed certificate in browser trust store

CERT_FILE="Backend/certs/cert.pem"
CERT_NAME="ft_transcendence_local"

echo "Installing self-signed certificate for local development..."

# For Firefox
if command -v certutil &> /dev/null; then
    echo "Installing certificate in Firefox..."
    # Find Firefox profile directory
    FIREFOX_PROFILE_DIR=$(find ~/.mozilla/firefox -name "*.default*" | head -1)
    if [ -n "$FIREFOX_PROFILE_DIR" ]; then
        certutil -A -n "$CERT_NAME" -t "TCu,Cu,Tu" -i "$CERT_FILE" -d "$FIREFOX_PROFILE_DIR"
        echo "Certificate installed in Firefox profile: $FIREFOX_PROFILE_DIR"
    else
        echo "Firefox profile not found"
    fi
fi

# For Chrome/Chromium (Linux)
if command -v pk12util &> /dev/null; then
    echo "Installing certificate in Chrome/Chromium..."
    # Convert PEM to P12 format
    openssl pkcs12 -export -out /tmp/cert.p12 -in "$CERT_FILE" -inkey Backend/certs/key.pem -passout pass:
    
    # Add to Chrome's certificate store
    certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "$CERT_NAME" -i "$CERT_FILE"
    echo "Certificate installed in Chrome/Chromium"
fi

# For system-wide trust (requires sudo)
echo "To install system-wide (requires sudo):"
echo "sudo cp $CERT_FILE /usr/local/share/ca-certificates/ft_transcendence.crt"
echo "sudo update-ca-certificates"

echo ""
echo "After installing, restart your browser and try accessing the application again."
echo "If the script doesn't work, manually navigate to https://c1r9s1.42porto.com:3000 and accept the certificate."
