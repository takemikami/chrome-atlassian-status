let jiraHost = null;
let crucibleHost = null;

const badgeStyle =
  'margin-left:0.5em; text-decoration: none; '
  + 'font-size: 0.8em; font-weight: bold; '
  + 'background-color: green; color: white;';
const unreadStyle =
  'margin-left:0.5em; text-decoration: none; '
  + 'font-size: 0.8em; font-weight: bold; '
  + 'background-color: orange; color: black;';

chrome.runtime.sendMessage({method: 'getItem', key: 'jiraHost'},
  function(response) {
    if (response.data) {
      jiraHost = response.data;
    }
  }
);
chrome.runtime.sendMessage({method: 'getItem', key: 'crucibleHost'},
  function(response) {
    if (response.data) {
      crucibleHost = response.data;
    }
  }
);

/**
 * parse jira link url
 * @param {string} url - link substring
 * @param {string} host - jira host name
 * @return {string} jira ID. if not issue link, return null.
 */
function parseJiraId(url, host) {
  let prefix = host + '/browse/';
  if (!url.startsWith(prefix)) {
    return null;
  }
  if (url.indexOf('?') > 0) {
    return url.substring(prefix.length, url.indexOf('?'));
  }
  return url.substring(prefix.length);
}
/**
 * replace jira raw link to title and status
 * @param {string} host - jira host name
 * @param {string} jiraid - jira ID
 * @param {Object} elem - dom element of jira issue link
 */
function appendJiraStatus(host, jiraid, elem) {
  if (elem.innerHTML != elem.href) return;
  const request = new XMLHttpRequest();
  request.open('GET', host + '/rest/api/latest/issue/' + jiraid, true);
  request.addEventListener('load', (event) => {
    if (event.target.status==200) {
      let respJson = eval('(' + event.target.responseText + ')');
      let issueStatus = respJson.fields.status;
      elem.innerHTML = '[JIRA:' + jiraid + '] ' + respJson.fields.summary;
      elem.title = '[JIRA: ' + jiraid + '] ' + respJson.fields.summary;
      let info = document.createElement('span');
      info.style = createJiraBadgeStyle(issueStatus.statusCategory.colorName);
      info.innerHTML = '&nbsp;' + issueStatus.name + '&nbsp;';
      elem.insertBefore(info, elem.firstChild);
    }
  });
  request.send();
}
/**
 * create badge style string from color name
 * @param {string} colorName - name of color
 * @return {string} badge style string
 */
function createJiraBadgeStyle(colorName) {
  const styleBase = 'margin-right:0.5em;text-decoration:none;';
  switch (colorName) {
    case 'green':
      return styleBase
        + 'background-color:#14892c;border-color:#14892c;color:#fff';
    case 'yellow':
      return styleBase
        + 'background-color:#ffd351;border-color:#ffd351;color:#594300;';
    case 'brown':
      return styleBase
        + 'background-color:#815b3a;border-color:#815b3a;color:#fff';
    case 'warm-red':
      return styleBase
        + 'background-color:#d04437;border-color:#d04437;color:#fff';
    case 'blue-gray':
      return styleBase
        + 'background-color:#4a6785;border-color:#4a6785;color:#fff';
    case 'medium-gray':
      return styleBase
        + 'background-color:#ccc;border-color:#ccc;color:#333';
  }
  return styleBase
    + 'background-color:#ccc;border-color:#ccc;color:#333';
}

/**
 * parse crucible link url
 * @param {string} url - link substring
 * @param {string} host - crucible host name
 * @return {string} crucible review ID. if not review link, return null.
 */
function parseCrucibleId(url, host) {
  let prefix = host + '/cru/';
  if (!url.startsWith(prefix)) {
    return null;
  }
  if (url.indexOf('?') > 0) {
    return url.substring(prefix.length, url.indexOf('?'));
  }
  return url.substring(prefix.length);
}
/**
 * replace crucible raw link to title and status
 * @param {string} host - crucible host name
 * @param {string} crid - crucible review ID
 * @param {Object} elem - dom element of crucible review link
 */
function appendCrucibleStatus(host, crid, elem) {
  if (elem.innerHTML != elem.href) return;
  const request = new XMLHttpRequest();
  let reqUrl = host + '/rest-service/reviews-v1/' + crid + '/details';
  request.open('GET', reqUrl, true);
  request.addEventListener('load', (event) => {
    if (event.target.status==200) {
      let respXml = event.target.responseText;
      let stateMatch = respXml.match(/<state>(.*)<\/state>/);
      let nameMatch = respXml.match(/<name>([^<]*)<\/name>/);
      let unreadMatch = respXml.match(/<readStatus>UNREAD<\/readStatus>/g);
      if (stateMatch==null || nameMatch==null) {
        return;
      }
      elem.innerHTML = '[Crucible:' + crid + '] ' + nameMatch[1];
      let info = document.createElement('span');
      info.style = badgeStyle;
      info.innerHTML = '&nbsp;' + stateMatch[1] + '&nbsp;';
      elem.appendChild(info);

      let unreadCount = 0;
      if (unreadMatch != null) unreadCount = unreadMatch.length;
      let info2 = document.createElement('span');
      info2.style = unreadStyle;
      info2.innerHTML = '&nbsp;' + unreadCount + '&nbsp;';
      elem.appendChild(info2);

      elem.title = '[Crucible:' + crid + '] ' + nameMatch[1];
    }
  });
  request.send();
}

let fx = function() {
  let links = document.getElementsByTagName('a');
  for (let i = 0, l = links.length; i < l; i++) {
    let jiraId = parseJiraId(links[i].href, jiraHost);
    let crId = parseCrucibleId(links[i].href, crucibleHost);
    if (jiraId != null) {
      appendJiraStatus(jiraHost, jiraId, links[i]);
    } else if (crId != null) {
      appendCrucibleStatus(crucibleHost, crId, links[i]);
    }
  }
};

let observer = new MutationObserver(function(mutations) {
  fx();
});
observer.observe(document.body, {
  childList: true, subtree: true,
});

setTimeout(fx, 100);
