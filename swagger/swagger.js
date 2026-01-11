// const swaggerJSDoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");

// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Express API with Swagger",
//       version: "1.0.0",
//     },
//   },
//   apis: ["./routes/*.js"],
// };

// const swaggerSpec = swaggerJSDoc(options);

// const setupSwagger = (app) => {
//   app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// };

// module.exports = setupSwagger;










const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "Football App API",
//       version: "1.0.0",
//       description: "Football booking backend API",
//     },
//     servers: [
//       {
//         url: "https://scenic-noncomprehendible-garrison.ngrok-free.dev",
//       },
//     ],
//   },
//   apis: ["./routes/*.js"],
// };


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Football App API",
      version: "1.0.0",
      description: "Football booking backend API",
    },
    servers: [
      {
        // Oxirida "/" belgisi bo'lmasligiga e'tibor bering
        url: "https://gf-server-backend-1.onrender.com",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
