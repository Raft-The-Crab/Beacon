const path = require('path');
// Corrected: require .node as the file is now renamed to .node
const nativeAddon = require(path.join(__dirname, 'native', 'build', 'Release', 'beacon-native.node'));

try {
  console.log('Calling native add-on hello function:');
  const result = nativeAddon.hello();
  console.log('Result:', result);
} catch (error) {
  console.error('Error loading or calling native add-on:', error);
}
