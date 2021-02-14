#!/usr/bin/env node

require("dotenv").config();
const { alterDatabase } = require("./utilities");

alterDatabase("rollback");
