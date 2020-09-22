window.addEventListener("load", event => {
  document.getElementById("saveSettings").addEventListener("click", save);
  document.getElementById("startSpamming").addEventListener("click", startSpam);
  load();
});

const save = () => {
  const ids = ["nextUser", "clickMessage", "insertTitle", "insertMessage", "clickSend", "closeWindow"];
  const settings = {};
  for (const id of ids) {
    const text = document.getElementById(id).value.split("-");
    settings[id] = { min: text[0], max: text[1] };
  }
  if (document.getElementById("switch").classList.contains("is-checked")) {
    settings["other"] = true;
  } else {
    settings["other"] = false;
  }
  settings["message"] = document.getElementById("messageContent").value;
  settings["title"] = document.getElementById("subject").value;
  chrome.storage.local.set({ settings: settings }, function() {
    //  data saved popup
  });
  console.log(settings);
};

const load = () => {
  const ids = ["nextUser", "clickMessage", "insertTitle", "insertMessage", "clickSend", "closeWindow"];
  chrome.storage.local.get(["settings"], function(obj) {
    if (!obj) {
      return;
    }
    console.log(obj);
    obj = obj["settings"];
    document.getElementById("subject").value = obj["title"];
    document.getElementById("messageContent").value = obj["message"];
    document.getElementById("messageContent").parentElement.classList.add("is-dirty");
    console.log(obj.other);
    if (obj.other) {
      document.getElementById("switch").classList.add("is-checked");
    }
    for (const id of ids) {
      document.getElementById(id).parentElement.classList.add("is-dirty");
      document.getElementById(id).value = `${obj[id]["min"]}-${obj[id]["max"]}`;
    }
    chrome.storage.local.get(["spam"], function(obj) {
      if (!obj) {
        chrome.storage.local.set({ spam: false }, function() {});
      } else {
        if (obj.spam == true) {
          document.getElementById("startSpamming").classList.remove("mdl-button--colored");
          document.getElementById("startSpamming").value = "Stop Spamming";
        }
      }
    });
  });
};

const startSpam = () => {
  chrome.storage.local.get(["spam"], function(obj) {
    if (!obj) {
      chrome.storage.local.set({ spam: false }, function() {
        obj = false;
      });
    } else {
      obj = obj.spam;
    }
    if (!obj) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { command: "spam" }, response => {
          if (response.result == "Started Spamming") {
            document.getElementById("startSpamming").classList.remove("mdl-button--colored");
            document.getElementById("startSpamming").innerHTML = "Stop Spamming";
          }
        });
      });
    } else {
      chrome.storage.local.set({ spam: false }, function() {});
      document.getElementById("startSpamming").classList.add("mdl-button--colored");
      document.getElementById("startSpamming").innerHTML = "Start Spamming";
    }
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "spammed") {
    document.getElementById("startSpamming").classList.add("mdl-button--colored");
    document.getElementById("startSpamming").innerHTML = "Start Spamming";
  }
  console.log(request);
});
