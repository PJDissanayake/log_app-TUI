/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * License: [ MIT.]
 * This application provides a terminal user interface (TUI) to interact with multiple chargers. 
 * The user can select devices, login, view device configurations, and interact with firmware, logs, and settings.
 * 
 * The application uses the 'blessed' library to create UI components, 'child_process' to execute commands,
 * and 'fs' and 'os' for filesystem and system-related functionality.
 */

//log_tui.js

const fs = require('fs');
const blessed = require('blessed');
const { exec } = require('child_process');
const os = require('os');
const screen = require('./screen');

// Store the correct username 
const correctUsername = 'admin';

const chargerIPs = JSON.parse(fs.readFileSync('chIP.json', 'utf8'));

// vSECC Selection Box
const DeviceBox = blessed.list({
  parent: screen,
  label: ' Select Device ',
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
  items: ['vSECC_1 >>>', 'vSECC_2 >>>', 'vSECC_3 >>>'],
  align: 'center',
  keys: true,
  vi: true,
  mouse: true,
});

// Username and Password Box
const loginBox = blessed.box({
  parent: screen,
  label: ' Login ',
  tags: true,
  width: '60%',
  height: 10,
  top: 'center',
  left: 'center',
  border: { type: 'line' },
  style: {
    label: { bold: true },
    border: { fg: 'blue' },
  },
  hidden: true,
});

const usernameBox = blessed.textbox({
  parent: loginBox,
  top: 1,
  left: 2,
  width: '90%',
  height: 3,
  border: { type: 'line' },
  label: ' Username ',
  inputOnFocus: true,
  style: {
    fg: 'white',
    border: { fg: 'blue' },
  },
  keys: true,
  mouse: true,
});

const passwordBox = blessed.textbox({
  parent: loginBox,
  top: 5,
  left: 2,
  width: '90%',
  height: 3,
  border: { type: 'line' },
  label: ' Password ',
  inputOnFocus: true,
  censor: true,
  style: {
    fg: 'white',
    border: { fg: 'blue' },
  },
  keys: true,
  mouse: true,
});

// Loading Box
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

// Menu Selection Box
const MenuBox = blessed.list({
  parent: screen,
  label: ' Menu ',
  tags: true,
  width: '60%',
  height: '40%',
  top: 'center',
  left: 'center',
  border: { type: 'line' },
  style: {
    label: { bold: true },
    border: { fg: 'green' },
    selected: { bg: 'green', fg: 'white' },
  },
  items: ['Firmware ','System_Log','Config_Setting', 'Control', 'Script', 'Doc File', 'Critical Settings'],
  keys: true,
  vi: true,
  mouse: true,
  hidden: true,
});


// State Variables
let selectedChargerIndex = null;
let token = '';
let enteredPw = '';
// vSECC Selection Event
DeviceBox.on('select', (item, index) => {
  selectedChargerIndex = index + 1;
  DeviceBox.hide();
  loginBox.show();
  usernameBox.focus();
  screen.render();
});

// Username Box Submission
usernameBox.on('submit', (username) => {
  usernameBox.setValue(username);
  passwordBox.focus();
  screen.render();
});

