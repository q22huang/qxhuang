const fs=require('fs'),path=require('path');
const root=__dirname,Engine=require('./assets/engine.js'),Schema=require('./assets/schema.js');
const d=JSON.parse(fs.readFileSync(path.join(root,'data/content.json'),'utf8'));
const errors=Schema.validate(d);if(errors.length)throw Error(errors.join('\n'));
for(const [name,html] of Object.entries(Engine.generate(d))){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),html);}
fs.writeFileSync(path.join(root,'data/content.js'),'window.SiteContent = '+Engine.scriptJSON(d)+';\n');
fs.writeFileSync(path.join(root,'.nojekyll'),'');
if(d.photo)fs.writeFileSync(path.join(root,Engine.photoPath(d)),Buffer.from(d.photo.base64,'base64'));
const fixed=['assets/style.css','assets/site.js','assets/favicon.svg','assets/portrait.jpg','assets/engine.js','assets/schema.js','assets/package.js','assets/editor.js','assets/editor.css','editor.html','README.md','CONTENT-NOTES.md','build.cjs','.nojekyll'];
const bundle={};for(const name of fixed){const target=path.join(root,name);if(fs.existsSync(target))bundle[name]=fs.readFileSync(target).toString('base64');}
fs.writeFileSync(path.join(root,'assets/bundle.js'),'window.SiteBundle = '+Engine.scriptJSON(bundle)+';\n');
console.log('Built 12 pages and offline editing assets.');
