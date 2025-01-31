/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * criticalSet.js
 */

const blessed = require('blessed');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const screen = require('./screen');
const readline = require('readline');

// Create the Change IP box
const ctricalSetBox = blessed.list({
  label: ' Critical Settings ',
  tags: true,
  width: '60%',
  height: '40%',
  top: 'center',
  left: 'center',
  border: { type: 'line' },
  style: {
    label: { bold: true },
    border: { fg: 'blue' },
    selected: { bg: 'blue', fg: 'white' },
  },
  items: ['Change IP', 'Change Password'],
  keys: true,
  vi: true,
  mouse: true,
  hidden: true, // Hidden by default
});

// Function to handle new IP input
const handleNewIP = (chargerIp, token, selch_Index) => {
  const newIPBox = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: 3,
    border: { type: 'line' },
    label: ' Enter New IP ',
    inputOnFocus: true,
    style: {
      fg: 'white',
      border: { fg: 'green' },
    },
    keys: true,
    mouse: true,
  });

  
  screen.append(newIPBox);
  newIPBox.focus();
  screen.render();

  newIPBox.on('submit', (newIP) => {
    if (!newIP || !/^\d{1,3}(\.\d{1,3}){3}$/.test(newIP)) {
      console.error('Invalid IP address!');
      return;
    }

    const postCommand = `
      curl -X 'POST' 'http://${chargerIp}/api/interfaces/network' \
      -H 'accept: */*' \
      -H 'Authorization: Bearer ${token}' \
      -H 'Content-Type: application/json' \
      -d '[{"address": "${newIP.trim()}/24", "dns": "8.8.8.8", "gateway": "192.168.3.1", "interface": "eth1", "mode": "static"}]'
    `;

    const rebootCommand = `
      curl -X 'PUT' 'http://${chargerIp}/api/system/reboot' \
      -H 'accept: */*' \
      -H 'Authorization: Bearer ${token}'
    `;

    try {
      execSync(postCommand);
      execSync(rebootCommand);

      const jsonFilePath = 'chIP.json';
      let chargerIPs = {};

      if (fs.existsSync(jsonFilePath)) {
        chargerIPs = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      }

      if (newIP && selch_Index in chargerIPs) {
        chargerIPs[selch_Index] = newIP.trim();
        fs.writeFileSync(jsonFilePath, JSON.stringify(chargerIPs, null, 2));
      }
      readline.cursorTo(process.stdout, 0, 0);
      process.stdout.write('\x1b[1A'); // Move cursor up
      process.stdout.write('\x1b[2K');
      console.log('IP Changed Successfully');
      setTimeout(() => process.exit(0), 4000); // Exit after 2 seconds
    } catch (error) {
      console.error('Failed to change IP:', error.message);
    }
  });

  newIPBox.readInput();
};

// Function to handle the Change IP flow
const handleChangeIP = () => {
  const { getIp, getToken, getIndex } = require('./log_tui');
  const chargerIp = getIp();
  const token = getToken();
  const selch_Index = getIndex();

  // Create VIP Password Input Box
  const vipBox = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: 3,
    border: { type: 'line' },
    label: ' Enter VIP Password ',
    inputOnFocus: true,
    style: {
      fg: 'white',
      border: { fg: 'red' },
    },
    keys: true,
    mouse: true,
  });

  screen.append(vipBox);
  vipBox.focus();
  screen.render();

  vipBox.on('submit', (vipPassword) => {
    if (vipPassword !== 'donotchangeip') {
      console.error('Incorrect VIP password!');
      setTimeout(() => process.exit(0), 4000); // Exit after 2 seconds
    } else {
      screen.remove(vipBox);
      screen.render();
      handleNewIP(chargerIp, token, selch_Index);
    }
  });

  vipBox.readInput();
};

