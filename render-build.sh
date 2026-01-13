#!/usr/bin/env bash
set -e

echo "Installing Chromium..."
apt-get update
apt-get install -y chromium

echo "Installing node packages..."
npm install

echo "Build finished!"
