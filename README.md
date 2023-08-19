# NodeJS CLI - API Endpoint Generator

## Overview

Welcome to the NodeJS CLI - a powerful tool designed to simplify the process of creating API endpoints in Node.js applications. This CLI automates the generation of endpoints, including GET, POST, PUT, and PATCH methods, along with essential components like controllers, routers, and services.

## Features

- Generate API endpoints quickly and effortlessly.
- Support for GET, POST, PUT, and PATCH methods.
- Automatic setup of controllers, routers, and services.
- Boost your development efficiency by reducing manual configuration.

## Getting Started

## Usage

To use the CLI tool, create a JavaScript file (e.g., `script.js`) and add the following code:

```javascript
import { ExpressCLI } from "express_boilerplate_cli";

const main = async () => {
  await ExpressCLI();
};

main();
```

Run the script using:

```sh
node script.js
```

This will generate Express.js boilerplate code in your project directory.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
