window.onload = async () => {
  document
    .getElementById("favourite")
    .addEventListener("click", changeFavouriteStatus);
  if (new URLSearchParams(window.location.search).has("manually")) return;
  //?manually=true
  let favourite = await getDb("favourite");
  console.log(favourite);
  if (!favourite) {
    favourite = "popup.html";
    chrome.storage.local.set({ favourite: "popup.html" });
  }
  const currentLocation = document.location.href.split("/");
  const currentFile = currentLocation[currentLocation.length - 1].split("?")[0];
  console.log(currentFile, favourite);
  if (currentFile !== favourite) window.location.href = `./${favourite}`;
};

const changeFavouriteStatus = async () => {
  const currentLocation = document.location.href.split("/");
  const currentFile = currentLocation[currentLocation.length - 1].split("?")[0];
  console.log(currentFile);
  let favourite = await getDb("favourite");
  if (!favourite) {
    favourite = "popup.html";
    chrome.storage.local.set({ favourite: "popup.html" });
  }

  if (currentFile === favourite) return await setFavouriteStatus();

  chrome.storage.local.set({ favourite: currentFile });
  const label = document.getElementById("favourite");
  label.classList.add("is-checked");
  label.getElementsByTagName("span")[0].innerText = "Is Favourite";
};

const setFavouriteStatus = async () => {
  let favourite = await getDb("favourite");
  if (!favourite) {
    favourite = "popup.html";
    chrome.storage.local.set({ favourite: "popup.html" });
  }
  const label = document.getElementById("favourite");
  const currentLocation = document.location.href.split("/");
  const currentFile = currentLocation[currentLocation.length - 1].split("?")[0];
  if (favourite === currentFile) {
    label.classList.add("is-checked");

    label.getElementsByTagName("span")[0].innerText = "Is Favourite";
  } else {
    label.getElementsByTagName("span")[0].innerText = "Set as Favourite";
  }
};

const getDb = (fieldName) => {
  return new Promise((resolve) => {
    chrome.storage.local.get([fieldName], function (obj) {
      resolve(obj[fieldName]);
    });
  });
};
