module.exports = {
  apps: [
    {
      name: "service-utils",
      exec_mode: "fork",
      instances: "1",
      script: "./dist/src/main.js",
      autorestart: true,
    },
  ],
}
