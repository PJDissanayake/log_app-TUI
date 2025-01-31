/**
 * TUI Application for Charger Management System
 * Author: Pathum Jeewantha
 * Date Created: 8.1.2025
 * screen.js
 */
const blessed = require('blessed');
const screen = blessed.screen({
  smartCSR: true,
  title: 'Charger Selection TUI',
});

module.exports = screen;
