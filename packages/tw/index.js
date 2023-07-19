const plugin = require('tailwindcss/plugin')

/** 
 * @type {import('tailwindcss').Config} 
 * @param {Config} twConfig
 */
const withUt = (twConfig) => {
    // content can be an object. should add logic for that as well
    if (Array.isArray(twConfig.content)) {
        twConfig.content.push("./node_modules/@uploadthing/react/src/**");
    }

    const utPlugin = plugin(function ({ addVariant }) {
        addVariant('ut-button', '&>*[data-ut-element="button"]')
        addVariant('ut-allowed-content', '&>*[data-ut-element="allowed-content"]')
        addVariant('ut-label', '&>*[data-ut-element="label"]')
        addVariant('ut-upload-icon', '&>*[data-ut-element="upload-icon"]')
    })

    if (!twConfig.plugins) {
        twConfig.plugins = [];
    }

    twConfig.plugins.push(utPlugin);

    if (!twConfig.theme) {
        twConfig.theme = {};
    }

    if (!twConfig.theme.data) {
        twConfig.theme.data = {};
    }

    Object.assign(twConfig.theme.data, {
        'ut-readying': 'state=readying',
        'ut-ready': 'state=ready',
        'ut-uploading': 'state=uploading',
    })

    return twConfig;
};

module.exports = withUt;
