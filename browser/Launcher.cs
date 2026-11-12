using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Elementarium {
  internal static class Program {
    [STAThread] static void Main() {
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      Application.Run(new Launcher());
    }
  }
  internal sealed class Launcher : Form {
    private Process server;
    private string address;
    private NotifyIcon tray;
    private Label status;
    private Button open;
    private bool ending;
    private readonly string root;
    private readonly string portPreference;
    private readonly Action<string> openUrl;
    public Launcher() : this(AppDomain.CurrentDomain.BaseDirectory,
      Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ElementariumBrowser","port.txt"),
      url=>Process.Start(new ProcessStartInfo(url){UseShellExecute=true})) {}
    internal Launcher(string applicationRoot,string preferencePath,Action<string> launchUrl) {
      root=applicationRoot;portPreference=preferencePath;openUrl=launchUrl;
      Text="Elementarium"; ClientSize=new Size(490,245);
      FormBorderStyle=FormBorderStyle.FixedDialog; MaximizeBox=false;
      StartPosition=FormStartPosition.CenterScreen;
      BackColor=Color.FromArgb(11,18,32); ForeColor=Color.FromArgb(233,240,247);
      Font=new Font("Segoe UI",10);
      var heading=new Label {Text="Elementarium",Font=new Font("Segoe UI",23,FontStyle.Bold),AutoSize=true,Location=new Point(25,20)};
      var subtitle=new Label {Text="Periodic table and 3D anatomy atlas",AutoSize=true,Location=new Point(29,70),ForeColor=Color.FromArgb(108,228,205)};
      status=new Label {Text="Preparing the application...",Location=new Point(29,108),Size=new Size(435,46)};
      open=new Button {Text="Open application",Location=new Point(29,170),Size=new Size(200,40),Enabled=false,FlatStyle=FlatStyle.Flat};
      open.Click+=(s,e)=>OpenApp();
      var stop=new Button {Text="Quit",Location=new Point(250,170),Size=new Size(200,40),FlatStyle=FlatStyle.Flat};
      stop.Click+=(s,e)=>{ending=true;Close();};
      Controls.AddRange(new Control[]{heading,subtitle,status,open,stop});
      var menu=new ContextMenuStrip(); menu.Items.Add("Open application",null,(s,e)=>OpenApp());
      menu.Items.Add("Show controls",null,(s,e)=>{Show();WindowState=FormWindowState.Normal;Activate();});
      menu.Items.Add("Quit",null,(s,e)=>{ending=true;Close();});
      tray=new NotifyIcon {Text="Elementarium",Icon=SystemIcons.Application,ContextMenuStrip=menu,Visible=true};
      tray.DoubleClick+=(s,e)=>OpenApp();
      Resize+=(s,e)=>{if(WindowState==FormWindowState.Minimized)Hide();};
      FormClosing+=(s,e)=>{ending=true;StopServer();tray.Visible=false;tray.Dispose();};
      Shown+=async(s,e)=>await StartApp();
    }
    private async Task StartApp() {
      try {
        string python=Path.Combine(root,"runtime","python.exe");
        string script=Path.Combine(root,"tools","server.py");
        if(!File.Exists(python)||!File.Exists(script))throw new Exception("Extract the complete package into one folder and run Elementarium.exe.");
        // Remember the actual usable origin for language and named anatomy views.
        string markerPath=Path.Combine(root,"data","release.json");
        if(!File.Exists(markerPath))throw new Exception("Extract the complete package into one folder and run Elementarium.exe.");
        string expectedContent=File.ReadAllText(markerPath).Trim();
        for(int attempt=0;attempt<4;attempt++){
        var choice=await Task.Run(()=>BrowserPortRouter.Select(expectedContent,portPreference));
        if(ending)return;
        if(choice.Existing){address=choice.Address;BrowserPortRouter.Remember(portPreference,choice.Port);open.Enabled=true;status.Text="The application is already running.";OpenApp();return;}
        var info=new ProcessStartInfo(python,"\""+script+"\" "+choice.Port+" --no-browser") {
          WorkingDirectory=root,UseShellExecute=false,CreateNoWindow=true,
          RedirectStandardOutput=true,RedirectStandardError=true
        };
        server=new Process {StartInfo=info,EnableRaisingEvents=true};
        server.Start();
        // Drain error output so a long session can never fill its pipe.
        server.ErrorDataReceived+=(s,e)=>{};server.BeginErrorReadLine();
        var ready=ReadAddress(server);
        if(await Task.WhenAny(ready,Task.Delay(20000))!=ready)throw new Exception("The application did not start within the expected time.");
        address=await ready;
        if(ending){StopServer();return;}
        // A different process can acquire the port between probing and binding.
        if(address==null){StopServer();continue;}
        if(address!=choice.Address)throw new Exception("The application returned an unexpected local address.");
        BrowserPortRouter.Remember(portPreference,choice.Port);
        server.Exited+=(s,e)=>{if(!ending&&!IsDisposed&&IsHandleCreated)BeginInvoke((Action)(()=>{status.Text="The application has stopped. Close this window and launch it again.";open.Enabled=false;}));};
        open.Enabled=true;
        status.Text="The application is ready. You can minimize this window.\nUse Quit to close the application.";
        OpenApp();return;
        }
        throw new Exception("The application could not start its local service. Please try again.");
      } catch(Exception error) {
        StopServer();status.Text=error.Message;
      }
    }
    private async Task<string> ReadAddress(Process process) {
      string line;
      while((line=await process.StandardOutput.ReadLineAsync())!=null)if(line.StartsWith("Local: "))return line.Substring(7).Trim();
      return null;
    }
    private void OpenApp() {
      if(address==null)return;
      try {openUrl(address);}
      catch {status.Text="Open in your browser: "+address;}
    }
    private void StopServer() {
      if(server==null)return;
      try {if(!server.HasExited){server.Kill();server.WaitForExit(3000);}}catch{}
      server.Dispose();server=null;
    }
  }
  internal sealed class BrowserPortChoice {
    internal int Port;
    internal bool Existing;
    internal string Address { get { return "http://127.0.0.1:"+Port+"/"; } }
  }
  internal static class BrowserPortRouter {
    internal static BrowserPortChoice Select(string expectedContent,string preferencePath) {
      int preferred=17868;
      try {int saved;if(int.TryParse(File.ReadAllText(preferencePath).Trim(),out saved)&&saved>=1024&&saved<=65535)preferred=saved;}catch(IOException){}catch(UnauthorizedAccessException){}
      var candidates=new List<int>{preferred};
      for(int index=0;index<32;index++){int port=17868+37*index;if(!candidates.Contains(port))candidates.Add(port);}
      foreach(int port in candidates){
        // Binding tests availability directly. A slow refused HTTP connection
        // must never turn an unused port into a false conflict.
        var probe=new TcpListener(IPAddress.Loopback,port);
        try {probe.Server.ExclusiveAddressUse=true;probe.Start();return new BrowserPortChoice{Port=port};}
        catch(SocketException){}finally{probe.Stop();}
        try {
          var request=(HttpWebRequest)WebRequest.Create("http://127.0.0.1:"+port+"/data/release.json");
          request.Timeout=900;request.ReadWriteTimeout=900;request.Proxy=null;
          using(var response=(HttpWebResponse)request.GetResponse())
          using(var reader=new StreamReader(response.GetResponseStream())){
            string identity=response.Headers["X-Elementarium"];
            if(identity!=null&&identity.StartsWith("browser-")&&reader.ReadToEnd().Trim()==expectedContent)
              return new BrowserPortChoice{Port=port,Existing=true};
          }
        }catch(WebException){}catch(IOException){}
      }
      throw new Exception("No local address is available. Please try starting Elementarium again.");
    }
    internal static void Remember(string path,int port) {
      try{Directory.CreateDirectory(Path.GetDirectoryName(path));File.WriteAllText(path,port.ToString());}catch(IOException){}catch(UnauthorizedAccessException){}
    }
  }
}

