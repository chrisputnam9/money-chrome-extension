(function() {

    var URL="";
    var USERNAME="";
    var API_KEY="";

    chrome.storage.sync.get(function (data) {
        URL = ('url' in data) ? data.url : "";
        USERNAME = ('user' in data) ? data.user : "";
        API_KEY = ('key' in data) ? data.key : "";
    });

    // Listen for tab updates
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

        if (changeInfo.status != 'complete') return false; // loading complete?
        if (tab.url.indexOf(URL) !== 0) return false; // URL matches app URL?

        // At this point, we know a URL has loaded which matches our app URL
        //  - So we now want to inject our content script
        chrome.tabs.executeScript(tabId, {
            file: 'src/content.js'
        });
    });

    // Listen for messages
    console.log('Initializing message listener');
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

        console.log("Message received: ");
        console.log(message);

        const name = ('name' in message) ? message.name : false;

        // Requested to close window
		if (name == "cmp.money.close_window") {
            console.log('"cmp.money.close_window" message received');
            // Get active tab in current window
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                if (tabs.length == 0) {
                    console.error("Unable to get active tab for some reason");
                    alert("Error adding transaction - see console");
                    return false;
                }

                // Close the tab
                chrome.tabs.remove(tabs[0].id);
            });
        }

        // Options saved
        if (name == "options_saved") {
            console.log('"options_saved" message received, updating background data');
            URL = message.data.url;
            USERNAME = message.data.user;
            API_KEY = message.data.key;
        }

	});

    // Add Context Menu item - for selection
    chrome.contextMenus.create({
        "id": "addTransactionFromSelection",
        "title": "Add Transaction From Selection",
        "contexts": ["selection"]
    });

    // Add Context Menu item - for all others
    chrome.contextMenus.create({
        "id": "addTransactionFromPage",
        "title": "Add Transaction From Page",
        "contexts": ["page", "frame", "browser_action", "page_action"]
    });

    // Listen for shortcut command
    chrome.commands.onCommand.addListener(function(command) {
        if (command == "add-transaction-from-page") {
            addTransaction('page');
        }
    });

    // Listen for context menu click
    chrome.contextMenus.onClicked.addListener(function (info, tab) {
        if (info.menuItemId == "addTransactionFromSelection") {
            addTransaction('selection');
        }

        if (info.menuItemId == "addTransactionFromPage") {
            addTransaction('page');
        }
    });

    // Add transaction, from either full page or selection (context)
    function addTransaction(context) {

        // Get active tab in current window
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs.length == 0) {
                console.error("Unable to get active tab for some reason");
                alert("Error adding transaction - see console");
                return false;
            }

            let tab = tabs[0],
                page_title = tab.title,
                page_url = tab.url,
                transaction_content,
                code;

            if (context == 'selection') {
                code = "window.getSelection().toString()";
            } else if (context == 'page') {
                // Special handling for gmail
                if (tab.url.match(/mail\.google\.com/)) {
                    code = "(window.document.querySelector('table.Bs.nH.iY.bAt') || window.document.body).innerText";
                } else {
                    code = "window.document.body.innerText";
                }
            }

            chrome.tabs.executeScript(tab.id, {
                code: code
            }, function (results) {
                transaction_content = results[0];

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
                            api_key: API_KEY
                        },
                        app_window: 1,
                        page_title: page_title,
                        page_url: page_url,
                        selection: transaction_content
                    })
                })
                .then(response => response.json())
                .then(response => {
                    if ('location' in response) {
                        const location = response.location,
                            url = URL + location;

                        chrome.windows.create({
                            url: url,
                            focused: true,
                            type: 'popup'
                        });
                    } else if ('error' in response) {
                        alert('There has been an error: ' + response.error);
                    } else {
                        console.error(response);
                        // alert('There has been an error - see console');
                    }
                })
                .catch(console.error);

            });

        });
    }// End addTransaction

})();
