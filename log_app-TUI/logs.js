/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * logs.js
 */
const blessed = require('blessed');
const { exec } = require('child_process');
const screen = require('./screen');
const os = require('os');
const readline = require('readline');

// Create the logs box
const logsBox = blessed.list({
  label: ' Logs ',
  tags: true,
  width: '60%',
  height: '40%',
  top: 'center',
  left: 'center',
  border: { type: 'line' },
  style: {
    label: { bold: true },
    border: { fg: 'green' },
    selected: { bg: 'green', fg: 'black' },
  },
  items: ['Get Logs'],
  keys: true,
  vi: true,
  mouse: true,
  hidden: true, // Hidden by default
});

// Function to handle Get Logs
  const handleGetLogs = () => {
  const { getIp, getToken } = require('./log_tui');
  const chargerIp = getIp();
  const token = getToken();

  // Get the current date and time for the log file name
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.T]/g, '_').slice(0, 15);
  const curlGetLogs = `curl -X 'GET' 'http://${chargerIp}/api/logging/files' -H 'accept: application/octet-stream' -H 'Authorization: Bearer ${token}' --output ${os.homedir()}/log_app-TUI/logs/Vslog_${timestamp}.rar`;

  exec(curlGetLogs, (error, stdout) => {
    if (error) {
      readline.cursorTo(process.stdout, 0, 0);
      console.error('Failed to fetch logs:', /*error*/);
    } else {
      readline.cursorTo(process.stdout, 0, 0);
      process.stdout.write('\x1b[1A'); // Move cursor up
      process.stdout.write('\x1b[2K');
      console.log(`Logs recorded: ${stdout.trim()}`);
    }
    logsBox.focus();
    screen.render();
  });
};

// Event handler for logsBox selection
logsBox.on('select', (item) => {
  const selected = item.getText().trim();
  if (selected === 'Get Logs') {
    handleGetLogs();
  }
});

module.exports = { logsBox };


