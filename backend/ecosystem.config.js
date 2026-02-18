module.exports = {
  apps: [{
    name: 'lexdoc-api',
    script: 'src/server.js',
    cwd: '/home/lexdoc-dev/backend',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: 4000 },
    error_file: '/var/log/lexdoc/error.log',
    out_file: '/var/log/lexdoc/out.log',
    time: true,
    max_memory_restart: '500M',
    autorestart: true
  }]
};
