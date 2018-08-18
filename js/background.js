chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.method) {
    case 'getItem':
      sendResponse({data: localStorage.getItem(request.key)});
      break;
    default:
      console.log('no method');
      break;
  }
});
