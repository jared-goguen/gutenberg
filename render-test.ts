import { readFileSync, writeFileSync } from 'fs';
import { renderPage } from './tools/render_page/index.js';

(async () => {
  try {
    const yamlContent = readFileSync('/home/jared/source/pages/specs/test-page.yaml', 'utf-8');
    
    const result = await renderPage({
      schema: yamlContent,
      options: {
        minify: false,
        includeComments: true,
        tailwindCDN: true,
      },
    });
    
    const htmlData = JSON.parse(result.content[0].text);
    const html = htmlData.html;
    
    console.log('✅ Rendered HTML, length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    
    writeFileSync('/home/jared/source/pages/rendered/test-page-updated.html', html);
    console.log('✅ Written to file');
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
})();
