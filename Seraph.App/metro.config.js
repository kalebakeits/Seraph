const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Allow Metro to bundle .sql files as raw strings (required for Drizzle migrations)
config.resolver.sourceExts.push('sql');

module.exports = config;
