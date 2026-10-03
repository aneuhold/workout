import playStoreAssetsService from './PlayStoreAssets.service';

const main = async (): Promise<void> => {
  await playStoreAssetsService.renderFeatureGraphic();
  await playStoreAssetsService.renderScreenshots();
};

await main();
