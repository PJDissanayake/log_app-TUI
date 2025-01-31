/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * firmware.js
 */

const blessed = require('blessed');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const screen = require('./screen');
const os = require('os');
const readline = require('readline');

const firmwareBox = blessed.list({
  label: ' Firmware ',
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
  items: ['Check Version', 'Update', 'Reboot', 'Script'],
  keys: true,
  vi: true,
  mouse: true,
  hidden: true, // Hidden by default
});


const vBox = (files) => {

  const loadingBox = blessed.box({
    parent: screen,
    label: ' Loading... ',
    tags: true,
    width: '40%',
    height: 5,
    top: 'center',
    left: 'center',
    border: { type: 'line' },
    style: {
      label: { bold: true },
      border: { fg: 'blue' },
      fg: 'white',
    },
    content: 'Please wait...',
    hidden: true,
  });

  const versionBox = blessed.list({
    label: ' Select Firmware File ',
    tags: true,
    width: '50%',
    height: '30%',
    top: 'center',
    left: 'center',
    border: { type: 'line' },
    style: {
      label: { bold: true },
      border: { fg: 'green' },
      selected: { bg: 'green', fg: 'white' },
    },
    items: files,
    keys: true,
    vi: true,
    mouse: true,
  });

  versionBox.on('select', (item) => {
    const selectedFile = item.getText().trim();
    readline.cursorTo(process.stdout, 0, 0);
    process.stdout.write('\x1b[1A'); // Move cursor up
    process.stdout.write('\x1b[2K');
    console.log(`Selected file: ${selectedFile}\nUpdating... Please wait`);
    const { getIp, getToken } = require('./log_tui');
    const chargerIp = getIp();
    const token = getToken();
    const curlUpdate = `curl -X 'POST' 'http://${chargerIp}/api/firmware' -H 'accept: */*' -H 'Authorization: Bearer ${token}' -H 'Content-Type: application/octet-stream' --data-binary "@${os.homedir()}/log_app-TUI/source/${selectedFile}"`;
    const curlfRboot = `curl -X 'PUT' 'http://${chargerIp}/api/system/reboot' -H 'accept: */*' -H 'Authorization: Bearer ${token}'`;
    
    const curlLogin = `curl -sS -X POST 'http://${chargerIp}/api/login' -H 'accept: text/plain' -H 'Content-Type: application/json' -d '{"name": "admin", "password": "rootpassword"}'`;
    //console.log(curlUpdate);
    screen.remove(versionBox);
    loadingBox.show();
    loadingBox.setContent('Updating Firmware Please wait..');
    screen.render();

    exec(curlUpdate, (error, stdout) => {
      if (error) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); 
        process.stdout.write('\x1b[2K');
        console.error('Failed to update firmware:', error); // Use 'error' to display the actual error
      } else {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.log(`Update response: ${stdout.toString().trim()}`);
        
        // Reboot the system
        exec(curlfRboot, (error) => {
          if (error) {
            console.error('Failed to reboot system:', error); // Use 'error' to display the actual error
          } else {
            console.log('System reboot initiated');
            loadingBox.setContent('Reboot Initiated Please wait...');
            screen.render();
            
            setTimeout(() => {
              /*loadingBox.setContent('Updating credentials Please wait...');
              screen.render();
              
              exec(curlLogin, (error, stdout) => {
                if (error) {
                  console.error('Failed to execute curl login command:', error); // Use 'error' to display the actual error
                  loadingBox.setContent('Failed to connect. Try again.');
                  screen.remove(loadingBox);
                  screen.render();
                  
                  setTimeout(() => {
                    loadingBox.hide();
                    loginBox.show();
                    usernameBox.focus();
                    screen.render();
                  }, 2000);
                  return;
                } else {
                  const newtoken = stdout.trim();
                  const curlCrd = `curl -X 'PUT' \
      'http://${chargerIp}/api/users/credentials' \
      -H 'accept: ' \
      -H 'Authorization: Bearer ${newtoken}' \
      -H 'Content-Type: application/json' \
      -d '"rootpassword"'`;
                  
                  exec(curlCrd, (error, stdout) => {
                    if (error) {
                      screen.remove(loadingBox);
                      console.error('Failed to update credentials:', error); // Use 'error' to display the actual error
                    } else {
                      console.log(`Credentials update response: ${stdout.toString().trim()}`);
                    }
                    
                    // Cleanup UI and focus on firmwareBox
                    screen.remove(versionBox);
                    screen.remove(loadingBox);
                    firmwareBox.focus();
                    screen.render();
                  });
                }
              });*/
              loadingBox.setContent('Successfully Updated Firmware..! ');
              screen.render();
              console.log(' Firmware updated');
              setTimeout(() => process.exit(0), 4000);
            }, 60000); // Wait 80 seconds before attempting to update credentials
          }
        });
      }
    });    
  });
  screen.append(loadingBox);
  screen.append(versionBox);
  versionBox.focus();
  screen.render();
};


