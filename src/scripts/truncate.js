#!/usr/bin/env node

const { alterDatabase } = require("./utilities");

(async () => alterDatabase("truncate"))();
