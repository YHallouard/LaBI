#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running Xcode project fix script...');

// Get project root
const projectRoot = process.cwd();
const iosDir = path.join(projectRoot, 'ios');

if (!fs.existsSync(iosDir)) {
  console.log('iOS directory not found. Running prebuild first...');
  try {
    execSync('npx expo prebuild --platform ios', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running prebuild:', error.message);
    process.exit(1);
  }
}

if (fs.existsSync(iosDir)) {
  // CRITICAL FIX: Disable script sandboxing in Xcode project
  try {
    const xcodeProjectPath = path.join(iosDir, 'Hma.xcodeproj/project.pbxproj');
    
    if (fs.existsSync(xcodeProjectPath)) {
      console.log('Modifying Xcode project to disable script sandboxing...');
      let projectContent = fs.readFileSync(xcodeProjectPath, 'utf8');
      
      // Disable script sandboxing for ALL build configurations
      if (!projectContent.includes('ENABLE_USER_SCRIPT_SANDBOXING = NO')) {
        projectContent = projectContent.replace(
          /buildSettings = {/g, 
          'buildSettings = {\n\t\t\t\tENABLE_USER_SCRIPT_SANDBOXING = NO;'
        );
        
        fs.writeFileSync(xcodeProjectPath, projectContent);
        console.log('Successfully disabled script sandboxing in Xcode project');
      } else {
        console.log('Script sandboxing already disabled');
      }
      
      // Set permissions for all shell scripts
      console.log('Setting permissions for all shell scripts...');
      try {
        execSync(`find "${iosDir}" -name "*.sh" -type f -exec chmod +x {} \\;`);
        console.log('Successfully set permissions for all shell scripts');
      } catch (error) {
        console.error('Error setting script permissions:', error.message);
        
        // Try specific script as fallback
        const specificScript = path.join(iosDir, 'Pods/Target Support Files/Pods-Hma/expo-configure-project.sh');
        if (fs.existsSync(specificScript)) {
          fs.chmodSync(specificScript, 0o755);
          console.log(`Set permissions for specific script: ${specificScript}`);
        }
      }
      
      console.log('Xcode project fix completed successfully');
    } else {
      console.error(`Xcode project not found at: ${xcodeProjectPath}`);
    }
  } catch (error) {
    console.error('Error modifying Xcode project:', error);
  }
} else {
  console.error('iOS directory still not found after prebuild');
} 