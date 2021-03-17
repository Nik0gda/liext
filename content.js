const checkForLogout = async () => {
  if (
    document.location.href.split("/")[3].includes("authwall") ||
    document.location.href.split("/")[3] === "checkpoint" ||
    document.location.href.split("/")[3] === "signup"
  ) {
    if (await getDb("spamLi"))
      chrome.runtime.sendMessage({ command: "spammedLi" });
    chrome.storage.local.set({ spamLi: false });
    if (await getDb("spamInvites"))
      chrome.runtime.sendMessage({ command: "spammedInvites" });
    chrome.storage.local.set({ spamInvites: false });
    if (await getDb("collectState"))
      chrome.runtime.sendMessage({ command: "collected" });
    chrome.storage.local.set({ collectState: false });
  }
};
checkForLogout();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  checkForLogout();
  console.log(request);
  if (request.command === "spam") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set({
      spam: true,
    });
    spamInMail(parseInt(prompt("How many pages?")));
  }
  if (request.command === "spamLiOneProfile") {
    spamLi(request.data).then((x) => {
      sendResponse(x);
    });

    return true;
  }
  if (request.command === "spamLiOneProfileWriteMessage") {
    console.log(33);
    spamLiWriteMessage(request.data).then((x) => {
      sendResponse(x);
    });
    return true;
  }
  if (request.command === "spamInvitesOneProfile") {
    spamInvite(request.data).then((x) => {
      sendResponse(x);
    });

    return true;
  }
  if (request.command === "spamAcceptedInviteOneProfile") {
    spamAcceptedInviteOneProfile(request.data).then((x) => {
      sendResponse(x);
    });
    return true;
  }
  if (request.command === "collectConnections") {
    collectConnections().then((x) => {
      sendResponse(x);
    });

    return true;
  }
});

const collectConnections = async () => {
  let code = 0;
  try {
    await scrollInvitesPage();
  } catch (err) {
    code = 1;
  }
  return {
    result: "collected",
    code,
  };
};

const spamLi = async ({ first_name, last_name, current_company }) => {
  try {
    let { clickMessage } = await new Promise((resolve) =>
      chrome.storage.local.get(["liInmailSettings"], (settings) =>
        resolve(settings.liInmailSettings)
      )
    );
    await closeMessageBoxes();
    // Clicking on the message button
    await randomSleep(clickMessage["min"], clickMessage["max"]);
    const topCard = document.querySelector("section.pv-top-card");
    try {
      const btn = topCard.getElementsByClassName("message-anywhere-button")[0];
      if (btn.parentElement.parentElement.tagName.toLocaleLowerCase() != "li") {
        btn.click();
      } else {
        throw "Didn't click";
      }
    } catch (err) {
      const liel = topCard
        .getElementsByClassName("artdeco-dropdown__content")[0]
        .getElementsByTagName("li");
      for (let i = 0; i < liel.length; i++) {
        if (liel[i].querySelector("a.message-anywhere-button"))
          liel[i].querySelector("a").click();
        if (liel[i].querySelector("button.pv-s-profile-actions--message"))
          liel[i].querySelector("button.pv-s-profile-actions--message").click();
      }
    }
    await randomSleep(2, 4);
    //getting the box with box and subject
    const { code } = await spamLiWriteMessage({ first_name, current_company });
    if (code === 1) throw new Error();
    return { result: "Spammed", code: 0 };
  } catch (err) {
    console.log(err);
    return {
      result: "Spammed",
      code: 1,
    };
  }
};

