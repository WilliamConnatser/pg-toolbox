#!/usr/bin/env node

require("dotenv").config();
const path = require("path");
const PGToolbox = require("../index");
const { alterDatabase } = require("./utilities");

(async () => {
  const db = await PGToolbox({ connection: process.env.PG_CONNECTION_STRING });
  alterDatabase(db, "migrate");
})();
