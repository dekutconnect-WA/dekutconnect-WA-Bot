module.exports = {
  apps: [{
    name: "dekutconnect-session",
    script: "index.js",
    cwd: "/root/web/dekutconnect-session",
    env: {
      PORT: 6898,
      DATAASE_URL: ""
    }
  }]
};
