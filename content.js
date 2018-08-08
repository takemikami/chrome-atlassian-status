var jiraHost = null;
var crucibleHost = null;

chrome.runtime.sendMessage({method: 'getItem', key: 'jiraHost'}, function (response) {
  if (response.data) {
    jiraHost = response.data;
    console.log(response.data);
  }
});
chrome.runtime.sendMessage({method: 'getItem', key: 'crucibleHost'}, function (response) {
  if (response.data) {
    crucibleHost = response.data;
    console.log(response.data);
  }
});


// jira
function parseJiraId(url, host) {
  var prefix = host + "/browse/";
  if (!url.startsWith(prefix)) {
    return null;
  }
  if (url.indexOf("?") > 0) {
    return url.substring(prefix.length, url.indexOf("?"));
  }
  return url.substring(prefix.length);
}
function appendJiraStatus(host, jiraid, elem) {
  const request = new XMLHttpRequest();
  request.open("GET", host + "/rest/api/latest/issue/" + jiraid, true);
  request.addEventListener("load", (event) => {
    if(event.target.status==200) {
      var respJson = eval("(" + event.target.responseText + ")");
      if (elem.innerHTML == elem.href) {
        elem.innerHTML = "[JIRA:" + jiraid + "] " + respJson.fields.summary;
      }
      var info = document.createElement("span");
      info.style = "font-size: 0.8em; margin-left:0.5em; text-decoration: none; font-weight: bold; background-color: green; color: white;";
      info.innerHTML = "&nbsp;" + respJson.fields.status.name + "&nbsp;";
      elem.appendChild(info);
      elem.title = "[JIRA: " + jiraid + "] " + respJson.fields.summary;
    }
  });
  request.send();
}

// crucible
function parseCrucibleId(url, host) {
  var prefix = host + "/cru/";
  if (!url.startsWith(prefix)) {
    return null;
  }
  if (url.indexOf("?") > 0) {
    return url.substring(prefix.length, url.indexOf("?"));
  }
  return url.substring(prefix.length);
}
function appendCrucibleStatus(host, crid, elem) {
  const request1 = new XMLHttpRequest();
  request1.open("GET", host + "/rest-service/reviews-v1/" + crid + "/details", true);
  request1.addEventListener("load", (event) => {
    if(event.target.status==200) {
      var respXml = event.target.responseText;
      var stateMatch = respXml.match(/<state>(.*)<\/state>/);
      var nameMatch = respXml.match(/<name>([^<]*)<\/name>/);
      var unreadMatch = respXml.match(/<readStatus>UNREAD<\/readStatus>/g);
      if (stateMatch==null || nameMatch==null) { return; }
      if (elem.innerHTML == elem.href) {
       elem.innerHTML = "[Crucible:" + crid + "] " + nameMatch[1];
      }
      var info = document.createElement("span");
      info.style = "font-size: 0.8em; margin-left:0.5em; text-decoration: none; font-weight: bold; background-color: green; color: white;";
      info.innerHTML = "&nbsp;" + stateMatch[1] + "&nbsp;";
      elem.appendChild(info);

      var unreadCount = 0;
      if (unreadMatch != null) unreadCount = unreadMatch.length;
      var info2 = document.createElement("span");
      info2.style = "font-size: 0.8em; margin-left:0.5em; text-decoration: none; font-weight: bold; background-color: orange; color: black;";
      info2.innerHTML = "&nbsp;" + unreadCount + "&nbsp;";
      elem.appendChild(info2);
      
      elem.title = "[Crucible:" + crid + "] " + nameMatch[1];
    }
  });
  request1.send();
}

var fx = function() {
  var links = document.getElementsByTagName('a');
  for (var i = 0, l = links.length; i < l; i++) {
    var jiraId = parseJiraId(links[i].href, jiraHost);
    var crId = parseCrucibleId(links[i].href, crucibleHost);
    if (jiraId != null) {
      appendJiraStatus(jiraHost, jiraId, links[i]);
    } else if(crId != null) {
      appendCrucibleStatus(crucibleHost, crId, links[i]);
    }
  }
  console.log("extension:end");
};

var observer = new MutationObserver(function (mutations) {
  fx();
});
observer.observe(document.head, {
  childList: true, subtree: false
});

setTimeout(fx, 100);