const spamLiWriteMessage = async ({ first_name, current_company }) => {
  try {
    let {
      message,
      subject,
      nextUser,
      insertTitle,
      insertMessage,
      clickSend,
    } = await new Promise((resolve) =>
      chrome.storage.local.get(["liInmailSettings"], (settings) =>
        resolve(settings.liInmailSettings)
      )
    );

    if (document.location.href.split("/")[3] === "messaging") {
      var box = document.getElementsByClassName(
        "msg-inmail-compose-form-v2"
      )[0];
      var subjectBox = box.getElementsByClassName(
        "msg-inmail-compose-form__subject-input"
      )[0];
      if (!subjectBox)
        subjectBox = box
          .getElementsByClassName("msg-form__subject-line")[0]
          .getElementsByTagName("input")[0];
    } else {
      var box = document.getElementsByClassName(
        "msg-overlay-conversation-bubble--is-active"
      )[0];

      //getting and setting value of subject
      var subjectBox = box
        .getElementsByClassName("msg-form__subject-line")[0]
        .getElementsByTagName("input")[0];
    }

    await randomSleep(insertTitle["min"], insertTitle["max"]);
    subjectBox.value = subject;
    subjectBox.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );

    const messageDiv = box.getElementsByClassName(
      "msg-form__message-texteditor"
    )[0];
    const messageBox = messageDiv.getElementsByClassName(
      "msg-form__contenteditable"
    )[0];

    await randomSleep(insertMessage["min"], insertMessage["max"]);

    // being able to send the messag
    const classListConstant = messageDiv.getElementsByClassName(
      "msg-form__placeholder"
    )[0].classList;
    classListConstant.remove("visible");
    classListConstant.add("hidden");
    box
      .getElementsByClassName("msg-form__send-button")[0]
      .removeAttribute("disabled");

    message = message
      .replace("{NAME}", first_name)
      .replace("{COMPANY}", current_company);

    messageBox.innerHTML = message
      .split(/[\r\n]/)
      .map((x) =>
        x.replace(/\s/g, "").length ? `<p>${x}</p>` : `<p><br/></p>`
      )
      .join(""); //inserting the message

    //click send button
    await randomSleep(clickSend["min"], clickSend["max"]);

    messageBox.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    box.getElementsByClassName("msg-form__send-button")[0].click();

    await randomSleep(nextUser["min"], nextUser["max"]);
    return { result: "Spammed", code: 0 };
  } catch (err) {
    console.log(err);
    return {
      result: "Spammed",
      code: 1,
    };
  }
};

const spamInvite = async ({ first_name, last_name, current_company }) => {
  try {
    let {
      message,
      nextUser,
      clickMessage,
      insertMessage,
      clickSend,
    } = await getDb("invitesSettings");
    console.log(await getDb("invitesSettings"));
    await closeMessageBoxes();
    await randomSleep(clickMessage["min"], clickMessage["max"]);

    //click connect
    const topCard = document.querySelector("section.pv-top-card");
    topCard.getElementsByClassName("pv-s-profile-actions--connect")[0].click();

    await randomSleep(2, 4);
    const modal = document.getElementById("artdeco-modal-outlet");

    if (!message.replace(/\s/g, "").length) {
      modal
        .querySelectorAll("button:not([data-test-modal-close-btn])")[1]
        .click();
      return { result: "Spammed", code: 0 };
    }

    // click 'Add note'
    modal.querySelector("button:not([data-test-modal-close-btn])").click();

    await randomSleep(insertMessage["min"], insertMessage["max"]);

    //composing the message and getting the textarea
    const messageBox = modal.querySelector("[name='message']");
    console.log(message);
    message = message
      .replace("{NAME}", first_name)
      .replace("{COMPANY}", current_company);
    console.log(message);
    console.log(messageBox);
    messageBox.value = message;

    //fire input event
    messageBox.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );
    console.log(clickSend);
    //click send button
    await randomSleep(clickSend["min"], clickSend["max"]);
    //modal.querySelectorAll("button:not([data-test-modal-close-btn])")[1].click()
    console.log(nextUser);
    await randomSleep(nextUser["min"], nextUser["max"]);
    console.log("ened");
    return { result: "Spammed", code: 0 };
  } catch (err) {
    console.log(err);
    return { result: "Spammed", code: 1 };
  }
};

