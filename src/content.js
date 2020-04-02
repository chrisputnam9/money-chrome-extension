document.addEventListener("close_window", function(data) {
    console.log('Sending Message "close_window"');
    chrome.runtime.sendMessage({name: "close_window"});
});
