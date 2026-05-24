#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparing build for TestFlight...');

// Get project root
const projectRoot = process.cwd();
const iosDir = path.join(projectRoot, 'ios');

if (!fs.existsSync(iosDir)) {
  console.error('iOS directory not found. Run prebuild first.');
  process.exit(1);
}

// First run the sandbox fix to ensure we don't hit that issue
try {
  console.log('Applying sandbox permissions fix...');
  require('./xcode-project-fix');
} catch (error) {
  console.error('Error applying sandbox fix:', error);
}

// Fix Hermes dSYM issue for TestFlight
try {
  console.log('Configuring build for proper dSYM generation...');
  
  // 1. Update Podfile to ensure Hermes dSYMs are generated
  const podfilePath = path.join(iosDir, 'Podfile');
  if (fs.existsSync(podfilePath)) {
    let podfileContent = fs.readFileSync(podfilePath, 'utf8');
    
    // Check if we need to modify the Podfile
    if (!podfileContent.includes('hermes_enabled => podfile_properties')) {
      console.log('Updating Podfile to ensure Hermes dSYMs are generated...');
      
      // Find the use_react_native! section
      const reactNativeMatch = podfileContent.match(/use_react_native!\([\s\S]*?\)/m);
      if (reactNativeMatch) {
        const originalSection = reactNativeMatch[0];
        
        // Ensure the hermes_enabled section is properly set and dSYM generation is enabled
        let updatedSection = originalSection;
        
        // Make sure hermes_enabled is explicitly set
        if (!updatedSection.includes('hermes_enabled =>')) {
          updatedSection = updatedSection.replace(
            /use_react_native!\(/,
            'use_react_native!(\n    :hermes_enabled => podfile_properties[\'expo.jsEngine\'] == \'hermes\','
          );
        }
        
        // Ensure compiler flags for dSYM generation
        if (!updatedSection.includes('compiler_flags')) {
          updatedSection = updatedSection.replace(
            /\)/,
            ',\n    :compiler_flags => \'-g\'\n)'
          );
        }
        
        // Replace the original section
        podfileContent = podfileContent.replace(originalSection, updatedSection);
        
        // Update the post_install section to modify build settings for all targets
        if (!podfileContent.includes('ENABLE_BITCODE')) {
          const postInstallMatch = podfileContent.match(/post_install do \|installer\|([\s\S]*?)end/m);
          if (postInstallMatch) {
            const originalPostInstall = postInstallMatch[0];
            const postInstallBody = postInstallMatch[1];
            
            // Add additional build settings in post_install to ensure dSYMs are generated
            const updatedPostInstall = `post_install do |installer|${postInstallBody}
    # Ensure dSYM generation for Hermes
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        config.build_settings['DEAD_CODE_STRIPPING'] = 'YES'
        config.build_settings['ONLY_ACTIVE_ARCH'] = 'NO'
        config.build_settings['DEBUG_INFORMATION_FORMAT'] = 'dwarf-with-dsym'
      end
    end
end`;
            
            podfileContent = podfileContent.replace(originalPostInstall, updatedPostInstall);
          }
        }
        
        // Write updated content
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('Successfully updated Podfile for dSYM generation');
        
        // Run pod install to apply changes
        console.log('Running pod install to apply changes...');
        execSync('cd ios && pod install', { stdio: 'inherit' });
      } else {
        console.log('Could not find use_react_native! section in Podfile');
      }
    } else {
      console.log('Podfile already configured for Hermes dSYMs');
    }
  } else {
    console.error(`Podfile not found at: ${podfilePath}`);
  }
  
  // 2. Update build settings in project.pbxproj
  const xcodeProjectPath = path.join(iosDir, 'Hma.xcodeproj/project.pbxproj');
  if (fs.existsSync(xcodeProjectPath)) {
    let projectContent = fs.readFileSync(xcodeProjectPath, 'utf8');
    
    // Ensure DEBUG_INFORMATION_FORMAT is set to dwarf-with-dsym for Release configuration
    if (!projectContent.includes('DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym"')) {
      console.log('Updating Xcode project for dSYM generation...');
      
      // Find Release configuration build settings
      projectContent = projectContent.replace(
        /buildSettings = {([\s\S]*?)name = Release;/g,
        (match, buildSettings) => {
          if (!buildSettings.includes('DEBUG_INFORMATION_FORMAT')) {
            return `buildSettings = {${buildSettings}\t\t\t\tDEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";\n\t\t\t\tname = Release;`;
          }
          return match;
        }
      );
      
      fs.writeFileSync(xcodeProjectPath, projectContent);
      console.log('Successfully updated Xcode project for dSYM generation');
    } else {
      console.log('Xcode project already configured for dSYM generation');
    }
  }
  
  console.log('\nTestFlight preparation completed. Follow these steps for uploading:');
  console.log('1. Open Xcode and archive your app (Product > Archive)');
  console.log('2. In the Archives window, click "Distribute App"');
  console.log('3. Select "App Store Connect" and "Upload"');
  console.log('4. Ensure "Include bitcode for iOS content" is UNCHECKED');
  console.log('5. Ensure "Upload your app\'s symbols" is CHECKED');
  console.log('6. Complete the upload process\n');
  
} catch (error) {
  console.error('Error preparing for TestFlight:', error);
} 