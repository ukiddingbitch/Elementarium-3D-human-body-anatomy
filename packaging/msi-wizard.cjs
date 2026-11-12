// Authored English wizard with native MSI controls; no UI/plugin DLLs.
// LaunchElementarium runs only the installed app when Finish is chosen.
const fs=require('node:fs/promises');
const path=require('node:path');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
module.exports=async function(file){
  let xml=await fs.readFile(file,'utf8');
  xml=xml.replace('CompressionLevel="high"','CompressionLevel="mszip"').replaceAll('Name="elementarium-desktop"','Name="Elementarium"');
  const header=(title,subtitle='')=>`
    <Control Id="Title" Type="Text" X="20" Y="12" Width="285" Height="21" Transparent="yes" Text="{\\ElementariumTitle}${title}"/>
    <Control Id="Subtitle" Type="Text" X="20" Y="35" Width="285" Height="18" Text="${subtitle}"/>
    <Control Id="AppIcon" Type="Icon" X="323" Y="12" Width="32" Height="32" FixedSize="yes" IconSize="32" Text="ElementariumSetupIcon"/>
    <Control Id="HeaderLine" Type="Line" X="0" Y="60" Width="370" Height="0"/>
    <Control Id="FooterLine" Type="Line" X="0" Y="234" Width="370" Height="0"/>`;
  const button=(id,label,x,events,extra='')=>`<Control Id="${id}" Type="PushButton" X="${x}" Y="245" Width="56" Height="19" Text="${label}" ${extra}>${events}</Control>`;
  const go=(dialog,order=1)=>`<Publish Event="NewDialog" Value="${dialog}" Order="${order}">1</Publish>`;
  const cancel=()=>button('Cancel','Cancel',304,'<Publish Event="SpawnDialog" Value="ElementariumCancel">1</Publish>','Cancel="yes"');
  const text=(id,value,y,height=35)=>`<Control Id="${id}" Type="Text" X="25" Y="${y}" Width="320" Height="${height}" Text="${value}"/>`;
  const dialog=(id,title,subtitle,body,footer,attributes='')=>`<Dialog Id="${id}" Width="370" Height="275" Title="Elementarium Setup" ${attributes}>${header(title,subtitle)}${body}${footer}</Dialog>`;
  const back=to=>button('Back','&lt; Back',180,go(to));
  const next=to=>button('Next','Next &gt;',240,go(to),'Default="yes"');
  const finish=()=>button('Finish','Finish',304,'<Publish Event="EndDialog" Value="Return">1</Publish>','Default="yes" Cancel="yes"');
  const ui=`
  <Property Id="DefaultUIFont" Value="ElementariumFont"/>
  <Property Id="ARPNOMODIFY" Value="1"/>
  <Property Id="ErrorDialog" Value="ElementariumError"/>
  <Property Id="LAUNCHELEMENTARIUM" Value="1"/>
  <Property Id="APPLICATIONFOLDER" Secure="yes"/>
  <Binary Id="ElementariumSetupIcon" SourceFile="${escape(path.resolve(__dirname,'../icon.ico'))}"/>
  <CustomAction Id="SetElementariumFolder" Property="APPLICATIONFOLDER" Value="[LocalAppDataFolder]Programs\\Elementarium\\"/>
  <CustomAction Id="LaunchElementarium" FileKey="mainExecutable" ExeCommand="" Execute="immediate" Impersonate="yes" Return="asyncNoWait"/>
  <InstallExecuteSequence>
    <Custom Action="SetElementariumFolder" Before="CostFinalize">NOT Installed AND NOT APPLICATIONFOLDER</Custom>
  </InstallExecuteSequence>
  <UI Id="ElementariumUI">
    <TextStyle Id="ElementariumFont" FaceName="Segoe UI" Size="9"/>
    <TextStyle Id="ElementariumTitle" FaceName="Segoe UI" Size="13" Bold="yes"/>
    ${dialog('ElementariumWelcome','Welcome to Elementarium Setup','Periodic table and 3D anatomy atlas',
      text('WelcomeText','This wizard will install Elementarium on your computer.',83,30)+
      text('Description','Explore 118 chemical elements and seven anatomical systems. The application includes its learning content and 3D models.',121,50)+
      text('ContinueText','Click Next to continue, or Cancel to exit Setup.',190,25),
      button('Back','&lt; Back',180,'','Disabled="yes"')+next('ElementariumFolder')+cancel())}
    ${dialog('ElementariumFolder','Destination folder','Choose where Elementarium will be installed.',
      text('FolderLabel','Install Elementarium in this folder:',83,20)+
      '<Control Id="FolderPath" Type="PathEdit" X="25" Y="108" Width="253" Height="20" Property="APPLICATIONFOLDER"/>'+
      '<Control Id="Browse" Type="PushButton" X="285" Y="108" Width="60" Height="20" Text="Browse..."><Publish Property="_BrowseProperty" Value="APPLICATIONFOLDER" Order="1">1</Publish><Publish Event="SpawnDialog" Value="ElementariumBrowse" Order="2">1</Publish></Control>'+
      text('FolderHelp','Desktop and Start menu shortcuts will be created for this Windows account.',154,40),
      back('ElementariumWelcome')+button('Next','Next &gt;',240,'<Publish Event="SetTargetPath" Value="APPLICATIONFOLDER" Order="1">1</Publish>'+go('ElementariumReady',2),'Default="yes"')+cancel())}
    ${dialog('ElementariumReady','Ready to install','Setup is ready to install Elementarium.',
      text('DestinationLabel','Destination folder:',83,20)+text('Destination','[APPLICATIONFOLDER]',108,45)+
      text('ReadyText','Click Install to begin. Click Back to review your settings.',173,35),
      back('ElementariumFolder')+button('Install','Install',240,'<Publish Event="EndDialog" Value="Return">1</Publish>','Default="yes"')+cancel())}
    ${dialog('ElementariumProgress','Installing Elementarium','Please wait while Setup applies your changes.',
      text('ProgressText','Setup is copying application files and updating shortcuts.',88,40)+
      '<Control Id="Progress" Type="ProgressBar" X="25" Y="145" Width="320" Height="16" ProgressBlocks="yes"><Subscribe Event="SetProgress" Attribute="Progress"/></Control>',
      button('Back','&lt; Back',180,'','Disabled="yes"')+button('Next','Next &gt;',240,'','Disabled="yes"')+cancel(),'Modeless="yes"')}
    ${dialog('ElementariumComplete','Setup complete','The requested changes have been applied.',
      text('CompleteText','Click Finish to close Setup.',87,50)+
      '<Control Id="Launch" Type="CheckBox" X="25" Y="157" Width="320" Height="20" Property="LAUNCHELEMENTARIUM" CheckBoxValue="1" Text="Launch Elementarium"><Condition Action="hide">Installed OR REMOVE OR ACTION = "ADMIN"</Condition></Control>',
      button('Finish','Finish',304,'<Publish Event="DoAction" Value="LaunchElementarium" Order="1">LAUNCHELEMENTARIUM = 1 AND NOT Installed AND NOT REMOVE AND ACTION &lt;&gt; "ADMIN"</Publish><Publish Event="EndDialog" Value="Return" Order="2">1</Publish>','Default="yes" Cancel="yes"'))}
    ${dialog('ElementariumBrowse','Choose a folder','Select a destination for Elementarium.',
      '<Control Id="Folders" Type="DirectoryCombo" X="25" Y="77" Width="260" Height="80" Property="_BrowseProperty" Indirect="yes" Fixed="yes" Remote="yes"><Subscribe Event="IgnoreChange" Attribute="IgnoreChange"/></Control>'+
      '<Control Id="Up" Type="PushButton" X="293" Y="77" Width="52" Height="19" Text="Up"><Publish Event="DirectoryListUp" Value="0">1</Publish></Control>'+
      '<Control Id="FolderList" Type="DirectoryList" X="25" Y="103" Width="320" Height="90" Property="_BrowseProperty" Indirect="yes" Sunken="yes" TabSkip="no"/>'+
      '<Control Id="SelectedPath" Type="PathEdit" X="25" Y="204" Width="320" Height="19" Property="_BrowseProperty" Indirect="yes"/>',
      button('OK','OK',240,'<Publish Event="SetTargetPath" Value="[_BrowseProperty]" Order="1">1</Publish><Publish Event="EndDialog" Value="Return" Order="2">1</Publish>','Default="yes"')+
      button('Cancel','Cancel',304,'<Publish Event="Reset" Value="0" Order="1">1</Publish><Publish Event="EndDialog" Value="Return" Order="2">1</Publish>','Cancel="yes"'))}
    <Dialog Id="ElementariumCancel" Width="285" Height="125" Title="Elementarium Setup">
      <Control Id="Question" Type="Text" X="20" Y="20" Width="245" Height="45" Text="Are you sure you want to cancel Setup?"/>
      <Control Id="Yes" Type="PushButton" X="143" Y="85" Width="56" Height="19" Text="Yes"><Publish Event="EndDialog" Value="Exit">1</Publish></Control>
      <Control Id="No" Type="PushButton" X="209" Y="85" Width="56" Height="19" Default="yes" Cancel="yes" Text="No"><Publish Event="EndDialog" Value="Return">1</Publish></Control>
    </Dialog>
    ${dialog('FatalError','Setup could not be completed','No changes have been committed.',text('Message','Windows has rolled back the installation. Check the available disk space and try again.',90,60),finish())}
    ${dialog('UserExit','Setup was cancelled','Installation has not been completed.',text('Message','You can run Elementarium Setup again whenever you are ready.',90,50),finish())}
    ${dialog('FilesInUse','Files are in use','Close the listed applications before continuing.',
      '<Control Id="List" Type="ListBox" X="25" Y="80" Width="320" Height="110" Property="FileInUseProcess"/>',
      button('Retry','Retry',174,'<Publish Event="EndDialog" Value="Retry">1</Publish>','Default="yes"')+
      button('Ignore','Ignore',239,'<Publish Event="EndDialog" Value="Ignore">1</Publish>')+
      button('Cancel','Cancel',304,'<Publish Event="EndDialog" Value="Exit">1</Publish>','Cancel="yes"'))}
    <Dialog Id="ElementariumError" Width="370" Height="180" Title="Elementarium Setup" ErrorDialog="yes">
      <Control Id="ErrorText" Type="Text" X="20" Y="20" Width="330" Height="90" TabSkip="no" Text="[ErrorText]"/>
      ${[['O','OK','ErrorOk'],['C','Cancel','ErrorCancel'],['A','Abort','ErrorAbort'],['R','Retry','ErrorRetry'],['I','Ignore','ErrorIgnore'],['Y','Yes','ErrorYes'],['N','No','ErrorNo']].map(([id,label,result])=>`<Control Id="${id}" Type="PushButton" X="150" Y="135" Width="70" Height="25" TabSkip="yes" Text="${label}"><Publish Event="EndDialog" Value="${result}">1</Publish></Control>`).join('')}
    </Dialog>
    <InstallUISequence>
      <Custom Action="SetElementariumFolder" Before="CostFinalize">NOT Installed AND NOT APPLICATIONFOLDER</Custom>
      <Show Dialog="ElementariumWelcome" Before="ExecuteAction">NOT Installed AND NOT REMOVE</Show>
      <Show Dialog="ElementariumProgress" After="ElementariumWelcome">NOT REMOVE</Show>
      <Show Dialog="ElementariumComplete" OnExit="success"/>
      <Show Dialog="FatalError" OnExit="error"/>
      <Show Dialog="UserExit" OnExit="cancel"/>
    </InstallUISequence>
    <AdminUISequence>
      <Show Dialog="ElementariumComplete" OnExit="success"/>
      <Show Dialog="FatalError" OnExit="error"/>
      <Show Dialog="UserExit" OnExit="cancel"/>
    </AdminUISequence>
  </UI>`;
  xml=xml.replace('</Product>',ui+'\n</Product>');await fs.writeFile(file,xml);
};
