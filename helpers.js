// helpers.js
const hbs = require('hbs');

// Function to generate input element HTML
function createInputElement({
  type, id, placeholder, className, onClick, onKeyUp, 
  othersForInput, othersForPlaceHolder, othersForDiv, value
}) {
  let divClass = 'input-containeri';
  if (othersForDiv) {
    divClass += ` ${othersForDiv.replace('class="', '').replace('"', '')}`;
  }

  let defaultValue = value || '';
  if (type === 'date' && !defaultValue) {
    defaultValue = new Date().toISOString().split('T')[0];
  } else if (type === 'time' && !defaultValue) {
    const now = new Date();
    defaultValue = now.toTimeString().split(' ')[0].substring(0, 5);
  } else if (type === 'datetime-local' && !defaultValue) {
    const now = new Date();
    defaultValue = now.toISOString().slice(0, 16);
  }
  const labelElement = `<label for="${id}" id="cus-in-lab-${id}" ${othersForPlaceHolder}>${placeholder || 'Sample'}</label>`;
  const inputElement = `<input ${type ? `type="${type}"` : 'text'}
    id="${id}" name="${id}" class="${className || ''}"  
    ${onClick ? `onclick="${onClick}"` : ''} 
    ${onKeyUp ? `onkeyup="${onKeyUp}"` : ''} 
    value="${defaultValue}" ${othersForInput} autocomplete="current-password">`;
  
  return `<div id='cus-div-${id}' class="${divClass}" ${othersForDiv ? othersForDiv : ''}>${labelElement}${inputElement}</div>`;
}

// Function to generate textarea element HTML
function createTextAreaElement({
  id, placeholder, className, onClick, onKeyUp, 
  othersForTextArea, othersForPlaceHolder, othersForDiv, rows, cols
}) {
  let divClass = 'input-containeri';
  if (othersForDiv) {
    divClass += ` ${othersForDiv.replace('class="', '').replace('"', '')}`;
  }

  const labelElement = `<label for="${id}" id="cus-in-lab-${id}" ${othersForPlaceHolder}>${placeholder || 'Sample'}</label>`;
  const textAreaElement = `<textarea id="${id}" name="${id}" class="${className || ''}"
    ${onClick ? `onclick="${onClick}"` : ''} ${onKeyUp ? `onkeyup="${onKeyUp}"` : ''}
    ${rows ? `rows="${rows}"` : ''} ${cols ? `cols="${cols}"` : ''} ${othersForTextArea}></textarea>`;

  return `<div id='cus-div-${id}' class="${divClass}" ${othersForDiv ? othersForDiv : ''}>${labelElement}${textAreaElement}</div>`;
}

// Register helpers with Handlebars
function registerHelpers() {
  hbs.registerHelper('createInput', (options) => new hbs.SafeString(createInputElement(options.hash)));
  hbs.registerHelper('createInputTa', (options) => new hbs.SafeString(createTextAreaElement(options.hash)));
}

module.exports = { registerHelpers };
