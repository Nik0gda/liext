chrome.webRequest.onCompleted.addListener(
  async (details) => {
    const { url } = details;
    const first = url.substring(0, url.lastIndexOf("/") + 1);

    if (
      first === "https://www.linkedin.com/voyager/api/identity/miniprofiles/"
    ) {
      if ((await getDb("collectState")) === false) return;

      const id = url.substring(url.lastIndexOf("/") + 1, url.length);

      let collectedArray = (await getDb("invitesSpamProfiles")) || [];
      if (collectedArray.includes(id)) return;
      if (((await getDb("invitesSpamSettings")) || {}).other) {
        let invitesSentArray = (await getDb("FUProfilesInvites")) || [];
        if (!invitesSentArray.find((x) => x.sn_hash_id === id)) return;
      }

      collectedArray.push(id);
      console.log(collectedArray);
      await new Promise((resolve) => {
        chrome.storage.local.set(
          { invitesSpamProfiles: collectedArray },
          resolve
        );
      });
      console.log(id);
    }
  },
  {
    urls: ["<all_urls>"],
  }
);
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(request);
  if (request.command === "spamLi") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set({
      spamLi: true,
    });
    liSpamProfiles();
  }
  if (request.command === "collectInit") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set({
      collectState: true,
    });
    collectConnections();
  }

  if (request.command === "spamAcceptedInvites") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set({
      spamAcceptedInvites: true,
    });
    const acceptedInvitesVarNames = [
      "invitesSpamProfiles",
      "counterAcceptedInvitesProfile",
      "spamAcceptedInvites",
      "invitesSpamSettings",
      "counterAcceptedInvitesSpam",
      "counterAcceptedInvitesSpamFailed",
      "counterAcceptedInvitesSpamSuccessuful",
      "spamAcceptedInviteOneProfile",
      "spammedAcceptedInvites",
    ];
    spamAcceptedInvites(acceptedInvitesVarNames);
  }

  if (request.command === "spamInvites") {
    sendResponse({
      result: "Started Spamming",
    });

    chrome.storage.local.set({
      spamInvites: true,
    });
    const x = [
      "invitesProfiles",
      "invitesProfilesCounter",
      "spamInvites",
      "invitesSettings",
      "counterInvitesSpam",
      "FUProfilesInvites",
      "counterInvitesFailed",
      "spamInvitesOneProfile",
      "spammedInvites",
    ];
    for (i of x) {
      const idb = await getDb(i);
      console.log(`${i}: ${idb}`);
    }

    spamProfiles(x);
  }
});

// DON'T SCROLL DOWN IF YOU HAVE HEART RELATED PROBLEMS
// COPY-PASTED CODE WARNING
const spamAcceptedInvites = async ([
  profilesName,
  indexName,
  stateName,
  settingsName,
  counterName,
  failed,
  success,
  fnMessage,
  finalCommand,
]) => {
  let profiles = await getDb(profilesName);
  let index = await profilesCounterGetter(indexName);
  state = await getDb(stateName);
  let settings = await getDb(settingsName);
  let counter = await getDb(counterName);
  console.table(state, profiles, index, counter, settings.limitLi);
  while (
    state !== false &&
    index < profiles.length &&
    counter < parseInt(settings.limitLi)
  ) {
    const tab = await getCurrentTab();
    const profile = profiles[index];
    await spamOnePageLink(`https://www.linkedin.com/in/${profile}/`, tab);
    const code = await spamOnePageMessage(settings, tab, fnMessage);
    index++;
    await new Promise((resolve) =>
      chrome.storage.local.set({ [indexName]: index }, () => resolve())
    );
    await updateCounter(counterName);
    console.log(code);
    if (code === 0) {
      await updateCounter(success);
    }
    if (code === 1) {
      await updateCounter(failed);
    }
    if (code === 2) {
      await updateCounter(failed);
    }

    profiles = await getDb(profilesName);
    index = await profilesCounterGetter(indexName);
    state = await getDb(stateName);
    settings = await getDb(settingsName);
    counter = await getDb(counterName);
    console.log(`counter: ${counter}; limit: ${settings.limitLi}`);
  }

  chrome.runtime.sendMessage({
    command: finalCommand,
  });

  chrome.storage.local.set({
    [stateName]: false,
  });
};

const collectConnections = async () => {
  const tab = await getCurrentTab();
  await spamOnePageLink(
    `https://www.linkedin.com/mynetwork/invite-connect/connections/`,
    tab
  );
  await collectInvitesAccepted(tab);
  console.log("ended");
  chrome.runtime.sendMessage({
    command: "collectedAcceptedInvites",
  });
};

