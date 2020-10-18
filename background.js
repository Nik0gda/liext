// function randomString(len) {
//   charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
//   var randomString = "";
//   for (var i = 0; i < len; i++) {
//     var randomPoz = Math.floor(Math.random() * charSet.length);
//     randomString += charSet.substring(randomPoz, randomPoz + 1);
//   }
//   return randomString;
// }

// chrome.runtime.onStartup.addListener(async function () {
//   console.log(33);
//   const response = await fetch(
//     `https://api.github.com/repos/Nik0gda/TopPubg/commits/master`
//   );
//   const jsonedResponse = await response.json();
//   console.log(jsonedResponse);
// });

// chrome.runtime.onInstalled.addListener(async function () {
//   console.log(33);
//   const response = await fetch(
//     `https://api.github.com/repos/Nik0gda/TopPubg/commits/master`
//   );
//   const jsonedResponse = await response.json();
//   console.log(jsonedResponse);
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.requested == "getClassName") {
//     chrome.storage.sync.get(["key"], function (result) {
//       sendResponse({ className: result });
//     });
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "spamLi") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set({
      spamLi: true,
    });
    liSpamProfiles();
  }
});

const liSpamProfiles = async () => {
  let profiles = await getDb("liSpamProfiles");
  let index = await liSpamProfilesCounterGetter();
  state = await getDb("spamLi");
  let settings = await getDb("liInmailSettings");
  let counter = await getDb("counterLiSpam");

  console.log(profiles, index, state, settings, counter);
  while (
    state !== false &&
    index < profiles.sn_hash_id.length &&
    counter < parseInt(settings.limitLi)
  ) {
    const tab = await getCurrentTab();
    const profile = {
      sn_hash_id: profiles.sn_hash_id[index],
      last_name: profiles.last_name[index],
      first_name: profiles.first_name[index],
      company_name: profiles.current_company[index],
    };

    await spamOnePageLink(
      `https://www.linkedin.com/in/${profile.sn_hash_id}/`,
      tab
    );
    // await new Promise((resolve) => setTimeout(resolve, 5000));

    const code = await spamOnePageMessage(profile, tab);
    index++;
    await new Promise((resolve) =>
      chrome.storage.local.set({ liSpamProfilesCounter: index }, () =>
        resolve()
      )
    );
    await updateCounter();
    if (code) {
      await updateErrorCounter();
    } else {
      const FUProfiles = await getDb("FUProfiles");
      FUProfiles.push(profile);
      chrome.storage.local.set({ FUProfiles: FUProfiles });
    }
    profiles = await getDb("liSpamProfiles");
    index = await liSpamProfilesCounterGetter();
    state = await getDb("spamLi");
    settings = await getDb("liInmailSettings");
    counter = await getDb("counterLiSpam");
  }
  chrome.runtime.sendMessage({
    command: "spammedLi",
  });
  chrome.storage.local.set({
    spamLi: false,
  });
};

const spamOnePageMessage = (profile, tab) => {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(
        tab.id,
        { command: "spamLiOneProfile", profile: profile },
        (response) => {
          try {
            if (response.result == "Spammed") {
              resolve(response.code);
            }
          } catch (err) {
            resolve(1);
          }
        }
      );
    } catch (err) {
      resolve(1);
    }
  });
};

const spamOnePageLink = async (link, tab) => {
  chrome.tabs.update(tab.id, { url: link });
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function onUpdated(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    });
  });
};

const getCurrentTab = async () => {
  return new Promise((resolve) =>
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    })
  );
};

const liSpamProfilesCounterGetter = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["liSpamProfilesCounter"], async (obj) => {
      if (obj.liSpamProfilesCounter) {
        resolve(obj.liSpamProfilesCounter);
        return;
      }
      await new Promise((rresolve) =>
        chrome.storage.local.set({ liSpamProfilesCounter: 0 }, () => {
          rresolve();
        })
      );
      resolve(0);
    });
  });
};

const updateErrorCounter = async () => {
  return new Promise(async (resolve) => {
    let counter = await getDb("counterLiSpamFailed");
    chrome.storage.local.set({ counterLiSpamFailed: counter + 1 }, () =>
      resolve()
    );
  });
};

const updateCounter = async () => {
  return new Promise(async (resolve) => {
    let counter = await getDb("counterLiSpam");
    chrome.storage.local.set({ counterLiSpam: counter + 1 }, () => resolve());
  });
};

const getDb = (fieldName) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([fieldName], function (obj) {
      resolve(obj[fieldName]);
    });
  });
};
