const fs = require("fs");

const getToolboxFiles = (path) => {
  return fs.readdirSync(path);
};

module.exports = getToolboxFiles;