const spamProfiles = async ([
  profilesName,
  indexName,
  stateName,
  settingsName,
  counterName,
  fu,
  failed,
  fnMessage,
  finalCommand,
]) => {
  let profiles = await getDb(profilesName);
  let index = await profilesCounterGetter(indexName);
  state = await getDb(stateName);
  let settings = await getDb(settingsName);
  let counter = await getDb(counterName);
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
    const { code } = await spamOnePageMessage(profile, tab, fnMessage);
    index++;
    await new Promise((resolve) =>
      chrome.storage.local.set({ [indexName]: index }, () => resolve())
    );
    await updateCounter(counterName);

    if (code === 0) {
      let FUProfiles = await getDb(fu);
      if (!FUProfiles) FUProfiles = [];
      if (!FUProfiles.find((x) => x.sn_hash_id == profile.sn_hash_id))
        FUProfiles.push(profile);
      chrome.storage.local.set({ [fu]: FUProfiles });
    } else if (code === 1) {
      await updateCounter(failed);
    }

    profiles = await getDb(profilesName);
    index = await profilesCounterGetter(indexName);
    state = await getDb(stateName);
    settings = await getDb(settingsName);
    counter = await getDb(counterName);
    console.log(`counter: ${counter}; limit: ${settings.limitLi}`);
  }

  chrome.runtime.sendMessage({
    command: finalCommand,
  });

  chrome.storage.local.set({
    [stateName]: false,
  });
};

const liSpamProfiles = async () => {
  let profiles = await getDb("liSpamProfiles");
  let index = await profilesCounterGetter("liSpamProfilesCounter");
  state = await getDb("spamLi");
  let settings = await getDb("liInmailSettings");
  let counter = await getDb("counterLiSpam");

  console.log(profiles, index, state, settings, counter);
  while (
    state !== false &&
    index < profiles.length &&
    counter < parseInt(settings.limitLi)
  ) {
    let tab = await getCurrentTab();
    const profile = profiles[index];

    await spamOnePageLink(
      `https://www.linkedin.com/in/${profile.sn_hash_id}/`,
      tab
    );

    let code = await spamOnePageMessage(profile, tab, "spamLiOneProfile");

    if (code === 2) {
      console.log("error catched");
      await sleep(5000);
      tab = await getCurrentTab();
      if (tab.url.split("/")[3] === "messaging") {
        code = await spamOnePageMessage(
          profile,
          tab,
          "spamLiOneProfileWriteMessage"
        );
        if (code === 2) code = 1;
      }
    }
    index++;
    await new Promise((resolve) =>
      chrome.storage.local.set({ liSpamProfilesCounter: index }, () =>
        resolve()
      )
    );
    await updateCounter("counterLiSpam");

    if (code === 0) {
      const FUProfiles = await getDb("FUProfiles");
      if (!FUProfiles.find((x) => x.sn_hash_id == profile.sn_hash_id))
        FUProfiles.push(profile);
      chrome.storage.local.set({ FUProfiles: FUProfiles });
    } else if (code === 1) {
      await updateCounter("counterLiSpamFailed");
    }
    profiles = await getDb("liSpamProfiles");
    index = await profilesCounterGetter("liSpamProfilesCounter");
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

const spamOnePageMessage = (data, tab, commandName) => {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(
        tab.id,
        { command: commandName, data: data },
        (response) => {
          const { lastError } = chrome.runtime;
          if (lastError) {
            const { message } = lastError;
            if (
              message ==
              "The message port closed before a response was received."
            )
              resolve(2);
          }
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

const collectInvitesAccepted = (tab) => {
  return new Promise((resolve) => {
    try {
      console.log(tab.id);
      chrome.tabs.sendMessage(
        tab.id,
        { command: "collectConnections" },
        (response) => {
          console.log(response);
          try {
            if (response.result == "collected") {
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

const profilesCounterGetter = (objectName) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([objectName], async (obj) => {
      if (obj[objectName]) {
        resolve(obj[objectName]);
        return;
      }
      await new Promise((rresolve) =>
        chrome.storage.local.set({ [objectName]: 0 }, () => {
          rresolve();
        })
      );
      resolve(0);
    });
  });
};

const updateCounter = async (objectName) => {
  return new Promise(async (resolve) => {
    let counter = await getDb(objectName);
    chrome.storage.local.set({ [objectName]: counter + 1 }, () => resolve());
  });
};

const getDb = (fieldName) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([fieldName], function (obj) {
      resolve(obj[fieldName]);
    });
  });
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
