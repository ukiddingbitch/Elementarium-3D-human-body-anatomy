const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function updateReleaseMarker(){
  const root=path.resolve(__dirname,'..'),content=path.join(root,'content'),marker=path.join(content,'data/release.json'),files=[];
  function walk(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(item.isDirectory())walk(file);else if(file!==marker)files.push(file);}}
  walk(content);const digest=crypto.createHash('sha256');
  for(const file of files.sort()){digest.update(path.relative(content,file).replaceAll('\\','/')+'\0');digest.update(fs.readFileSync(file));}
  const value={application:'Elementarium',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,contentSha256:digest.digest('hex')};
  fs.writeFileSync(marker,JSON.stringify(value,null,2)+'\n');return value;
};
if(require.main===module)console.log(JSON.stringify(module.exports()));
