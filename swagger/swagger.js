const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Go For Fun - Football App API",
      version: "1.0.0",
      description: "Go For Fun futbol ilovasi backend API hujjatlari",
    },
    servers: [
      {
        url: process.env.RAILWAY_PUBLIC_DOMAIN
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : `http://localhost:${process.env.PORT || 5577}`,
        description: process.env.RAILWAY_PUBLIC_DOMAIN
          ? "Railway Server"
          : "Local Server",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};