spamAcceptedInviteOneProfile = async ({
  messageResponded,
  message,
  nextUser,
  clickMessage,
  insertMessage,
  clickSend,
}) => {
  var errCode = 1;
  try {
    await closeMessageBoxes();
    // Clicking on the message button
    await randomSleep(clickMessage["min"], clickMessage["max"]);

    const topCard = document.querySelector("section.pv-top-card");
    const unparsedName = topCard
      .getElementsByClassName("mt2")[0]
      .getElementsByTagName("ul")[0].firstElementChild.innerText;
    const { lastName, firstName } = parseName(unparsedName);
    const companyName = topCard.getElementsByClassName(
      "pv-top-card--experience-list-item"
    )[0].innerText;

    openMessageBox();

    let messageBox;
    if (document.location.href.split("/")[3] === "messaging") {
      messageBox = document;
    } else {
      try {
        messageBox = document.getElementsByClassName(
          "msg-overlay-conversation-bubble--is-active"
        )[0];
        messageBox.innerHTML;
      } catch (err) {
        console.log(err);
        closeMessageBoxes();
        closeMessageBoxes();
        openMessageBox();
        await sleep(1000);
        messageBox = document.getElementsByClassName(
          "msg-overlay-conversation-bubble--is-active"
        )[0];
      }
    }
    if (
      messageBox.getElementsByClassName(
        "msg-s-thread-actions-tray__item-nonconnection-banner"
      ).length !== 0
    )
      throw new Error("Not friend.");

    await randomSleep(2, 4);

    const conversation = messageBox.getElementsByClassName(
      "msg-s-message-list-content"
    )[0];
    if (conversation) {
      const conversationNames = conversation.getElementsByClassName(
        "msg-s-message-group__name"
      );
      console.log(conversationNames, unparsedName, messageResponded);
      for (let i = 0; i < conversationNames.length; i++) {
        if (conversationNames[i].innerText == unparsedName) {
          if (!messageResponded) {
            errCode = 2;
            throw new Error("Contact Replied");
          }
        }
      }
    }
    await randomSleep(insertMessage["min"], insertMessage["max"]);

    const textArea = messageBox.getElementsByClassName(
      "msg-form__contenteditable"
    )[0];

    const sendButton = messageBox.getElementsByClassName(
      "msg-form__send-button"
    )[0];

    message = message
      .replace("{NAME}", firstName)
      .replace("{COMPANY}", companyName);

    textArea.innerHTML = formatMessageToContentEditableHTML(message);
    textArea.dispatchEvent(
      new Event("input", { bubbles: true, cancelable: true })
    );

    //click send button
    await randomSleep(clickSend["min"], clickSend["max"]);

    sendButton.removeAttribute("disabled");
    sendButton.click();

    await randomSleep(nextUser["min"], nextUser["max"]);
    return { result: "Spammed", code: 0 };
  } catch (err) {
    console.log(err);
    return {
      result: "Spammed",
      code: errCode,
    };
  }
};

const closeMessageBoxes = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      for (i of document.getElementsByClassName(
        "msg-overlay-conversation-bubble--default-inactive"
      )) {
        i.querySelector(`[type="cancel-icon"]`).parentElement.click();
      }
    } catch (err) {}
  }
  try {
    for (i of document.getElementsByClassName(
      "msg-overlay-conversation-bubble--is-active"
    )) {
      i.querySelector(`[type="cancel-icon"]`).parentElement.click();
    }
  } catch (err) {}
};

const formatMessageToContentEditableHTML = (message) =>
  message
    .split(/[\r\n]/)
    .map((x) => (x.replace(/\s/g, "").length ? `<p>${x}</p>` : `<p><br/></p>`))
    .join("");

const openMessageBox = () => {
  const topCard = document.querySelector("section.pv-top-card");
  try {
    const btn = topCard.getElementsByClassName("message-anywhere-button")[0];
    if (btn.parentElement.parentElement.tagName.toLocaleLowerCase() != "li") {
      btn.click();
    } else {
      throw "Didn't click";
    }
  } catch (err) {
    const liel = topCard
      .getElementsByClassName("artdeco-dropdown__content")[0]
      .getElementsByTagName("li");
    for (let i = 0; i < liel.length; i++) {
      if (liel[i].querySelector("a.message-anywhere-button"))
        liel[i].querySelector("a").click();
    }
  }
};

