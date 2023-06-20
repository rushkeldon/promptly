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
    
    const CMDS = {
      sendPrompts : 'sendPrompts',
      populateEditor : 'populateEditor',
      editorReady : 'editorReady',
      invalidJSON : 'invalidJSON',
      validJSON : 'validJSON',
      saveNewPrompts : 'saveNewPrompts'
    };

    // Listen for messages from parent document
    window.addEventListener('message', messageReceivedFromParent, false);

    function createEditor() {
      editor = ace.edit('editor');
      editor.setTheme('ace/theme/vibrant_ink');
      editor.setOption('enableAutoIndent', true);
      editor.session.setMode('ace/mode/javascript');
      editor.session.setOption('wrap', true);
      editor.getSession().on( 'change', editorChanged );

      window.setTimeout(() => window.parent.postMessage( JSON.stringify({
        sender: 'promptly',
        cmd : CMDS.editorReady
      })), 2000);
    }
    
    function editorChanged( e ) {
      try{
        const editorValue = editor.getValue();
        const newPrompts = JSON.parse( editorValue );
        const badMember = newPrompts.find( currentPrompt => typeof currentPrompt !== 'string' );
        if( badMember ) throw( new Error( 'found a bad member' ) );
        signalValidJSON();
      } catch( err ){
        signalInvalidJSON();
      }
    }
    
    function sendPrompts(){
      try{
        const editorValue = editor.getValue();
        const newPrompts = JSON.parse( editorValue );
        window.parent.postMessage( JSON.stringify( {
        sender: 'promptly',
        cmd : CMDS.saveNewPrompts,
        payload : newPrompts
      } ), '*');
      } catch( err ){
          console.log( 'error parsing current editor value:  ', err );
      }
    }
    
    function signalInvalidJSON(){
      window.parent.postMessage( JSON.stringify( {
        sender: 'promptly',
        cmd : CMDS.invalidJSON
      } ), '*');
    }
    
    function signalValidJSON(){
      window.parent.postMessage( JSON.stringify( {
        sender: 'promptly',
        cmd : CMDS.validJSON
      } ), '*');
    }
    
    function messageReceivedFromParent( event ){
      try{
        const data = JSON.parse( event.data );
        if( data.sender !== 'promptly' ) return console.log( 'ignoring message' );
        console.log( 'iframeEditor.messageReceivedFromParent' );
        console.log( 'data.cmd :', data.cmd );
        switch( data.cmd ){
          case 'sendPrompts':
            sendPrompts();
            break;
          case 'populateEditor':
            editor.setValue( JSON.stringify( JSON.parse( data.payload ), null, 2 ) );
            break;
          default :
            console.log( 'unknown command encountered:  ', data.cmd );
        }
      } catch( err ){
        console.log( 'error parsing message:  ', err );
      }
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
          font-size : 16px;
          font-family : "Source Code Pro", monospace;
          overflow-y : scroll;
      }
  </style>
</head>
<body onload="createEditor()">
  <div id="editor"></div>
</body>
</html>`;

const uiHTML = `<div class="header">
   <a class="hamburger" href="#">
      <div class="patty"></div>
   </a>
   <div class="menu">
      <div class="tools">
         <button id="edit" title="edit prompts">✎</button>
      </div>
      <div class="prompts">
      </div>
   </div>
