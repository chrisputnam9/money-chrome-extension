// Load Options
document.addEventListener('DOMContentLoaded', function () {
    console.log("Loading Options");
    chrome.storage.sync.get(function (data) {
        document.getElementById('url').value = ('url' in data) ? data.url : "";
        document.getElementById('user').value = ('user' in data) ?data.user : "";
        document.getElementById('key').value = ('key' in data) ?data.key : "";
    });
});

// On submit, save options
document.getElementById('optionsForm').addEventListener('submit', function (event) {
    event.preventDefault();
    console.log("Saving Options");

    const options = {
        url: document.getElementById('url').value,
        user: document.getElementById('user').value,
        key: document.getElementById('key').value
    }

    chrome.storage.sync.set(options);

    chrome.runtime.sendMessage({
        name: "options_saved",
        data: options
    });
});
