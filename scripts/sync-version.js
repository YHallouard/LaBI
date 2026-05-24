const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

console.log(`Current version from package.json: ${version}`);

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
appJson.expo.version = version;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log(`Updated app.json with version: ${version}`);

try {
  const privacyPolicyPath = path.join(__dirname, '..', 'docs', 'privacy-policy.html');
  let privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf8');
  privacyPolicy = privacyPolicy.replace(
    /<p>Version ([0-9]+\.[0-9]+\.[0-9]+)<\/p>/g, 
    `<p>Version ${version}</p>`
  );
  privacyPolicy = privacyPolicy.replace(
    /<strong>Version de l'application :<\/strong> ([0-9]+\.[0-9]+\.[0-9]+)<br>/g, 
    `<strong>Version de l'application :</strong> ${version}<br>`
  );
  fs.writeFileSync(privacyPolicyPath, privacyPolicy);
  console.log(`Updated privacy-policy.html with version: ${version}`);
} catch (error) {
  console.error('Error updating privacy-policy.html:', error.message);
} 