const scrollInvitesPage = async () => {
  const list = document
    .getElementsByClassName("mn-connections")[0]
    .getElementsByTagName("ul")[0]
    .getElementsByTagName("li");
  let tries = 0;
  let height = 0;
  while (tries < 15) {
    const offsetTop = list[list.length - 1].offsetTop;
    if (height < offsetTop) {
      window.scrollBy({
        top: offsetTop,
        behavior: "smooth",
      });
      tries = 0;
      height = offsetTop;
    }
    const lastElementHeight = list[list.length - 1].offsetHeight;
    window.scrollBy({
      top: -lastElementHeight,
      behavior: "smooth",
    });
    await sleep(300);
    window.scrollBy({
      top: lastElementHeight,
      behavior: "smooth",
    });
    await sleep(1000);
    tries++;
  }
};

const htmlDecode = (input) => {
  let doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
};

const getElementByXpath = (path) => {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const randomSleep = (min, max) => {
  min = parseInt(min);
  max = parseInt(max);
  return new Promise((resolve) =>
    setTimeout(resolve, Math.round((Math.random() * (max - min) + min) * 1000))
  );
};

const spamInMail = async (pages) => {
  let spam = await getState();
  let settings = await getSettings();
  const counter = await getCounter();
  if (spam === true && pages > 0 && counter < settings.limit) {
    await sleep(100);
    // window.scrollBy({
    //   top: 80,
    //   left: 0
    // });
    await randomSleep(1, 2);
    // getting list of items
    let list = document.getElementsByClassName("search-results__result-item");
    await spamInMailOneUser(list, 0);
    //TODO repeating code
    document
      .getElementsByClassName("search-results__pagination-next-button")[0]
      .click();
    await randomSleep(4, 8);
    spamInMail(pages - 1);
  } else if (pages == 0 || counter >= settings.limit) {
    chrome.runtime.sendMessage({
      command: "spammed",
    });
  }
};

//TODO: REMOVE REPETITIVE CODE

const getState = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["spam"], function (obj) {
      resolve(obj.spam);
    });
  });
};

const getSettings = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["settings"], function (obj) {
      resolve(obj.settings);
    });
  });
};

const getCounter = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["counter"], function (obj) {
      resolve(obj.counter);
    });
  });
};

const updateCounter = async () => {
  return new Promise(async (resolve) => {
    let counter = await getCounter();
    chrome.storage.local.set({ counter: counter + 1 }, () => resolve());
  });
};

