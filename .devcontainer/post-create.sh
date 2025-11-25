#!/bin/bash

set -e

# Init project
nvm install
nvm use
nvm alias default $(node --version)
npm i -g npm@latest
npm config set --location project registry=https://bin.swisscom.com/artifactory/api/npm/apps-team-npm-virtual
npm i

echo "registry=https://bin.swisscom.com/artifactory/api/npm/apps-team-npm-virtual" >> .npmrc