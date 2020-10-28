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
    index < profiles.length &&
    counter < parseInt(settings.limitLi)
  ) {
    const tab = await getCurrentTab();
    const profile = profiles[index];

    await spamOnePageLink(
      `https://www.linkedin.com/in/${profile.sn_hash_id}/`,
      tab
    );
    const code = await spamOnePageMessage(profile, tab);
    index++;
    await new Promise((resolve) =>
      chrome.storage.local.set({ liSpamProfilesCounter: index }, () =>
        resolve()
      )
    );
    await updateCounter();

    if (code === 0) {
      const FUProfiles = await getDb("FUProfiles");
      if (!FUProfiles.find((x) => x.sn_hash_id == profile.sn_hash_id))
        FUProfiles.push(profile);
      chrome.storage.local.set({ FUProfiles: FUProfiles });
    } else if (code === 1) {
      await updateErrorCounter();
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