const spamInMailOneUser = async (elements, element) => {
  let spam = await getState();
  let settings = await getSettings();
  const counter = await getCounter();
  if (spam === true && element < elements.length && counter < settings.limit) {
    await randomSleep(2, 5);
    let user = elements[element];
    // Next user pause
    await randomSleep(settings.nextUser.min, settings.nextUser.max);

    /**
     *      Checking for premium
     *      without premium you can't send free invites
     */
    try {
      if (user.getElementsByTagName("linkedin-logo").length > 0) {
        let company = user
          .getElementsByClassName("result-lockup__position-company")[0]
          .getElementsByTagName("a")[0]
          .getElementsByTagName("span")[0].innerHTML;
        company = htmlDecode(company.replace(/\s+/g, " ").trim());
        //clicking three dots icon
        let threeDotsElement = user.getElementsByClassName(
          "result-lockup__action-button"
        )[0];
        if (
          threeDotsElement.nodeName.toLowerCase() === "a" ||
          threeDotsElement.innerHTML.toLowerCase().includes("save profile")
        ) {
          throw new Error("View Profile");
        }
        threeDotsElement.click();
        await randomSleep(1, 2);
        /**
         *        Clicking on the Message button
         *    1. Getting the list of buttons
         *    2. Getting child elements
         *    3. Getting the last element of elements list
         *    4. Click on the button
         */
        let list = threeDotsElement.parentElement
          .getElementsByTagName("div")[0]
          .getElementsByTagName("li");
        let element = list[list.length - 1];
        element.getElementsByTagName("div")[1].click();

        //Click Message pause
        await randomSleep(settings.clickMessage.min, settings.clickMessage.max);

        /**
         * Check if the person wants only new users
         */
        let box = document.getElementById(
          "artdeco-hoverable-outlet__message-overlay"
        ).parentElement;
        if (
          settings.other &&
          box.getElementsByTagName("ul")[0].getElementsByTagName("li").length >
            1
        ) {
        } else {
          /**
           *        Checking if the message is free
           *    1.Getting the span
           *    2.Checking it's value
           *    *everything inside of an if
           */
          let section = box.getElementsByClassName(
            "message-overlay__conversation"
          )[0];
          if (section.innerHTML.toLowerCase().indexOf("open profile") !== -1) {
            /**
             *      Getting user's name
             *  If it's not starting with a letter - skip
             */
            let name = box
              .getElementsByTagName("h2")[0]
              .innerHTML.replace("Conversation with", "")
              .replace(/\s+/g, " ")
              .trim()
              .split(" ")[0];
            if (name.match(/[a-z]/i)) {
              /**
               *      Sending the message
               *  1. Inserting Content
               *  1.1 Inserting the Subject
               *  1.2.1 Replacing the company and name in the text
               *  1.2.2 Inserting the text
               *  2. Pressing the send button
               */

              //Subject pause
              await randomSleep(
                settings.insertTitle.min,
                settings.insertTitle.max
              );
              let evt = document.createEvent("Events");
              evt.initEvent("change", true, true);

              document.querySelector(
                `[placeholder='Subject (required)']`
              ).value = settings.subject;
              document
                .querySelector(`[placeholder='Subject (required)']`)
                .dispatchEvent(evt);

              let text = settings.message
                .replace("{NAME}", name)
                .replace("{COMPANY}", company);
              //Main Message pause
              await randomSleep(
                settings.insertMessage.min,
                settings.insertMessage.max
              );

              document.querySelector(`[name='message']`).value = text;
              document.querySelector(`[name='message']`).dispatchEvent(evt);
              await randomSleep(1, 4);

              //Click Send pause
              await randomSleep(
                settings.clickSend.min,
                settings.insertMessage.max
              );
              const spans = section.getElementsByTagName("span");
              let i = 0;
              for (i = 0; i < spans.length; i++) {
                if (spans[i].innerText.toLowerCase() === "send") {
                  spans[i].parentElement.click();
                }
              }

              await updateCounter();
            }
          }
        }
      }
    } catch (e) {}
    //Main Message pause
    await randomSleep(settings.closeWindow.min, settings.closeWindow.max);
    try {
      document
        .getElementsByClassName("message-overlay__conversation")[0]
        .parentElement.parentElement.querySelector(`[type="cancel-icon"]`)
        .parentElement.click();
    } catch (e) {}
    let scrollBy = user.clientHeight;
    window.scrollBy({
      top: scrollBy,
      left: 0,
    });
    await spamInMailOneUser(elements, element + 1);
  } else {
    return "done";
  }
};

const getDb = (fieldName) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([fieldName], function (obj) {
      resolve(obj[fieldName]);
    });
  });
};

function diff(a1, a2) {
  return a1.concat(a2).filter((val, index, arr) => {
    return arr.indexOf(val) === arr.lastIndexOf(val);
  });
}

