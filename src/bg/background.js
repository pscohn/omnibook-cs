var token = null;
//var apiBase = 'http://foo.com:8000';
var apiBase = 'https://omnibook.co';
var apiUrl = apiBase + '/entry/';
var authUrl = apiBase + '/login';
var notifications = {
  'auth': {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Log in',
    message: 'Click here to log in',
    onClick: function() {
      chrome.tabs.create({ url: authUrl });
      chrome.notifications.clear('auth');
    }
  },
  'saved': {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Tab saved!',
    message: 'Your tab has been saved.'
  },
}

function notify(key) {
  var notification = Object.assign({}, notifications[key]);
  delete notification.onClick;
  chrome.notifications.create(key, notification);
}

function authenticate() {
  chrome.storage.sync.get('omnitoken', function(data) {
    token = data.omnitoken;
    console.log('auth token', token)
    if (!token) {
      notify('auth');
    }
  });
}

function saveTab(title, url) {
  chrome.storage.sync.get('omnitoken', function(data) {
    if (!data.omnitoken) {
      return notify('auth');
    }

    console.log('get', data.omnitoken)
    var xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log(xhr.responseText);
        notify('saved');
      }
    }
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Authorization", "Token " + data.omnitoken);
    xhr.send('title=' + title + '&tags=inbox&url=' + url);
  });
}

function start() {
  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      console.log(request, sender, sendResponse);
      chrome.storage.sync.set({omnitoken: request.token}, function() {
        console.log('set token', request.token)
      });
    }
  );

  chrome.notifications.onClicked.addListener(function(id) {
    notifications[id].onClick();
  });

  chrome.browserAction.onClicked.addListener(
    function(tab) {
      saveTab(tab.title, tab.url);
      console.log(tab);
    }
  );
  authenticate();
}

start();
