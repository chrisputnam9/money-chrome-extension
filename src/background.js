/* global chrome:readonly */
(function () {
	let URL = '';
	let USERNAME = '';
	let API_KEY = '';

	chrome.storage.sync.get(function (data) {
		URL = 'url' in data ? data.url : '';
		USERNAME = 'user' in data ? data.user : '';
		API_KEY = 'key' in data ? data.key : '';
	});

	// Listen for tab updates
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
		if (changeInfo.status !== 'complete') return false; // loading complete?
		if (tab.url.indexOf(URL) !== 0) return false; // URL matches app URL?

		// At this point, we know a URL has loaded which matches our app URL
		//  - So we now want to inject our content script
		chrome.tabs.executeScript(tabId, {
			file: 'src/content.js',
		});
	});

	// Listen for messages
	chrome.runtime.onMessage.addListener(function (message, sender) {
		const name = 'name' in message ? message.name : false;

		// Requested to close window
		if (name === 'cmp.money.close_window') {
			// Close tab that sent the message
			if (sender.tab) {
				chrome.tabs.remove(sender.tab.id);
				return true;
			}

			throw new Error('Failed to close money app tab');
		}

		// Options saved
		if (name === 'options_saved') {
			URL = message.data.url;
			USERNAME = message.data.user;
			API_KEY = message.data.key;
		}
	});

	// Add Context Menu item - for selection
	chrome.contextMenus.create({
		id: 'addTransactionFromSelection',
		title: 'Add Transaction From Selection',
		contexts: ['selection'],
	});

	// Add Context Menu item - for all others
	chrome.contextMenus.create({
		id: 'addTransactionFromPage',
		title: 'Add Transaction From Page',
		contexts: ['page', 'frame', 'browser_action', 'page_action'],
	});

	// Listen for shortcut command
	chrome.commands.onCommand.addListener(function (command) {
		if (command === 'add-transaction-from-page') {
			addTransaction('page');
		}
	});

	// Listen for context menu click
	chrome.contextMenus.onClicked.addListener(function (info) {
		if (info.menuItemId === 'addTransactionFromSelection') {
			addTransaction('selection');
		}

		if (info.menuItemId === 'addTransactionFromPage') {
			addTransaction('page');
		}
	});

	// Add transaction, from either full page or selection (context)
	function addTransaction(context) {
		// Get active tab in current window
		chrome.tabs.query(
			{
				active: true,
				currentWindow: true,
			},
			function (tabs) {
				if (tabs.length === 0) {
					throw new Error('Unable to get active tab for some reason');
				}

				const tab = tabs[0];
				const pageTitle = tab.title;
				const pageUrl = tab.url;
				let code;

				if (context === 'selection') {
					code = 'window.getSelection().toString()';
				} else if (context === 'page') {
					// Special handling for gmail
					if (tab.url.match(/mail\.google\.com/)) {
						code =
							"(window.document.querySelector('table.Bs.nH.iY.bAt') || window.document.body).innerText";
					} else {
						code = 'window.document.body.innerText';
					}
				}

				chrome.tabs.executeScript(
					tab.id,
					{
						code,
					},
					function (results) {
						const transactionContent = results[0];

						fetch(URL + '/transaction/text?ajax=1', {
							method: 'POST',
							mode: 'cors',
							cache: 'no-cache',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								authentication: {
									username: USERNAME,
									api_key: API_KEY,
								},
								app_window: 1,
								page_title: pageTitle,
								page_url: pageUrl,
								selection: transactionContent,
							}),
						})
							.then((response) => response.json())
							.then((response) => {
								if ('location' in response) {
									const location = response.location,
										url = URL + location;

									chrome.windows.create({
										url,
										focused: true,
										type: 'popup',
									});
								} else if ('error' in response) {
									throw new Error(
										'There has been an error: ' +
											response.error
									);
								} else {
									throw new Error(response);
								}
							});
					}
				);
			}
		);
	} // End addTransaction
})();
