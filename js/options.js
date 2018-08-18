$(function() {
  // セーブボタンが押されたら、
  // ローカルストレージに保存する。
  $('#save').click(function() {
    localStorage['jiraHost'] = $('#jiraHost').val();
    localStorage['crucibleHost'] = $('#crucibleHost').val();
  });

  // オプション画面の初期値を設定する
  if (localStorage['jiraHost']) {
    $('#jiraHost').val(localStorage['jiraHost']);
  }
  if (localStorage['crucibleHost']) {
    $('#crucibleHost').val(localStorage['crucibleHost']);
  }
});
