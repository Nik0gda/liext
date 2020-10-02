chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "spam") {
    sendResponse({
      result: "Started Spamming",
    });
    chrome.storage.local.set(
      {
        spam: true,
      },
      function () {}
    );
    spamInMail(parseInt(prompt("How many pages?")));
  }
});

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
