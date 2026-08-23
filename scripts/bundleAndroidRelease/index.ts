import androidProjectService from '../services/AndroidProject.service';
import signingConfigService from './SigningConfig.service';

signingConfigService.writeFromEnvironment();
androidProjectService.syncWebAssets();
androidProjectService.bundleRelease();

console.log('');
console.log(`Signed bundle: ${androidProjectService.aabPath}`);
