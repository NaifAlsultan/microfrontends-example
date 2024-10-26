npx ng build
cd dist/angular-guest/browser/
HASH=$(ls | grep -Po "(?<=main-).*?(?=\.js)")
POLY=$(ls | grep polyfills-*.js)
echo "import './${POLY}'; export { mountMicrofrontend } from './main-${HASH}.js';" > "remoteEntry-${HASH}.js"