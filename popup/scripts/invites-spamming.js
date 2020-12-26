window.addEventListener("load", (event) => {
  document.getElementById("saveSettings").addEventListener("click", save);
  document.getElementById("startSpamming").addEventListener("click", startSpam);
  document
    .getElementById("resetCounter")
    .addEventListener("click", resetCounter);
  document.getElementById("collect").addEventListener("click", startCollecting);
  var snackbar = document.querySelector("#snackbar");
  setFavouriteStatus();
  checkForUpdate();
  load();
});

const checkForUpdate = async () => {
  console.log();
  const downloadTime = getDownloadTime();
  const request = await fetch(
    "https://api.github.com/repos/Nik0gda/liext/commits/master"
  );
  const commitTime = new Date(
    Date.parse((await request.json()).commit.committer.date)
  );
  console.log(downloadTime, commitTime);
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
  const ids = ["nextUser", "clickMessage", "insertMessage", "clickSend"];
  const settings = {};
  const snackbarSettings = { message: "", timeout: 2000 };
  for (const id of ids) {
    const text = document.getElementById(id).value.split("-");
    if (isNaN(parseInt(text[0])) || isNaN(parseInt(text[1]))) {
      saveError = `${id} field must contain only numbers and dashes( - )!`;
    }
    settings[id] = { min: text[0], max: text[1] };
  }
  for ([id, variableName] of [
    ["switch", "other"],
    ["switchR", "messageResponded"],
  ])
    if (document.getElementById(id).classList.contains("is-checked")) {
      settings[variableName] = true;
    } else {
      settings[variableName] = false;
    }
  settings["message"] = document.getElementById("message").value;
  settings["limitLi"] = document.getElementById("limitLi").value;
  if (saveError) {
    snackbarSettings["message"] = saveError;
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
    return;
  }
  chrome.storage.local.set({ invitesSpamSettings: settings }, function (err) {
    if (err) {
      snackbarSettings["message"] = err.message;
    } else {
      snackbarSettings["message"] = "Settings were successfully saved";
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};

const resetCounter = () => {
  chrome.storage.local.set({ counterAcceptedInvitesSpam: 0 }, (err) => {
    const snackbarSettings = { message: "Counter resetted", timeout: 2000 };
    document.getElementById("counter").innerHTML = `Profiles Proccessed: 0`;
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
  ];
  chrome.storage.local.get(["invitesSpamSettings"], async (obj) => {
    if (!obj) {
      return;
    }
    obj = obj["invitesSpamSettings"];
    try {
      for (id of ["limitLi", "message"]) {
        if (obj[id]) {
          document.getElementById(id).value = obj[id];
          document.getElementById(id).parentElement.classList.add("is-dirty");
        }
      }
      if (obj.other) {
        document.getElementById("switch").classList.add("is-checked");
      }
      if (obj.messageResponded) {
        document.getElementById("switchR").classList.add("is-checked");
      }
      for (const id of ids) {
        if (obj[id]) {
          document.getElementById(id).parentElement.classList.add("is-dirty");
          document.getElementById(
            id
          ).value = `${obj[id]["min"]}-${obj[id]["max"]}`;
        }
      }
    } catch (e) {}
    let successufulProfiles = await getDb(
      "counterAcceptedInvitesSpamSuccessuful"
    );
    if (!successufulProfiles) {
      successufulProfiles = 0;
      chrome.storage.local.set({ counterAcceptedInvitesSpamSuccessuful: 0 });
    }
    document.getElementById(
      "successufulProfiles"
    ).innerHTML = `Profiles successuful: ${successufulProfiles}`;
    let failed = await getDb("counterAcceptedInvitesSpamFailed");
    if (!failed) {
      failed = 0;
      chrome.storage.local.set({ counterAcceptedInvitesSpamFailed: 0 });
    }
    document.getElementById(
      "failedProfiles"
    ).innerHTML = `Profiles failed: ${failed}`;
    chrome.storage.local.get(["collectState"], (obj) => {
      console.log(obj);
      if (!obj) {
        chrome.storage.local.set({ collectState: false });
      } else {
        if (obj.collectState == true) {
          document
            .getElementById("collect")
            .classList.remove("mdl-button--colored");
          document.getElementById("collect").innerHTML =
            "Stop Collecting Profiles";
        } else {
          document
            .getElementById("collect")
            .classList.add("mdl-button--colored");
          document.getElementById("collect").innerHTML =
            "Start Collecting Profiles";
        }
      }
    });
    chrome.storage.local.get(["spamAcceptedInvites"], (obj) => {
      if (!obj) {
        chrome.storage.local.set({ spamAcceptedInvites: false });
      } else {
        if (obj.spamAcceptedInvites == true) {
          document
            .getElementById("startSpamming")
            .classList.remove("mdl-button--colored");
          document.getElementById("startSpamming").innerHTML = "Stop Spamming";
        } else {
          document
            .getElementById("startSpamming")
            .classList.add("mdl-button--colored");
          document.getElementById("startSpamming").innerHTML = "Start Spamming";
        }
      }
    });
  });
  chrome.storage.local.get(["invitesSpamProfiles"], (obj) => {
    if (!obj["invitesSpamProfiles"]) {
      const tobj = [];
      chrome.storage.local.set({ invitesSpamProfiles: [] });
      obj["invitesSpamProfiles"] = [];
    }
    document.getElementById("loadedProfiles").innerHTML = `Profiles loaded: ${
      obj["invitesSpamProfiles"].length || 0
    }`;
  });
  chrome.storage.local.get(["counterAcceptedInvitesSpamFailed"], (obj) => {
    if (!obj["counterAcceptedInvitesSpamFailed"]) {
      chrome.storage.local.set({ counterAcceptedInvitesSpamFailed: 0 });
      obj["counterAcceptedInvitesSpamFailed"] = 0;
    }
    document.getElementById(
      "failedProfiles"
    ).innerHTML = `Profiles failed: ${obj["counterAcceptedInvitesSpamFailed"]}`;
  });
  chrome.storage.local.get(["counterAcceptedInvitesSpam"], (obj) => {
    if (!obj["counterAcceptedInvitesSpam"]) {
      chrome.storage.local.set({ counterAcceptedInvitesSpam: 0 });
      obj["counterAcceptedInvitesSpam"] = 0;
    }
    document.getElementById(
      "counter"
    ).innerHTML = `Profiles Proccessed: ${obj["counterAcceptedInvitesSpam"]}`;
  });
};

const startSpam = () => {
  chrome.storage.local.get(["spamAcceptedInvites"], (obj) => {
    if (!obj) {
      chrome.storage.local.set({ spamAcceptedInvites: false }, () => {
        obj.spamAcceptedInvites = false;
      });
    } else {
      obj = obj.spamAcceptedInvites;
    }
    if (!obj) {
      chrome.runtime.sendMessage(
        { command: "spamAcceptedInvites" },
        (response) => {
          if (response.result == "Started Spamming") {
            document
              .getElementById("startSpamming")
              .classList.remove("mdl-button--colored");
            document.getElementById("startSpamming").innerHTML =
              "Stop Spamming";
          }
        }
      );
    } else {
      chrome.storage.local.set({ spamAcceptedInvites: false });
      document
        .getElementById("startSpamming")
        .classList.add("mdl-button--colored");
      document.getElementById("startSpamming").innerHTML = "Start Spamming";
    }
  });
};

const startCollecting = () => {
  chrome.storage.local.get(["collectState"], (obj) => {
    if (!obj) {
      chrome.storage.local.set({ collectState: false }, () => {
        obj.collectState = false;
      });
    } else {
      obj = obj.collectState;
    }
    if (!obj) {
      chrome.storage.local.set({ counterAcceptedInvitesProfile: 0 });
      chrome.storage.local.set({ invitesSpamProfiles: [] });
      chrome.runtime.sendMessage({ command: "collectInit" }, (response) => {
        if (response.result == "Started Spamming") {
          document
            .getElementById("collect")
            .classList.remove("mdl-button--colored");
          document.getElementById("collect").innerHTML =
            "Stop Collecting Profiles";
        }
      });
    } else {
      chrome.storage.local.set({ collectState: false });
      document.getElementById("collect").classList.add("mdl-button--colored");
      document.getElementById("collect").innerHTML =
        "Start Collecting Profiles";
    }
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { command } = request;
  if (command === "spammedAcceptedInvites") {
    chrome.storage.local.set({
      spamAcceptedInvites: false,
    });
    document
      .getElementById("startSpamming")
      .classList.add("mdl-button--colored");
    document.getElementById("startSpamming").innerHTML = "Start Spamming";
    return;
  }
  if (command === "collectedAcceptedInvites") {
    chrome.storage.local.set({
      collectState: false,
    });
    document.getElementById("collect").classList.add("mdl-button--colored");
    document.getElementById("collect").innerHTML = "Start Spamming";
    return;
  }
});
