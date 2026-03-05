module.exports = {
  apps: [
    {
      name: "memoku-alarm",
      exec_mode: "fork",
      instances: "1",
      script: "./dist/src/main.js",
      autorestart: true,
    },
  ],
}
