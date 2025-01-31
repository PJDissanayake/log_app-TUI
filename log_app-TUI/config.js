/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * config.js
 */
const blessed = require('blessed');
const { spawn } = require('child_process');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const screen = require('./screen');
const os = require('os');
const readline = require('readline');

const configBox = blessed.list({
  label: ' Configuration ',
  tags: true,
  width: '60%',
  height: '40%',
  top: 'center',
  left: 'center',
  border: { type: 'line' },
  style: {
    label: { bold: true },
    border: { fg: 'yellow' },
    selected: { bg: 'yellow', fg: 'black' },
  },
  items: ['Get Configuration', 'Set Configuration','Edit file'],
  keys: true,
  vi: true,
  mouse: true,
  hidden: true, // Hidden by default
});

// Function to handle Get Configuration
const handleGetConfig = () => {
  const { getIp, getToken } = require('./log_tui');
  const chargerIp = getIp();
  const token = getToken();

  // Get the current date and time
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.T]/g, '_').slice(0, 15);
  const curlGetConfig = `curl -X 'GET' \
'http://${chargerIp}/api/configuration' \
-H 'accept: application/octet-stream' \
-H 'Authorization: Bearer ${token}' --output ${os.homedir()}/log_app-TUI/config/config_${timestamp}`;


  exec(curlGetConfig, (error, stdout) => {
    //console.log(curlGetConfig);
    if (error) {
      readline.cursorTo(process.stdout, 0, 0);
      console.error('Failed to fetch configuration:', /*error*/);
    } else {
      readline.cursorTo(process.stdout, 0, 0);
      console.log(`Configuration recorded: ${stdout.trim()}`);
    }
    configBox.focus();
    screen.render();
  });
};

// Function to handle Set Configuration
const handleSetConfig = () => {
  const configDir = path.resolve(process.env.HOME, 'log_app-TUI/config');
  fs.readdir(configDir, (err, files) => {
    if (err) {
      readline.cursorTo(process.stdout, 0, 0);
      console.error('Failed to read directory:', err);
      return;
    }

    const configFiles = files.filter((file) => file.includes('config'));
    if (configFiles.length === 0) {
      readline.cursorTo(process.stdout, 0, 0);
      console.log('No configuration files found in the config directory.');
      setTimeout(() => {
        configBox.focus();
        screen.render();
      }, 2000);
      return;
    }

    const configFileBox = blessed.list({
      label: ' Select Configuration File ',
      tags: true,
      width: '50%',
      height: '30%',
      top: 'center',
      left: 'center',
      border: { type: 'line' },
      style: {
        label: { bold: true },
        border: { fg: 'cyan' },
        selected: { bg: 'cyan', fg: 'black' },
      },
      items: configFiles,
      keys: true,
      vi: true,
      mouse: true,
    });

    configFileBox.on('select', (item) => {
      const selectedFile = item.getText().trim();
      readline.cursorTo(process.stdout, 0, 0);
      console.log(`Selected configuration file: ${selectedFile}`);

      const { getIp, getToken } = require('./log_tui');
      const chargerIp = getIp();
      const token = getToken();

      const curlSetConfig = `curl -X 'POST' \
'http://${chargerIp}/api/configuration' \
-H 'accept: */*' \
-H 'Authorization: Bearer ${token}' \
-H 'Content-Type: application/octet-stream' \
--data-binary "@${os.homedir()}/log_app-TUI/config/${selectedFile}"`;

      exec(curlSetConfig, (error, stdout) => {
        if (error) {
          readline.cursorTo(process.stdout, 0, 0);
          console.error('Failed to set configuration:', /*error*/);
        } else {
          readline.cursorTo(process.stdout, 0, 0);
          console.log(`Set configuration response: ${stdout.trim()}`);
        }
        screen.remove(configFileBox);
        configBox.focus();
        screen.render();
      });
    });

    screen.append(configFileBox);
    configFileBox.focus();
    screen.render();
  });
};

// Function to handle Edit File
/*const handleEditFile = () => {
  const configDir = path.resolve(process.env.HOME, 'log_app-TUI/config');
  fs.readdir(configDir, (err, files) => {
    if (err) {
      readline.cursorTo(process.stdout, 0, 0);
      console.error('Failed to read directory:', err);
      return;
    }

    const configFiles = files.filter((file) => file.includes('config'));
    if (configFiles.length === 0) {
      readline.cursorTo(process.stdout, 0, 0);
      console.log('No configuration files found in the config directory.');
      setTimeout(() => {
        configBox.focus();
        screen.render();
      }, 2000);
      return;
    }

    const fileSelectionBox = blessed.list({
      label: ' Select File to Edit ',
      tags: true,
      width: '50%',
      height: '30%',
      top: 'center',
      left: 'center',
      border: { type: 'line' },
      style: {
        label: { bold: true },
        border: { fg: 'magenta' },
        selected: { bg: 'magenta', fg: 'black' },
      },
      items: configFiles,
      keys: true,
      vi: true,
      mouse: true,
    });

    fileSelectionBox.on('select', (item) => {
      const selectedFile = item.getText().trim();
      const filePath = path.join(configDir, selectedFile);
      fileSelectionBox.hide();
      configBox.hide();
      screen.render();
      screen.unkey(['left', 'right']);
      const vi = spawn('vi', [filePath], { stdio: 'inherit' });
      vi.on('exit', () => {
        process.stdin.setRawMode(true);
        console.clear();
        process.stdout.write('\x1b[3J\x1b[H\x1b[2J');
        readline.cursorTo(process.stdout, 0, 0);
        screen.key(['left', 'right'], () => {
          screen.children.forEach((child) => {
            if (child.options.label?.includes('Select Configuration File')) {
              screen.remove(child);
            }
          });
          screen.render();
        });
        screen.append(configBox);
        configBox.show();
        configBox.focus();
        setTimeout(() => {
          process.stdin.emit('keypress');
          screen.render();
        }, 100);
      });

      screen.remove(fileSelectionBox);
    });

    screen.append(fileSelectionBox);
    fileSelectionBox.focus();
    screen.render();
  });
};
*/

configBox.on('select', (item) => {
  const selected = item.getText().trim();

  if (selected === 'Get Configuration') {
    handleGetConfig();
  } else if (selected === 'Set Configuration') {
    handleSetConfig();
  } else if (selected === 'Edit file') {
    handleEditFile();
  }
});

screen.key(['left', 'right'], () => {
  screen.children.forEach((child) => {
    if (child.options.label?.includes('Select Configuration File')) {
      screen.remove(child); 
    }
  });
  screen.render();
});


module.exports = { configBox };



