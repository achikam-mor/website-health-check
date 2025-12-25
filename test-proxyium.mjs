import { runProxyiumAccess } from './src/proxyium-accessor.js';

console.log('Starting Proxyium test...');

runProxyiumAccess('www.stockscanner.net')
  .then((accessor) => {
    console.log('✓ Successfully accessed stockscanner.net through proxyium!');
    console.log('Browser is still open. Keeping it open for 30 seconds...');
    
    setTimeout(async () => {
      console.log('Closing browser...');
      await accessor.close();
      console.log('Done!');
      process.exit(0);
    }, 30000);
  })
  .catch(error => {
    console.error('✗ Failed:', error);
    process.exit(1);
  });
