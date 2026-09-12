import androidProjectService from '../services/AndroidProject.service';

androidProjectService.writeSigningConfigFromEnvironment();
androidProjectService.syncWebAssets();
androidProjectService.bundleRelease();

console.log('');
console.log(`Signed bundle: ${androidProjectService.aabPath}`);
