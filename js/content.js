let jiraHost = null;
let crucibleHost = null;
let confluenceHost = null;

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
chrome.runtime.sendMessage({method: 'getItem', key: 'confluenceHost'},
  function(response) {
    if (response.data) {
      confluenceHost = response.data;
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
  const styleBase = 'margin-right:0.3em;text-decoration:none;';
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
 * parse confluence link url
 * @param {string} url - link substring
 * @param {string} host - confluence host name
 * @return {string} page ID. if not page link, return null.
 */
function parseConfluenceId(url, host) {
  let prefix = host + '/pages/';
  if (!url.startsWith(prefix)) {
    return null;
  }
  let pageid = url.match(/pageId=(\d+)/);
  return pageid[1];
}
/**
 * replace confluence raw link to title
 * @param {string} host - confluence host name
 * @param {string} pageId - page ID
 * @param {Object} elem - dom element of confluence page link
 */
function appendConfluenceStatus(host, pageId, elem) {
  if (elem.innerHTML != elem.href) return;
  const request = new XMLHttpRequest();
  request.open('GET', host + '/rest/api/content/' + pageId, true);
  request.addEventListener('load', (event) => {
     if (event.target.status==200) {
       let respJson = eval('(' + event.target.responseText + ')');
       elem.innerHTML = '[Confluence] ' + respJson.title;
     }
  });
  request.send();
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
      elem.title = '[Crucible:' + crid + '] ' + nameMatch[1];

      let info = document.createElement('span');
      info.style = createCrucibleBadgeStyle(stateMatch[1]);
      info.innerHTML = '&nbsp;' + stateMatch[1] + '&nbsp;';

      let unreadCount = 0;
      if (unreadMatch != null) unreadCount = unreadMatch.length;
      let info2 = document.createElement('span');
      info2.style = createCrucibleUnreadStyle(unreadCount);
      info2.innerHTML = '&nbsp;' + unreadCount + '&nbsp;';

      elem.insertBefore(info2, elem.firstChild);
      elem.insertBefore(info, elem.firstChild);
    }
  });
  request.send();
}
/**
 * create badge style string from status name
 * @param {string} statusName - name of status
 * @return {string} badge style string
 */
function createCrucibleBadgeStyle(statusName) {
  const styleBase = 'margin-right:0.3em;text-decoration:none;';
  if (statusName == 'Closed'
      || statusName == 'Abandoned'
      || statusName == 'Summarized') {
    return styleBase
      + 'background-color:#14892c;border-color:#14892c;color:#fff';
  }
  return styleBase
    + 'background-color:#ffd351;border-color:#ffd351;color:#594300;';
}
/**
 * create unread style string from unread count
 * @param {string} unreadCount - number of unread
 * @return {string} unread style string
 */
function createCrucibleUnreadStyle(unreadCount) {
  const styleBase = 'margin-right:0.3em;text-decoration:none;';
  if (unreadCount > 0) {
    return styleBase
      + 'background-color:#ffd351;border-color:#ffd351;color:#594300;';
  }
  return styleBase
    + 'background-color:#ccc;border-color:#ccc;color:#333';
}

let fx = function() {
  let links = document.getElementsByTagName('a');
  for (let i = 0, l = links.length; i < l; i++) {
    let jiraId = parseJiraId(links[i].href, jiraHost);
    let crId = parseCrucibleId(links[i].href, crucibleHost);
    let pageId = parseConfluenceId(links[i].href, confluenceHost);
    if (jiraId != null) {
      appendJiraStatus(jiraHost, jiraId, links[i]);
    } else if (crId != null) {
      appendCrucibleStatus(crucibleHost, crId, links[i]);
    } else if (pageId != null) {
      appendConfluenceStatus(confluenceHost, pageId, links[i]);
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
