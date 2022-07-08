# json to html (Javascript)

<b>example</b> <br>
console.log( jsontohtml( JSON.parse( html2json(document.querySelector('main') ) ) ) ) <br>
<b>or</b><br>
var urxsV23 = jsontohtml( JSON.parse( html2json(document.querySelector('main') ) ) ); <br>
document.querySelector('body').append(urxsV23) <br>

<br>
<b>reference</b> <br>
html2json & json2html : https://stackoverflow.com/questions/12980648/map-html-to-json 