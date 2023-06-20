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
      try{
        const data = JSON.parse( event.data );
        if( data.sender !== 'promptly' ) return console.log( 'ignoring message' );
      } catch( err ){
        console.log( 'error parsing message:  ', err );
      }
      editor?.setValue(event.data);
    }, false);

    function createEditor() {
      editor = ace.edit('editor');
      editor.setTheme('ace/theme/vibrant_ink');
      editor.setOption('enableAutoIndent', true);
      editor.session.setMode('ace/mode/javascript');
      editor.session.setOption('wrap', true);
      editor.getSession().on( 'change', editorChanged );

      window.setTimeout(() => window.parent.postMessage('{ "sender" : "promptly", "msg" : "iframe created successfully!"}'), 2000);
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
        cmd : 'saveNewPrompts',
        payload : newPrompts
      } ), '*');
      } catch( err ){
          console.log( 'error parsing current editor value:  ', err );
      }
    }
    
    function signalInvalidJSON(){
      window.parent.postMessage( JSON.stringify( {
        sender: 'promptly',
        cmd : 'invalidJSON'
      } ), '*');
    }
    
    function signalValidJSON(){
      window.parent.postMessage( JSON.stringify( {
        sender: 'promptly',
        cmd : 'validJSON'
      } ), '*');
    }
    
    function messageReceivedFromParent( event ){
      try{
        const data = JSON.parse( event.data );
        if( data.sender !== 'promptly' ) return console.log( 'ignoring message' );
        switch( data.cmd ){
          case 'sendPrompts':
            sendPrompts();
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


/**
 * This function is called when a message is received from the iframe.
 * It parses the message and performs the appropriate action based on the command and passing the payload.
 * @param {MessageEvent} event - The message event received from the iframe.
 */
function iframeMessageReceived( event ) {
  try{
    const data = JSON.parse( event.data ); // Parse the message data as JSON.
    if( data.sender !== 'promptly' ) return console.log( 'ignoring message' ); // If the message sender is not 'promptly', ignore the message.
    switch( data.cmd ){
      case 'saveNewPrompts': // If the command is 'saveNewPrompts', save the new prompts.
        savePrompts( data.payload );
        break;
      case 'invalidJSON': // If the command is 'invalidJSON', disable the save button.
        disableBtnSave();
        break;
      case 'validJSON': // If the command is 'validJSON', enable the save button.
        enableBtnSave();
        break;
    }
  } catch( err ){ // If there was an error parsing the message, log the error.
    console.log( 'error parsing message:  ', err );
  }
}


function createEditorIframe() {
  iframe = document.createElement( 'iframe' );
  iframe.id = 'editor-iframe';
  iframe.className = 'displayed';
  iframe.addEventListener( 'load', () => console.log( 'iframe loaded' ) );
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
}

function populatePrompts( storedPrompts ) {
  const promptsDiv = document.querySelector( '.prompts' );
  promptsDiv.innerHTML = '';
  storedPrompts.find( currentPrompt => {
    promptsDiv.innerHTML += `<div class="prompt">
        <button>${currentPrompt}</button>
      </div>
      `;
  } );
}

function addEventListeners() {
  let btnMenu = document.querySelector( '.hamburger' );
  btnMenu.addEventListener( 'click', btnMenuClicked );

  addPromptClickListeners();

  const btnEdit = document.querySelector( '#edit' );
  btnEdit.addEventListener( 'click', editBtnClicked );

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

function btnMenuClicked( e ) {
  let header = document.querySelector( '.header' );
  header.classList.toggle( 'open' );
  if( !header.classList.contains( 'open' ) ){
    dismissEditorIframe();
  }
}

function promptClicked( e ) {
  console.log( e.target.innerHTML );
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
  iframe.postMessage( JSON.stringify({
    sender: 'promptly',
    cmd: 'sendPrompts',
  } ), '*' );
}

function newPromptsReceived( newPrompts ) {
  savePrompts( newPrompts );
  dismissEditorIframe();
  populatePrompts( newPrompts );
  addTooltips();
}

function editBtnClicked( e ) {
  const saveBtn = document.querySelector( '.btn-save' );
  saveBtn.classList.toggle( 'displayed' );

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
    const tooltipText = btn.innerHTML;

    const tooltipEl = document.createElement('span');
    tooltipEl.classList.add('tooltip');
    tooltipEl.innerText = tooltipText;

    btn.parentNode.appendChild(tooltipEl);

    let timer;
    btn.addEventListener('mouseover', () => {
      timer = setTimeout(() => {
        tooltipEl.classList.add('show');
      }, 750); // Show after 1s hover
    });

    btn.addEventListener('mouseout', () => {
      clearTimeout(timer); // Cancel the timer if they mouse out
      tooltipEl.classList.remove('show');
    });
  });
}

// MAIN ENTRYPOINT
whenDOMready( () => {
  const div = window.document.createElement( 'div' );
  window.document.body.appendChild( div );
  div.innerHTML = uiHTML;
  whenDOMready( main );
});
