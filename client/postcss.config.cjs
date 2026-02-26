module.exports = {
  plugins: [
    require('postcss-import'),
    // postcss-preset-env adds many modern CSS transforms that we don't
    // need when using Tailwind. Keeping it here pulled in a broken mix of
    // @csstools packages and caused build failures (#see npm errors about
    // "isTokenComma"). Removing it resolves the issue.
    // require('postcss-preset-env'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