// Function to handle the Change Password flow
const handleChangePassword = (chargerIp, token) => {
  // Create VIP Password Input Box
  const vipBox = blessed.textbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '60%',
    height: 3,
    border: { type: 'line' },
    label: ' Enter VIP Password ',
    inputOnFocus: true,
    style: {
      fg: 'white',
      border: { fg: 'red' },
    },
    keys: true,
    mouse: true,
  });

  screen.append(vipBox);
  vipBox.focus();
  screen.render();

  vipBox.on('submit', (vipPassword) => {
    if (vipPassword !== 'donotchangepassword') {
      console.error('Incorrect VIP password!');
      setTimeout(() => process.exit(0), 4000); // Exit after 4 seconds
    } else {
      screen.remove(vipBox);
      screen.render();

      // Prompt for new password after VIP password verification
      const newPasswordBox = blessed.textbox({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '60%',
        height: 3,
        border: { type: 'line' },
        label: ' Enter New Password ',
        inputOnFocus: true,
        style: {
          fg: 'white',
          border: { fg: 'green' },
        },
        keys: true,
        mouse: true,
      });

      screen.append(newPasswordBox);
      newPasswordBox.focus();
      screen.render();

      newPasswordBox.on('submit', (newPassword) => {
        screen.remove(newPasswordBox);
        screen.render();

        /*if (!newPassword || newPassword.length < 6) {
          console.error('Password must be at least 6 characters!');
          setTimeout(() => process.exit(0), 4000); // Exit after 4 seconds
          return;
        }*/

        const confirmPasswordBox = blessed.textbox({
          parent: screen,
          top: 'center',
          left: 'center',
          width: '60%',
          height: 3,
          border: { type: 'line' },
          label: ' Confirm New Password ',
          inputOnFocus: true,
          style: {
            fg: 'white',
            border: { fg: 'green' },
          },
          keys: true,
          mouse: true,
        });

        screen.append(confirmPasswordBox);
        confirmPasswordBox.focus();
        screen.render();

        confirmPasswordBox.on('submit', (confirmPassword) => {
          if (newPassword !== confirmPassword) {
            console.error('Passwords do not match!');
            setTimeout(() => process.exit(0), 4000); // Exit after 4 seconds
            return;
          }

          const curlCommand = `curl -X 'PUT' \
          'http://${chargerIp}/api/users/credentials' \
          -H 'accept: */*' \
          -H 'Authorization: Bearer ${token}' \
          -H 'Content-Type: application/json' \
          -d '"${confirmPassword}"'`;
          
          exec(curlCommand, (error, stdout) => {
            if (error) {
              screen.remove(loadingBox);
              console.error('Failed to update credentials:', error); // Use 'error' to display the actual error
              console.error('Failed to change password:', error.message);
              setTimeout(() => process.exit(0), 8000);
            } else {
              readline.cursorTo(process.stdout, 0, 0);
              process.stdout.write('\x1b[1A'); // Move cursor up
              process.stdout.write('\x1b[2K');
              console.log(`Credentials update response: ${stdout.toString().trim()}`);
              setTimeout(() => process.exit(0), 8000);
            }
          });

          /*try {
            execSync(curlCommand);
            readline.cursorTo(process.stdout, 0, 0);
            process.stdout.write('\x1b[1A'); // Move cursor up
            process.stdout.write('\x1b[2K');
            console.log('Password Changed Successfully');
            setTimeout(() => process.exit(0), 8000); // Exit after 4 seconds
          } catch (error) {
            console.error('Failed to change password:', error.message);
            setTimeout(() => process.exit(0), 8000); // Exit after 4 seconds
          }*/
        });

        confirmPasswordBox.readInput();
      });

      newPasswordBox.readInput();
    }
  });

  vipBox.readInput();
};

// Event handler for ctricalSetBox selection
ctricalSetBox.on('select', (item) => {
  const selected = item.getText().trim();
  const { getIp, getToken } = require('./log_tui');
  const chargerIp = getIp();
  const token = getToken();

  if (selected === 'Change IP') {
    handleChangeIP(chargerIp, token);
  } else if (selected === 'Change Password') {
    handleChangePassword(chargerIp, token);
  }
});

module.exports = { ctricalSetBox };