</div>
<button class="btn-save" title="save"></button>
<code id="editor" class="editor" contenteditable="true"></code>`;

let iframe;
let storedPrompts;
let btnSave;

const defaultPrompts = [
  'Please prioritize brevity above all else (one word responses where sufficient) and refrain from explaining your limitations.'
];

function whenDOMready(func) {
  switch (String(document.readyState)) {
    case "complete":
    case "loaded":
    case "interactive":
      func();
      break;
    default:
      window.addEventListener('DOMContentLoaded', function (e) { func(); });
  }
}

function main() {
  console.log( 'promptly main' );
  storedPrompts = getStoredPrompts();
  populatePrompts( storedPrompts );
  addTooltips();
  addEventListeners();
}

enum CMDS {
  sendPrompts = 'sendPrompts',
  populateEditor = 'populateEditor',
  editorReady = 'editorReady',
  invalidJSON = 'invalidJSON',
  validJSON = 'validJSON',
  saveNewPrompts = 'saveNewPrompts'
}

const CN = 'promptly';

function iframeMessageReceived( event ) {
  try{
    const data = JSON.parse( event.data );
    if( data.sender !== 'promptly' ) return console.log( 'ignoring message' );
    // console.log( CN + '.iframeMessageReceived' );
    // console.log( 'data.cmd :', data.cmd );
    switch( data.cmd ){
      case CMDS.saveNewPrompts :
        savePrompts( data.payload );
        populatePrompts( storedPrompts );
        addTooltips();
        addPromptClickListeners();
        break;
      case CMDS.invalidJSON :
        disableBtnSave();
        break;
      case CMDS.validJSON :
        enableBtnSave();
        break;
      case CMDS.editorReady :
        iframe.contentWindow.postMessage( JSON.stringify({
          sender: 'promptly',
          cmd: 'populateEditor',
          payload: JSON.stringify( getStoredPrompts() )
        }), '*' );
        break;
      default :
        console.log( 'unknown command encountered :', data.cmd );
    }
  } catch( err ){
    console.log( 'error parsing message:  ', err );
  }
}

function createEditorIframe() {
  iframe = document.createElement( 'iframe' );
  iframe.id = 'editor-iframe';
  iframe.className = 'displayed';
  document.body.appendChild( iframe );
  iframe.srcdoc = iframeHTML;
}

function dismissEditorIframe() {
  iframe.classList.remove( 'displayed' );
  btnSave.classList.remove( 'displayed' );
}

function displayEditorIframe() {
  iframe.classList.add( 'displayed' );
  btnSave.classList.add( 'displayed' );
}

function getStoredPrompts() {
  let prompts = localStorage.getItem('promptly') || JSON.stringify( defaultPrompts );
  return JSON.parse( prompts );
}

function savePrompts( promptsToSave = [] ) {
  localStorage.setItem('promptly', JSON.stringify(promptsToSave));
  storedPrompts = promptsToSave;
}

function populatePrompts( storedPrompts ) {
  const promptsDiv = document.querySelector( '.prompts' );
  promptsDiv.innerHTML = '';
  storedPrompts.find( currentPrompt => {
    promptsDiv.innerHTML += `<div class="prompt">
        <button>${currentPrompt}</button>
      </div>`;
  } );
}

function addEventListeners() {
  window.addEventListener( 'message', iframeMessageReceived, false );

  let btnMenu = document.querySelector( '.hamburger' );
  btnMenu.addEventListener( 'click', btnMenuClicked );

  addPromptClickListeners();

  const btnEdit = document.querySelector( '#edit' );
  btnEdit.addEventListener( 'click', btnEditClicked );

  btnSave = document.querySelector( '.btn-save' );
  btnSave.addEventListener( 'click', btnSaveClicked );
}

function addPromptClickListeners() {
  const prompts = document.querySelector( '.prompts' );
  const btns = prompts.querySelectorAll( 'button' );
  btns.forEach( btn => {
    btn.addEventListener( 'click', promptClicked );
  } );
}

function btnMenuClicked() {
  let header = document.querySelector( '.header' );
  header.classList.toggle( 'open' );
  if( !header.classList.contains( 'open' ) ){
    dismissEditorIframe();
  }
}

function promptClicked( e ) {
  console.log( e.target.innerHTML );
  const promptTextArea = document.querySelector( '#prompt-textarea' ) as HTMLTextAreaElement;
  promptTextArea.value = e.target.innerHTML;
  promptTextArea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
  // dismiss menu
  btnMenuClicked();
}

function enableBtnSave() {
  btnSave.classList.remove( 'disabled' );
  btnSave.removeAttribute( 'disabled' );
}

function disableBtnSave() {
  btnSave.classList.add( 'disabled' );
  btnSave.setAttribute( 'disabled', true );
}

function btnSaveClicked() {
  iframe.contentWindow.postMessage( JSON.stringify({
    sender: 'promptly',
    cmd: 'sendPrompts',
  } ), '*' );
  dismissEditorIframe();
}

function btnEditClicked(e ) {
  btnSave.classList.toggle( 'displayed' );

  const editorIframe = document.querySelector( '#editor-iframe' );
  if( !editorIframe ){
    createEditorIframe();
  }
  displayEditorIframe();
}

function addTooltips(){
  const prompts = document.querySelector( '.prompts' );
  const btns = prompts.querySelectorAll( 'button' );
  btns.forEach(btn => {

    const tooltip = document.createElement('span');
    tooltip.classList.add('tooltip');
    tooltip.innerText = btn.innerHTML;

    btn.parentNode.appendChild(tooltip);

    let timer;
    btn.addEventListener('mouseover', () => {
      timer = setTimeout(() => {
        tooltip.classList.add('show');
      }, 750);
    });

    btn.addEventListener('mouseout', () => {
      clearTimeout(timer); // Cancel the timer if they mouse out
      tooltip.classList.remove('show');
    });
  });
}

// MAIN ENTRYPOINT
whenDOMready( () => {
  const div = window.document.createElement( 'div' );
  window.document.body.appendChild( div );
  div.innerHTML = uiHTML;
  main();
});
