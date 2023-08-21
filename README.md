# Node.js CLI - API Endpoint Generator

## Overview

Welcome to the Node.js CLI, a robust tool created to simplify the process of building API endpoints in Node.js applications. This CLI automates the endpoint generation for GET, POST, PUT, and PATCH methods, while also handling crucial components like controllers, routers, and services.

## Features

- Quickly and effortlessly generate API endpoints.
- Support for GET, POST, PUT, and PATCH methods.
- Automated setup of controllers, routers, and services.
- Enhance your development efficiency by minimizing manual configuration.

## Getting Started

### Usage

To utilize this CLI tool, follow these steps:

1. Create a JavaScript file, e.g., `script.js`, in your project directory.
2. Add the following code to `script.js`:

```javascript
import { ExpressCLI } from "express_boilerplate_cli";

const main = async () => {
  await ExpressCLI();
};

main();
```

3. Run the script using the following command:

```sh
node script.js
```

This will generate Express.js boilerplate code within your project directory.

### License

You can contribute to it by visiting [the GitHub repository](https://github.com/Bipin7giri/NodeJS_cli.git).

Feel free to collaborate and improve this powerful Node.js CLI for API endpoint generation.