const sBox = (files) => {
  const scriptBox = blessed.list({
    label: ' Select Patch File ',
    tags: true,
    width: '50%',
    height: '30%',
    top: 'center',
    left: 'center',
    border: { type: 'line' },
    style: {
      label: { bold: true },
      border: { fg: 'blue' },
      selected: { bg: 'blue', fg: 'white' },
    },
    items: files,
    keys: true,
    vi: true,
    mouse: true,
  });

  scriptBox.on('select', (item) => {
    const selectedFile = item.getText().trim();
    readline.cursorTo(process.stdout, 0, 0);
    process.stdout.write('\x1b[1A'); // Move cursor up
    process.stdout.write('\x1b[2K');
    console.log(`Selected patch file: ${selectedFile}`);
    const { getIp, getToken } = require('./log_tui');
    const chargerIp = getIp();
    const token = getToken();

    const curlPatch = `curl -X 'POST' \
  'http://${chargerIp}/api/scripts' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer ${token}' \
  -H 'Content-Type: application/octet-stream' \
  --data-binary "@${os.homedir()}/log_app-TUI/patch/${selectedFile}"`;

    exec(curlPatch, (error, stdout) => {
      if (error) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.error('Failed to apply patch:', error);
      } else {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.log(`Patch response: ${stdout.toString().trim()}`);
      }
      screen.remove(scriptBox);
      firmwareBox.focus();
      screen.render();
    });
  });

  screen.append(scriptBox);
  scriptBox.focus();
  screen.render();
};

firmwareBox.on('select', (item) => {
  const selected = item.getText().trim();

  if (selected === 'Check Version') {
    const { getIp, getToken  } = require('./log_tui');
    const chargerIp = getIp();
    const token = getToken();
    const curlPostFirmware = `curl -X 'GET' 'http://${chargerIp}/api/firmware' -H 'accept: application/json'`;
    //console.log(curlPostFirmware);

    exec(curlPostFirmware, (error, stdout) => {
      if (error) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.error('Failed to check firmware:', /*error*/);
      } else {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.log(`Firmware response: ${stdout.trim()}`);
      }
    });
  }

  if (selected === 'Update') {
    const sourceDir = path.resolve(process.env.HOME, 'log_app-TUI/source');
    fs.readdir(sourceDir, (err, files) => {
      if (err) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.error('Failed to read directory:', err);
        return;
      }

      const firmwareFiles = files.filter((file) => file.endsWith('.raucb'));
      if (firmwareFiles.length === 0) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.log('No firmware files found in the source directory.');
        setTimeout(() => {
          firmwareBox.focus();
          screen.render();
        }, 2000);
        return;
      }

      vBox(firmwareFiles);
    });
  }

  if (selected === 'Reboot') {
    const { getIp, getToken } = require('./log_tui');
    const chargerIp = getIp();
    const token = getToken();

    const curlRboot = `curl -X 'PUT' 'http://${chargerIp}/api/system/reboot' -H 'accept: */*' -H 'Authorization: Bearer ${token}'`;
    exec(curlRboot, (error) => {
      if (error) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.error('Failed to reboot system:', /*error*/);
      }
      readline.cursorTo(process.stdout, 0, 0);
      process.stdout.write('\x1b[1A'); // Move cursor up
      process.stdout.write('\x1b[2K');
      console.log('Reboot initiated');
    });
  }

  if (selected === 'Script') {
    const patchDir = path.resolve(process.env.HOME, 'log_app-TUI/patch');
    fs.readdir(patchDir, (err, files) => {
      if (err) {

        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.error('Failed to read directory:', err);
        return;
      }
  
      const patchFiles = files.filter((file) => file.endsWith('.vsecc'));
      if (patchFiles.length === 0) {
        readline.cursorTo(process.stdout, 0, 0);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K');
        console.log('No patch files found in the patch directory.');
        setTimeout(() => {
          firmwareBox.focus();
          screen.render();
        }, 2000);
        return;
      }
  
      sBox(patchFiles);
    });
  }
  
});

screen.key(['left', 'right'], (ch, key) => {
  screen.children.forEach((child) => {
    if (child.options.label === ' Select Firmware File ' || child.options.label === ' Select Patch File ') {
      screen.remove(child);
    }
  });
  screen.render();
});


module.exports = { firmwareBox };