function parseName(name, ignoreSuffix) {
  if (!ignoreSuffix) ignoreSuffix = [];
  const salutations = [
    "mr",
    "master",
    "mister",
    "mrs",
    "miss",
    "ms",
    "dr",
    "prof",
    "rev",
    "fr",
    "judge",
    "honorable",
    "hon",
    "tuan",
    "sr",
    "srta",
    "br",
    "pr",
    "mx",
    "sra",
  ];
  const suffixes = [
    "i",
    "ii",
    "iii",
    "iv",
    "v",
    "senior",
    "junior",
    "jr",
    "sr",
    "phd",
    "apr",
    "rph",
    "pe",
    "md",
    "ma",
    "dmd",
    "cme",
    "qc",
    "kc",
  ].filter((suffix) => !ignoreSuffix.includes(suffix));
  const compound = [
    "vere",
    "von",
    "van",
    "de",
    "del",
    "della",
    "der",
    "den",
    "di",
    "da",
    "pietro",
    "vanden",
    "du",
    "st.",
    "st",
    "la",
    "lo",
    "ter",
    "bin",
    "ibn",
    "te",
    "ten",
    "op",
    "ben",
    "al",
  ];

  let parts = name
    .trim()
    .replace(/\b\s+(,\s+)\b/, "$1") // fix name , suffix -> name, suffix
    .replace(/\b,\b/, ", "); // fix name,suffix -> name, suffix
  // look for quoted compound names
  parts = (parts.match(/[^\s"]+|"[^"]+"/g) || parts.split(/\s+/)).map((n) =>
    n.match(/^".*"$/) ? n.slice(1, -1) : n
  );
  const attrs = {};

  if (!parts.length) {
    return attrs;
  }

  if (parts.length === 1) {
    attrs.firstName = parts[0];
  }

  //handle suffix first always, remove trailing comma if there is one
  if (
    parts.length > 1 &&
    suffixes.indexOf(parts[parts.length - 1].toLowerCase().replace(/\./g, "")) >
      -1
  ) {
    attrs.suffix = parts.pop();
    parts[parts.length - 1] = parts[parts.length - 1].replace(",", "");
  }

  //look for a comma to know we have last name first format
  const firstNameFirstFormat = parts.every((part) => {
    return part.indexOf(",") === -1;
  });

  if (!firstNameFirstFormat) {
    //last name first format
    //assuming salutations are never used in this format

    //tracker variable for where first name begins in parts array
    let firstNameIndex;

    //location of first comma will separate last name from rest
    //join all parts leading to first comma as last name
    const lastName = parts.reduce((lastName, current, index) => {
      if (!Array.isArray(lastName)) {
        return lastName;
      }
      if (current.indexOf(",") === -1) {
        lastName.push(current);
        return lastName;
      } else {
        current = current.replace(",", "");

        // handle case where suffix is included in part of last name (ie: 'Hearst Jr., Willian Randolph')
        if (suffixes.indexOf(current.toLowerCase().replace(/\./g, "")) > -1) {
          attrs.suffix = current;
        } else {
          lastName.push(current);
        }

        firstNameIndex = index + 1;
        return lastName.join(" ");
      }
    }, []);

    attrs.lastName = lastName;

    var remainingParts = parts.slice(firstNameIndex);
    if (remainingParts.length > 1) {
      attrs.firstName = remainingParts.shift();
      attrs.middleName = remainingParts.join(" ");
    } else if (remainingParts.length) {
      attrs.firstName = remainingParts[0];
    }

    //create full name from attrs object
    const nameWords = [];
    if (attrs.firstName) {
      nameWords.push(attrs.firstName);
    }
    if (attrs.middleName) {
      nameWords.push(attrs.middleName);
    }
    nameWords.push(attrs.lastName);
    if (attrs.suffix) {
      nameWords.push(attrs.suffix);
    }
    attrs.fullName = nameWords.join(" ");
  } else {
    //first name first format

    if (
      parts.length > 1 &&
      salutations.indexOf(parts[0].toLowerCase().replace(/\./g, "")) > -1
    ) {
      attrs.salutation = parts.shift();

      // if we have a salutation assume 2nd part is last name
      if (parts.length === 1) {
        attrs.lastName = parts.shift();
      } else {
        attrs.firstName = parts.shift();
      }
    } else {
      attrs.firstName = parts.shift();
    }

    if (!attrs.lastName) {
      attrs.lastName = parts.length ? parts.pop() : "";
    }

    // test for compound last name, we reverse because middle name is last bit to be defined.
    // We already know lastname, so check next word if its part of a compound last name.
    const revParts = parts.slice(0).reverse();
    const compoundParts = [];

    revParts.every((part) => {
      const test = part.toLowerCase().replace(/\./g, "");

      if (compound.indexOf(test) > -1) {
        compoundParts.push(part);

        return true;
      }

      //break on first non compound word
      return false;
    });

    //join compound parts with known last name
    if (compoundParts.length) {
      attrs.lastName = compoundParts.reverse().join(" ") + " " + attrs.lastName;

      parts = diff(parts, compoundParts);
    }

    if (parts.length) {
      attrs.middleName = parts.join(" ");
    }

    //remove comma like "<lastName>, Jr."
    if (attrs.lastName) {
      attrs.lastName = attrs.lastName.replace(",", "");
    }

    //save a copy of original
    attrs.fullName = name;
  }
  //console.log('attrs:', JSON.stringify(attrs));

  for (const [k, v] of Object.entries(attrs)) {
    attrs[k] = v.trim();
  }
  return attrs;
}