// Password Box Submission
passwordBox.on('submit', (password) => {
  const enteredUsername = usernameBox.getValue();
  enteredPw = password;
  
  if (enteredUsername.trim().length !== 0 && enteredPw.trim().length !== 0) {
    loginBox.hide();
    loadingBox.show();
    screen.render();
    const chargerIp = chargerIPs[selectedChargerIndex];
    const curlLogin = `curl -sS -X POST 'http://${chargerIp}/api/login' -H 'accept: text/plain' -H 'Content-Type: application/json' -d '{"name": "${enteredUsername}", "password": "${enteredPw}"}'`;

    exec(curlLogin, (error, stdout, stderr) => {
    
      if (error) {
        console.error('Failed to execute curl login command:', /*error*/);
        loadingBox.setContent('Failed to connect.  Try again.');
        screen.render();
        setTimeout(() => {
          loadingBox.hide();
          loginBox.show();
          usernameBox.focus();
          screen.render();
        }, 2000);
        return;
      }
      token = stdout.trim();
      if(token==='Invalid password'){
        loadingBox.hide();
        loginBox.show();
        usernameBox.setValue('');
        passwordBox.setValue('');
        usernameBox.setLabel(' Incorrect! Enter Username ');
        passwordBox.setLabel(' Incorrect! Enter Password ');
        usernameBox.focus();
        screen.render();
      }
      else{
      const authCmd = `curl -sS -X GET 'http://${chargerIp}/api/testingAuth' -H 'accept: text/plain' -H 'Authorization: Bearer ${token}'`;
      exec(authCmd, (authError, authStdout, authStderr) => {
        if (authError || authStderr) {
          console.error('Failed to execute auth command:', /*authError || authStderr*/);
          loadingBox.setContent('Authentication failed. Try again.');
          screen.render();
          return;
        }
        if (authStdout.trim()==='')
       // console.log('Authentication successful:', authStdout.trim());
        loadingBox.hide();
        MenuBox.show();
        MenuBox.focus();
        screen.render();
      });}
    });
  } 
});

/////////////////

const { firmwareBox } = require('./firmware');
firmwareBox.parent = screen; 
screen.append(firmwareBox); 

const { logsBox } = require('./logs');
logsBox.parent = screen;
screen.append(logsBox);

const { configBox } = require('./config');
configBox.parent = screen; 
screen.append(configBox);

const { ctricalSetBox } = require('./criticalSet');
ctricalSetBox.parent = screen; 
screen.append(ctricalSetBox);


// Menu Selection Event
MenuBox.on('select', (item) => {
  const selected = item.getText().trim();

  if (selected === 'Firmware') {
    //>>>
    let chIp = chargerIPs[selectedChargerIndex];
    let tk=token;
    let vspass=enteredPw;
    function getToken() {
        return tk;}
    function getIp() {
        return chIp;}
    function getpw(){
      return vspass;
    }
    module.exports = { getIp, getToken,getpw};
    //>>>
    MenuBox.hide();
    firmwareBox.show(); // Show the firmware box
    firmwareBox.focus(); // Focus the firmware box
    screen.render();
  }

  if (selected === 'System_Log') {
      //>>>
      let chIp = chargerIPs[selectedChargerIndex];
      let tk=token;
      function getToken() {
          return tk;}
      function getIp() {
          return chIp;}
      module.exports = { getIp, getToken};
      //>>>
    MenuBox.hide();
    logsBox.show(); // Show the logs box
    logsBox.focus(); // Focus the logs box
    screen.render();
  }


  if (selected === 'Config_Setting') {
    //>>>
    let chIp = chargerIPs[selectedChargerIndex];
    let tk=token;
    function getToken() {
        return tk;}
    function getIp() {
        return chIp;}
    module.exports = { getIp, getToken};
    //>>>
    MenuBox.hide();
    configBox.show(); // Show the configuration box
    configBox.focus(); // Focus the configuration box
    screen.render();
  }
  
  if (selected === 'Critical Settings') {
    //>>>
    let chIp = chargerIPs[selectedChargerIndex];
    let tk=token;
    let vsIndex=selectedChargerIndex;
    function getToken() {
        return tk;}
    function getIp() {
        return chIp;}
    function getIndex(){
        return vsIndex}
    module.exports = { getIp, getToken,getIndex};
    //>>>

    MenuBox.hide();
    ctricalSetBox.show();  
    ctricalSetBox.focus(); // Focus the newIPBox
    screen.render();
  }

});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Back and Quit Boxes
const backBox = blessed.box({
  parent: screen,
  content: 'Back',
  width: 10,
  height: 3,
  bottom: 0,
  left: 0,
  align: 'center',
  valign: 'middle',
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'blue',
    border: { fg: 'blue' },
    hover: { bg: 'cyan' },
  },
  keys: true,
  mouse: true,
  hidden: false, 
});

