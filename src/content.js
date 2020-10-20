document.addEventListener("cmp.money.close_window", function(data) {
    console.log('Sending Message "cmp.money.close_window"');
    chrome.runtime.sendMessage({name: "cmp.money.close_window"});
});

// Fire an event to let the web page know the extension is ready
const event_cmp_money_ready = new Event('cmp.money.ready');
document.dispatchEvent(event_cmp_money_ready);
