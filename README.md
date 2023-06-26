# promptly
Used in conjunction with an extension for Chrome this bit of code lets you store and manage prompts for use with ChatGPT

## How To Use
1. Install the Chrome extension [User JavaScript and CSS](https://chrome.google.com/webstore/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld)
2. Navigate to the [ChatGPT website](https://chat.openai.com/chat/)
3. Click the extension icon
4. Click the button to open the editor and paste the contents of :
* `build/promptly.js` into the JS pane on the left
* `build/promptly.css` into the CSS pane on the right
5. Click the "Save" button
6. Refresh the ChatGPT page - et voila!

The rest should be self-explanatory, but if not please log a bug on github.

## How To Extend & Build
1. Clone the repo
2. Run `npm install`
3. Edit either `src/promptly.ts` or `src/promptly.less`
4. Run `npm run build`
5. Go to #3 in How To Use above

## How To Add, Edit, and Remove Prompts
1. Click the 'hamburger' menu top right
2. Click the pencil button
3. An editor will open up with the JSON of your currently saved prompts
4. Edit the array of strings as you see fit
5. Click the floppy disk button to save

### NOTES on Editing :
While you have invalid JSON in the editor you will see :
- red indicators in the editor
- the floppy disk (save) button (upper left) will be disabled

When you have _valid_ JSON in the editor you will see :
- the floppy disk button will be enabled
- 
## Screenshots w/ Annotation
<img width="956" alt="promptly_menu_btn" src="https://github.com/rushkeldon/promptly/assets/7365842/e6314185-9944-4bcd-aed5-bd0f14cbb829">
<img width="956" alt="promptly_menu" src="https://github.com/rushkeldon/promptly/assets/7365842/1aebb3f9-2257-4791-a8e6-8dd27dc3bd53">
<img width="1237" alt="promptly_editor" src="https://github.com/rushkeldon/promptly/assets/7365842/4bf5578c-6a5c-48ca-af07-bbc2514b3374">


## Donations Welcome
If you find this useful and would like to donate, please send to my Venmo account: @Keldon-Rush

[https://venmo.com/u/Keldon-Rush](https://venmo.com/u/Keldon-Rush)
