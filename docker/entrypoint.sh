#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs

if [ ! -f "$CERT_DIR/cert.pem" ] || [ ! -f "$CERT_DIR/key.pem" ]; then
    echo "[ssl] No certificate found — generating self-signed certificate..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 3650 \
        -newkey rsa:2048 \
        -keyout "$CERT_DIR/key.pem" \
        -out    "$CERT_DIR/cert.pem" \
        -subj   "/C=US/ST=./L=./O=RedTeamPlatform/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
        2>/dev/null
    echo "[ssl] Self-signed certificate generated (valid 10 years)."
    echo "[ssl] To use a real certificate, mount cert.pem and key.pem at $CERT_DIR"
else
    echo "[ssl] Certificate found at $CERT_DIR — skipping generation."
fi

exec nginx -g 'daemon off;'
