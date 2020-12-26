window.addEventListener("load", (event) => {
  document.getElementById("saveSettings").addEventListener("click", save);
  document.getElementById("startSpamming").addEventListener("click", startSpam);
  document
    .getElementById("resetCounter")
    .addEventListener("click", resetCounter);
  document.getElementById("fileUpload").onchange = showFile;

  var snackbar = document.querySelector("#snackbar");
  setFavouriteStatus();
  checkForUpdate();
  load();
});

const showFile = async (e) => {
  let proccessed =
    (await new Promise((resolve) => {
      chrome.storage.local.get(["FUProfilesInvites"], function (obj) {
        resolve(obj["FUProfilesInvites"]);
      });
    })) || [];
  const indexesToFind = [
    "sn_hash_id",
    "first_name",
    "last_name",
    "current_company",
  ];
  const parsed = [];
  let indexes = [];
  const input = e.target;
  let file = input.files[0];
  let content = await file.text();
  content = $.csv.toArrays(content);
  console.log(content);
  for (let i = 0; i < 4; i++) {
    indexes[i] = content[0].indexOf(indexesToFind[i]);
  }
  for (let i = 1; i < content.length; i++) {
    let o = {};
    for (let y = 0; y < 4; y++) {
      if (y == 0) o[indexesToFind[y]] = content[i][indexes[y]].split(",")[0];
      else o[indexesToFind[y]] = content[i][indexes[y]];
    }
    if (!proccessed.some((s) => s["sn_hash_id"] === o["sn_hash_id"]))
      parsed.push(o);
  }
  await new Promise((resolve) =>
    chrome.storage.local.set({ invitesProfilesCounter: 0 }, () => resolve())
  );
  await new Promise((resolve) =>
    chrome.storage.local.set({ counterInvitesFailed: 0 }, () => resolve())
  );
  chrome.storage.local.set({ invitesProfiles: parsed }, async (err) => {
    const snackbarSettings = {
      message: "Profiles Uploaded",
      timeout: 3 * 1000,
    };
    if (err) {
      snackbarSettings["message"] = err.message;
    } else {
      load();
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};

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
  settings["message"] = document.getElementById("message").value;
  settings["limitLi"] = document.getElementById("limitLi").value;
  if (saveError) {
    snackbarSettings["message"] = saveError;
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
    return;
  }
  chrome.storage.local.set({ invitesSettings: settings }, function (err) {
    if (err) {
      snackbarSettings["message"] = err.message;
    } else {
      snackbarSettings["message"] = "Settings were successfully saved";
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};

const resetCounter = () => {
  chrome.storage.local.set({ counterInvitesSpam: 0 }, (err) => {
    const snackbarSettings = { message: "Counter resetted", timeout: 2000 };
    document.getElementById("counter").innerHTML = `Profiles Proccessed: 0`;
    if (err) {
      snackbarSettings.message = err.message;
    }
    snackbar.MaterialSnackbar.showSnackbar(snackbarSettings);
  });
};
const load = () => {
  const ids = ["nextUser", "clickMessage", "insertMessage", "clickSend"];
  chrome.storage.local.get(["invitesSettings"], async (obj) => {
    if (!obj) {
      return;
    }
    obj = obj["invitesSettings"];
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
      for (const id of ids) {
        if (obj[id]) {
          document.getElementById(id).parentElement.classList.add("is-dirty");
          document.getElementById(
            id
          ).value = `${obj[id]["min"]}-${obj[id]["max"]}`;
        }
      }
    } catch (e) {}

    let failed = await getDb("failedInvites");
    if (!failed) {
      failed = 0;
      chrome.storage.local.set({ failedInvites: 0 });
    }
    document.getElementById(
      "failedProfiles"
    ).innerHTML = `Profiles failed: ${failed}`;

    chrome.storage.local.get(["spamInvites"], (obj) => {
      if (!obj) {
        chrome.storage.local.set({ spamInvites: false });
      } else {
        if (obj.spamInvites == true) {
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
  chrome.storage.local.get(["invitesProfiles"], (obj) => {
    if (!obj["invitesProfiles"]) {
      const tobj = {
        sn_hash_id: [],
        first_name: [],
        last_name: [],
        current_company: [],
      };
      chrome.storage.local.set({ invitesProfiles: tobj });
      obj["invitesProfiles"] = tobj;
    }
    document.getElementById("loadedProfiles").innerHTML = `Profiles loaded: ${
      obj["invitesProfiles"].length || 0
    }`;
  });
  chrome.storage.local.get(["counterInvitesSpamFailed"], (obj) => {
    if (!obj["counterInvitesSpamFailed"]) {
      chrome.storage.local.set({ counterLiSpamFailed: 0 });
      obj["counterInvitesSpamFailed"] = 0;
    }
    document.getElementById(
      "failedProfiles"
    ).innerHTML = `Profiles failed: ${obj["counterInvitesSpamFailed"]}`;
  });
  chrome.storage.local.get(["counterInvitesSpam"], (obj) => {
    if (!obj["counterInvitesSpam"]) {
      chrome.storage.local.set({ counterInvitesSpam: 0 });
      obj["counterInvitesSpam"] = 0;
    }
    document.getElementById(
      "counter"
    ).innerHTML = `Profiles Proccessed: ${obj["counterInvitesSpam"]}`;
  });
};

const startSpam = () => {
  chrome.storage.local.get(["spamInvites"], (obj) => {
    console.log(obj);
    if (!obj) {
      chrome.storage.local.set({ spamInvites: false }, () => {
        obj.spamInvites = false;
      });
    } else {
      obj = obj.spamInvites;
    }
    console.log(obj);
    if (!obj) {
      chrome.runtime.sendMessage({ command: "spamInvites" }, (response) => {
        console.log(response);
        if (response.result == "Started Spamming") {
          document
            .getElementById("startSpamming")
            .classList.remove("mdl-button--colored");

          document.getElementById("startSpamming").innerHTML = "Stop Spamming";
        }
        return;
      });
    } else {
      chrome.storage.local.set({ spamInvites: false });
      document
        .getElementById("startSpamming")
        .classList.add("mdl-button--colored");
      document.getElementById("startSpamming").innerHTML = "Start Spamming";
    }
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { command } = request;
  if (command === "spammedInvites") {
    chrome.storage.local.set({
      spamLi: false,
    });
    document
      .getElementById("startSpamming")
      .classList.add("mdl-button--colored");
    document.getElementById("startSpamming").innerHTML = "Start Spamming";
    return;
  }
});
