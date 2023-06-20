let iframe;
let iframeHTML = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.22.1/ace.min.js"
          integrity="sha512-5qt4yclHD9TFkAhztyOdSnPRl3R4Tbk/9ZIXDA8jFJ1nsW4OvnSgQErgmSOmkLuFNhObaRwzzaNFqgwoozN7hA=="
          crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.22.1/theme-vibrant_ink.min.js"
          integrity="sha512-z6yvuHgAduTXnAWjlZKW+/XIFVmuP9uiJW0trvf3IuLYWxS4HBNQB6ETjkpQfag9Sl+A+Ht7KVuBGsCNvPB96Q=="
          crossorigin="anonymous" referrerpolicy="no-referrer"></script>

  <script>
      let editor;

      // Listen for messages from parent document
      window.addEventListener('message', function (event) {
          if (event.data.indexOf('promptly') !== 0) return console.log('ignoring message');
          editor.setValue(event.data.replace(/^promptly/, '').trim());
      }, false);

      function createEditor() {
          editor = ace.edit('editor');
          editor.setTheme('ace/theme/vibrant_ink');
          editor.setOption('enableAutoIndent', true);
          editor.session.setMode('ace/mode/javascript');
          editor.session.setOption('wrap', true);

          window.setTimeout(() => window.parent.postMessage('promptly{"msg" : "iframe created successfully!"}'), 2000);
      }

  </script>
  <style>
      #editor {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          left: 0;
      }
  </style>
</head>
<body onload="createEditor()">
  <div id="editor"></div>
</body>
</html>`;

window.addEventListener('message', function(event) {
  if( event.data.indexOf( 'promptly' ) !== 0 ){
    console.log( 'ChatGPT parent window ignoring message' );
    return;
  }
  const data = dePromptly( event.data );
  console.log('ChatGPT parent window received message:  ', JSON.stringify( JSON.parse( data ), null, 2 ));
}, false);

function createIframe() {
  iframe = document.createElement( 'iframe' );
  iframe.id = 'editor-iframe';
  iframe.addEventListener( 'load', () => console.log( 'iframe loaded' ) );
  document.body.appendChild( iframe );
  iframe.srcdoc = iframeHTML;
}

function dePromptly(str) {
  return str.replace(/^promptly/, '').trim();
}

function sendTestMessage() {
  iframe.contentWindow.postMessage( 'promptly' + JSON.stringify( { foo : 'goo', x : 3, isWorking : true }, null, 2 ), '*');
}

// createIframe();

window.setTimeout( sendTestMessage, 5000 );
