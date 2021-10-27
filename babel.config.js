module.exports = (api) => {
    api.cache.never()
    return {
        ignore: ['**/*.test.js', 'src/utils/test.js', 'node_modules'],
        presets: [['@babel/preset-env', { modules: false, targets: { node: true } }], ['@babel/preset-typescript']],
        plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-transform-modules-commonjs'],
        comments: false,
        minified: true,
    }
}
