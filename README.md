# Mazen Records' Frontend

![Mazen Records' Logo](https://github.com/noctisdark/mazenrecords-front/assets/88320615/a8169ead-d999-4b89-8575-8bf0729868be)

## Overview
Mazen Records' Frontend is a lightweight application designed for managing TV repair visits. It features offline mode support, allowing users to operate the application without an internet connection, and seamless synchronization with the server using the `updatedAt` timestamp property.

This project was a personal endeavor developed in the autumn of 2023 during a period of unemployment.

## Features
- **Offline Mode**: Utilize the application seamlessly even when offline, powered by storage in IndexedDB. Updates are sent to server when the network is available.
- **Server Synchronization**: Automatically sync data with the server for up-to-date information.
- **Rich Text Editor**: Enhance your visit records with rich text content.

## Installation
- Clone the repository:
  ```bash
  git clone git@github.com:noctisdark/mazenrecords-front.git
  ```
- Navigate to the project directory:
  ```bash
  cd mazenrecords-front
  ```
- Install dependencies:
  ```bash
  bun install
  ```
- Run in development mode (Make sure to set required environment variables; refer to the [Mazen Records SST Repo](https://github.com/noctisdark/mazenrecords-sst) for details):
  ```bash
  bunx vite
  ```
- Build the project:
  ```bash
  bunx vite build
  ```
- Build the Android project (Requires npx):
  ```bash
  bunx vite build && npx cap sync
  ```


## Usage
Login: Log in using your credentials with Cognito.
Dashboard: Explore real-time visit data, and easily add, edit, or delete visit records with offline support.

| **Visits Table** | **Add a Visit** | **Checkout a Visit** | **Autocomplete Brands** |
|-------------------------|-------------------------|-------------------------|-------------------------|
![overview](https://github.com/noctisdark/mazenrecords-front/assets/88320615/b9f449cf-c512-443d-88dc-2cc1b7dd494b) | ![Visits](https://github.com/noctisdark/mazenrecords-front/assets/88320615/6a98b68e-3800-430b-bc61-166ff7db42f4) | ![checkout](https://github.com/noctisdark/mazenrecords-front/assets/88320615/d9d029da-fd48-4df6-817d-dd3e562af26d) | ![image](https://github.com/noctisdark/mazenrecords-front/assets/88320615/3fa4099c-d6bf-45ad-9162-9568094110f5)


## License
This project is licensed under the MIT License.
