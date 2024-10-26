npx tsc -b && npx vite build
cd dist/assets/
HASH=$(ls | grep -Po "(?<=main-).*?(?=\.js)")
INDEX=$(ls | grep index-*.js)
echo "import './${INDEX}'; export { mountMicrofrontend } from './main-${HASH}.js';" > "remoteEntry-${HASH}.js"