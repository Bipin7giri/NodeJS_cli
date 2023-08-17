

import express from 'express';
import apiRouter from './src/api/index.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const app = express();
app.use(express.json());
// Use the API router
app.use('/api', apiRouter);
const project = process.env?.PROJECT;
const swaggerDefinition = {
  info: {
    title: "Express CLI",
    version: "1.0.0",
    description: "Endpoints to test the user registration routes",
  },
  schemes: project === "DEV" ? ["http"] : ["https"],
  host: project === "DEV" ? "localhost:5000" : "localhost:3000",
  components: {
    schemas: {},
  },
  basePath: "/api",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "authorization",
      scheme: "bearer",
      in: "header",
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  // import swaggerDefinitions
  swaggerDefinition,
  // path to the API docs
  apis: ["./src/routers/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/", swaggerUi.serve, swaggerUi.setup(specs));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server is running on port 3000');
});

