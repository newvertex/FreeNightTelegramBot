const express = require('express');
const expressApp = express();
const bot = require('./index');
const PORT = process.env.PORT || 3000;

// bot.register(expressApp);
expressApp.use(bot.webhookCallback(bot.api));

expressApp.get('/', (req, res) => {
  res.send('Welcome to FreeNight!');
});

expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

