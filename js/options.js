$(function() {
  // save to local storage when save button clicked.
  $('#save').click(function() {
    localStorage['jiraHost'] = $('#jiraHost').val();
    localStorage['crucibleHost'] = $('#crucibleHost').val();
    localStorage['confluenceHost'] = $('#confluenceHost').val();
  });

  // fill default value from local storage.
  if (localStorage['jiraHost']) {
    $('#jiraHost').val(localStorage['jiraHost']);
  }
  if (localStorage['crucibleHost']) {
    $('#crucibleHost').val(localStorage['crucibleHost']);
  }
  if (localStorage['confluenceHost']) {
    $('#confluenceHost').val(localStorage['confluenceHost']);
  }
});
