const {app,BrowserWindow,Menu,protocol,session,shell,dialog}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const core=require('./desktop-core.cjs');
const qaMode=!!process.env.ELEMENTARIUM_QA_DIR&&!app.isPackaged;
if(qaMode)app.setPath('userData',path.resolve(process.env.ELEMENTARIUM_QA_DIR,'profile'));
app.setName('Elementarium');
if(process.platform==='win32')app.setAppUserModelId('sk.elementarium.desktop');
if(process.platform==='linux')app.commandLine.appendSwitch('class','Elementarium');
protocol.registerSchemesAsPrivileged([{scheme:'elementarium',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,codeCache:true}}]);
let mainWindow;
let licenseWindow;
function openLicensePage(url){
  if(licenseWindow&&!licenseWindow.isDestroyed()){licenseWindow.loadURL(url);licenseWindow.focus();return;}
  licenseWindow=new BrowserWindow({width:900,height:740,parent:mainWindow,modal:true,title:'Elementarium — Licenses',autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  licenseWindow.setMenu(null);
  licenseWindow.webContents.on('will-navigate',(event,target)=>{if(!core.isLicense(target))event.preventDefault();});
  licenseWindow.webContents.setWindowOpenHandler(({url:target})=>{const external=core.externalURL(target);if(external&&!qaMode)shell.openExternal(external);return {action:'deny'};});
  licenseWindow.on('closed',()=>{licenseWindow=null;});
  licenseWindow.loadURL(url);
}
const CSP="default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'";
function openAtlas(url=core.ATLAS){
  // A custom DOM event is delivered only to our bundled shell, never external content.
  if(mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('desktop-open-atlas',{detail:${JSON.stringify(url)}}))`);
}
function createWindow(){
  mainWindow=new BrowserWindow({width:1440,height:1000,minWidth:960,minHeight:680,title:'Elementarium',icon:path.join(__dirname,process.platform==='linux'?'icon.png':'icon.ico'),backgroundColor:'#0b1220',show:!qaMode,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,webviewTag:false,spellcheck:false,offscreen:qaMode,backgroundThrottling:!qaMode}});
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(({url})=>{
    if(core.isAtlas(url))openAtlas(url);
    else if(core.isLicense(url))openLicensePage(url);
    else{const external=core.externalURL(url);if(external&&!qaMode)shell.openExternal(external);}
    return {action:'deny'};
  });
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(url!==core.HOME){event.preventDefault();if(core.isAtlas(url))openAtlas(url);}});
  mainWindow.on('closed',()=>{mainWindow=null;});
  mainWindow.loadURL(core.HOME);
  if(qaMode)mainWindow.webContents.once('did-finish-load',()=>require('./qa.cjs').run(mainWindow).then(()=>app.exit(0)).catch(async error=>{console.error(error);await fs.writeFile(path.join(process.env.ELEMENTARIUM_QA_DIR,'failure.txt'),String(error.stack||error));app.exit(1);}));
}
if(!qaMode&&!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
  app.whenReady().then(()=>{
    protocol.handle('elementarium',async request=>{
      const target=core.resolveAsset(__dirname,request.url);
      if(!target)return new Response('Not found',{status:404});
      try{const contents=await fs.readFile(target);return new Response(contents,{status:200,headers:{'Content-Type':core.MIME[path.extname(target)]||'application/octet-stream','Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}catch{return new Response('Not found',{status:404});}
    });
    session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
    session.defaultSession.setPermissionCheckHandler(()=>false);
    session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!core.isLocal(details.url)&&!details.url.startsWith('blob:elementarium://app/')&&!details.url.startsWith('data:')}));
    Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'View',submenu:[{role:'resetZoom',label:'Actual Size'},{role:'zoomIn',label:'Zoom In'},{role:'zoomOut',label:'Zoom Out'},{role:'togglefullscreen',label:'Full Screen'}]},{label:'Application',submenu:[{role:'quit',label:'Quit'}]}]));
    createWindow();
  }).catch(error=>{dialog.showErrorBox('Elementarium',String(error));app.exit(1);});
}
app.on('window-all-closed',()=>app.quit());
