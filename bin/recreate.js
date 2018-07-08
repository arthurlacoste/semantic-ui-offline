/*
 * This script recreate a new version of the package without semantic-ui-css
 * including the fonts.
 */
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const fontMax = `
/* lato-regular - latin */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  src: url('font/lato-v14-latin-regular.eot'); /* IE9 Compat Modes */
  src: local('Lato Regular'), local('Lato-Regular'),
       url('font/lato-v14-latin-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
       url('font/lato-v14-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
       url('font/lato-v14-latin-regular.woff') format('woff'), /* Modern Browsers */
       url('font/lato-v14-latin-regular.ttf') format('truetype'), /* Safari, Android, iOS */
       url('font/lato-v14-latin-regular.svg#Lato') format('svg'); /* Legacy iOS */
}
`;
const fontMin = `@font-face{font-family:Lato;font-style:normal;font-weight:400;src:url(font/lato-v14-latin-regular.eot);src:local('Lato Regular'),local('Lato-Regular'),url(font/lato-v14-latin-regular.eot?#iefix) format('embedded-opentype'),url(font/lato-v14-latin-regular.woff2) format('woff2'),url(font/lato-v14-latin-regular.woff) format('woff'),url(font/lato-v14-latin-regular.ttf) format('truetype'),url(font/lato-v14-latin-regular.svg#Lato) format('svg')}`;

filesTochange = [
	'node_modules/semantic-ui-css/semantic.min.css',
	'node_modules/semantic-ui-css/semantic.css',
	'node_modules/semantic-ui-css/components/site.min.css',
	'node_modules/semantic-ui-css/components/site.css'
];

const minFileSrc = '../src/semantic.min.css';
const maxFileSrc = '../src/semantic.css';
const reg = /(@import url\(([^)]+)\);)/;

// change files
filesTochange.forEach(f => {
	console.log('Replace ' + path.resolve(f));
  let newFont = fontMin;
  if(f.indexOf('min')===-1) {
    newFont = fontMax;
  }
	let maxFileCont = fs.readFileSync(f, 'utf8');
	maxFileCont = maxFileCont.replace(reg, (match, cont, off, input) => {
    console.log('Found input, replace.');
    return newFont;
  });
	fs.writeFileSync(f, maxFileCont, 'utf8');
});

// Copy module inside of this one
fse.copy('node_modules/semantic-ui-css/', '.', (err,data) =>{
  if(err) return console.log(err);
  fse.copy('src/', '.', (err,data) =>{
    if(err) return console.log(err);
      console.log('Everything is updated!')
  });
})