const quitBox = blessed.box({
  parent: screen,
  content: 'Quit',
  width: 10,
  height: 3,
  bottom: 0,
  right: 0,
  align: 'center',
  valign: 'middle',
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'red',
    border: { fg: 'red' },
    hover: { bg: 'magenta' },
  },
  keys: true,
  mouse: true,
});

// Back and Quit Event Handlers
backBox.on('click', () => {
  if (DeviceBox.visible) {
    process.exit(0);
  } 
  else if(loginBox.visible){
    loginBox.hide();
    DeviceBox.show();
    DeviceBox.focus();
    screen.render();
  }
  else if(MenuBox.visible) {
    MenuBox.hide();
    loadingBox.hide();
    loginBox.show();
    loginBox.focus();
    screen.render();
  }
  else if(firmwareBox.visible||configBox.visible||logsBox.visible||ctricalSetBox.visible){
    firmwareBox.hide();
    configBox.hide();
    logsBox.hide();
    MenuBox.show();
    MenuBox.focus();
    screen.render();
  }
  
});

quitBox.on('click', () => {
  process.exit(0);
});

// Screen Focus Handlers
DeviceBox.on('focus', () => {
  backBox.show(); 
  screen.render();
});

MenuBox.on('focus', () => {
  backBox.show();  
  screen.render();
});

loginBox.on('focus', () => {
  backBox.show();  
  screen.render();
});


function applyFocusStyle(box, isFocused) {
  if (isFocused) {
    box.style.border.fg = 'yellow'; 
    box.style.fg = 'black';         
 
    box.style.bg = box === backBox ? 'cyan' : 'magenta';
  } else {
    box.style.border.fg = box === backBox ? 'blue' : 'red'; 
    box.style.bg = box === backBox ? 'blue' : 'red'; 
    box.style.fg = 'white'; 
  }
  screen.render();
}

let currentFocus = 'DeviceBox'; // Default focus

// Left Arrow - Highlight Back Box
screen.key(['left'], () => {
  currentFocus = 'backBox';
  backBox.focus();
  applyFocusStyle(backBox, true);
  applyFocusStyle(quitBox, false);
  screen.render();
});
// Right Arrow - Highlight Quit Box
screen.key(['right'], () => {
  currentFocus = 'quitBox';
  quitBox.focus();
  applyFocusStyle(backBox, false);
  applyFocusStyle(quitBox, true);
  screen.render();
});

// Up Arrow - Return focus to the active menu or screen component
screen.key(['up'], () => {
  // Check if Back or Quit box is focused
  if (backBox.focused || quitBox.focused) {
    applyFocusStyle(backBox, false);
    applyFocusStyle(quitBox, false);
    if (DeviceBox.visible) {
      currentFocus = 'DeviceBox';
      DeviceBox.focus();
    } else if (loginBox.visible) {
      currentFocus = 'loginBox';
      usernameBox.focus();
    } else if (MenuBox.visible) {
      currentFocus = 'MenuBox';
      MenuBox.focus();
    } else if (firmwareBox.visible) {
      currentFocus = 'firmwareBox';
      firmwareBox.focus();
    } else if (configBox.visible ) {
      currentFocus = 'configBox';
      configBox.focus();
    } else if (logsBox.visible) {
      currentFocus = 'logsBox';
      logsBox.focus();
    }
    screen.render();
  }
});

// Handle Enter Key Based on Current Focus
screen.key(['enter'], () => {
  if (currentFocus === 'backBox') {
    backBox.emit('click');
  } else if (currentFocus === 'quitBox') {
    quitBox.emit('click');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initial Screen and Focus

DeviceBox.focus();
screen.render();
