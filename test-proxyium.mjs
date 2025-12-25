import { runProxyiumAccess } from './src/proxyium-accessor.js';

console.log('═══════════════════════════════════════════════════');
console.log('🚀 Starting Proxyium Access Test');
console.log('═══════════════════════════════════════════════════\n');

runProxyiumAccess('www.stockscanner.net')
  .then((accessor) => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✓ TEST PASSED: Successfully accessed stockscanner.net');
    console.log('═══════════════════════════════════════════════════');
    console.log('Browser is still open. Keeping alive for 30 seconds...\n');
    
    setTimeout(async () => {
      console.log('Closing browser...');
      await accessor.close();
      console.log('✓ Browser closed. Test complete!');
      process.exit(0);
    }, 30000);
  })
  .catch(error => {
    console.error('\n═══════════════════════════════════════════════════');
    console.error('✗ TEST FAILED');
    console.error('═══════════════════════════════════════════════════');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
