/* global chrome:readonly */
document.addEventListener('cmp.money.close_window', function () {
	chrome.runtime.sendMessage({ name: 'cmp.money.close_window' });
});

// Fire an event to let the web page know the extension is ready
const eventCmpMoneyReady = new Event('cmp.money.ready');
document.dispatchEvent(eventCmpMoneyReady);
