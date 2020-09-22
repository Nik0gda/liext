function randomString(len) {
  charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var randomString = "";
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
}

chrome.runtime.onStartup.addListener(async function () {
  console.log(33);
  const response = await fetch(
    `https://api.github.com/repos/Nik0gda/TopPubg/commits/master`
  );
  const jsonedResponse = await response.json();
  console.log(jsonedResponse);
});

chrome.runtime.onInstalled.addListener(async function () {
  console.log(33);
  const response = await fetch(
    `https://api.github.com/repos/Nik0gda/TopPubg/commits/master`
  );
  const jsonedResponse = await response.json();
  console.log(jsonedResponse);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.requested == "getClassName") {
    chrome.storage.sync.get(["key"], function (result) {
      sendResponse({ className: result });
    });
  }
});
