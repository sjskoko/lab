'use strict';
const button = document.querySelector('#share');
const status = document.querySelector('#share-status');
button.hidden = false;
button.addEventListener('click', async () => {
  const url = new URL('.', location.href); url.search = ''; url.hash = '';
  status.textContent = '';
  if (navigator.share) {
    try { await navigator.share({title:'Interactive Lab',text:'Small experiments. Open to explore.',url:url.href}); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url.href); status.textContent = 'Collection link copied. Ready for your bio.'; }
  catch { document.querySelector('#share-fallback').hidden = false; const input = document.querySelector('#bio-link'); input.value = url.href; input.focus(); input.select(); status.textContent = 'Select and copy the link below.'; }
});
