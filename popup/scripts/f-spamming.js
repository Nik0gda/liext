window.addEventListener("load", (event) => {
  document.getElementById("saveSettings").addEventListener("click", save);
  document.getElementById("startSpamming").addEventListener("click", startSpam);
  document
    .getElementById("resetCounter")
    .addEventListener("click", resetCounter);
  var snackbar = document.querySelector("#snackbar");
  checkForUpdate();
  load();
});

const checkForUpdate = async () => {
  const downloadTime = getDownloadTime();
  const request = await fetch(
    "https://api.github.com/repos/Nik0gda/liext/commits/master"
  );
  const commitTime = new Date(
    Date.parse((await request.json()).commit.committer.date)
  );
  if (downloadTime < commitTime) {
    const snackbarSettings = {
      message: "New version available",
      timeout: 60 * 60 * 1000,
    };
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  }
};

const save = () => {
  let saveError = "";
  const ids = [
    "nextUser",
    "clickMessage",
    "insertTitle",
    "insertMessage",
    "clickSend",
    "closeWindow",
  ];
  const settings = {};
  const snackbarSettings = { message: "", timeout: 2000 };
  for (const id of ids) {
    const text = document.getElementById(id).value.split("-");
    if (isNaN(parseInt(text[0])) || isNaN(parseInt(text[1]))) {
      saveError = `${id} field must contain only numbers and dashes( - )!`;
    }
    settings[id] = { min: text[0], max: text[1] };
  }
  if (document.getElementById("switch").classList.contains("is-checked")) {
    settings["other"] = true;
  } else {
    settings["other"] = false;
  }
  settings["message"] = document.getElementById("messageContent").value;
  settings["title"] = document.getElementById("subject").value;
  settings["limit"] = document.getElementById("limit").value;
  if (saveError) {
    snackbarSettings["message"] = saveError;
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
    return;
  }
  chrome.storage.local.set({ settings: settings }, function (err) {
    if (err) {
      snackbarSettings["message"] = err.message;
    } else {
      snackbarSettings["message"] = "Settings were successfully saved";
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};

const resetCounter = () => {
  chrome.storage.local.set({ counter: 0 }, (err) => {
    const snackbarSettings = { message: "Counter resetted", timeout: 2000 };
    if (err) {
      snackbarSettings.message = err.message;
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};
const load = () => {
  const ids = [
    "nextUser",
    "clickMessage",
    "insertTitle",
    "insertMessage",
    "clickSend",
    "closeWindow",
  ];
  chrome.storage.local.get(["settings"], (obj) => {
    if (!obj) {
      return;
    }
    obj = obj["settings"];
    console.log(obj);
    document.getElementById("subject").value = obj["title"];
    for (id of ["limit", "message"]) {
      if (obj[id]) {
        document.getElementById(id).value = obj[id];
        document.getElementById(id).parentElement.classList.add("is-dirty");
      }
    }
    if (obj.other) {
      document.getElementById("switch").classList.add("is-checked");
    }
    for (const id of ids) {
      console.log(obj[id]);
      if (obj[id]) {
        document.getElementById(id).parentElement.classList.add("is-dirty");
        document.getElementById(
          id
        ).value = `${obj[id]["min"]}-${obj[id]["max"]}`;
      }
    }
    document.getElementById(id).parentElement.classList.add("is-dirty");

    chrome.storage.local.get(["spam"], (obj) => {
      if (!obj) {
        chrome.storage.local.set({ spam: false });
      } else {
        if (obj.spam == true) {
          document
            .getElementById("startSpamming")
            .classList.remove("mdl-button--colored");
          document.getElementById("startSpamming").value = "Stop Spamming";
        } else {
          document
            .getElementById("startSpamming")
            .classList.add("mdl-button--colored");
          document.getElementById("startSpamming").value = "Start Spamming";
        }
      }
    });
  });
  chrome.storage.local.get(["counter"], (obj) => {
    if (!obj["counter"]) {
      obj["counter"] = 0;
    }
    document.getElementById(
      "counter"
    ).innerHTML = `Profiles Proccessed: ${obj["counter"]}`;
  });
};

const startSpam = () => {
  chrome.storage.local.get(["spam"], (obj) => {
    if (!obj) {
      chrome.storage.local.set({ spam: false }, () => {
        obj = false;
      });
    } else {
      obj = obj.spam;
    }
    if (!obj) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { command: "spam" }, (response) => {
          if (response.result == "Started Spamming") {
            document
              .getElementById("startSpamming")
              .classList.remove("mdl-button--colored");
            document.getElementById("startSpamming").innerHTML =
              "Stop Spamming";
          }
        });
      });
    } else {
      chrome.storage.local.set({ spam: false });
      document
        .getElementById("startSpamming")
        .classList.add("mdl-button--colored");
      document.getElementById("startSpamming").innerHTML = "Start Spamming";
    }
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "spammed") {
    document
      .getElementById("startSpamming")
      .classList.add("mdl-button--colored");
    document.getElementById("startSpamming").innerHTML = "Start Spamming";
  }
  console.log(request);
});
