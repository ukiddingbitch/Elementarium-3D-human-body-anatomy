using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Elementarium {
  internal static class LauncherChecks {
    static void Check(bool condition,string message){if(!condition)throw new Exception(message);Console.WriteLine("PASS "+message);}
    static int FreePort(){var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;listener.Stop();return port;}
    [STAThread] public static int Main(string[] args){
      try{
        string root=Path.GetFullPath(args[0]),output=Path.GetFullPath(args[1]);Directory.CreateDirectory(output);
        string preference=Path.Combine(output,"port.txt"),expected=File.ReadAllText(Path.Combine(root,"data","release.json")).Trim();
        int initial=FreePort();BrowserPortRouter.Remember(preference,initial);
        var clock=Stopwatch.StartNew();var available=BrowserPortRouter.Select(expected,preference);clock.Stop();
        Check(available.Port==initial&&!available.Existing&&clock.ElapsedMilliseconds<700,"Unused port is detected by binding, without waiting for an HTTP timeout");
        using(var other=new MockService(initial)){
          var fallback=BrowserPortRouter.Select(expected,preference);
          Check(fallback.Port!=initial&&!fallback.Existing,"An unrelated local service gets an automatic free-port fallback");
          other.Identity="browser-previous-version";other.Payload=expected;
          var existing=BrowserPortRouter.Select(expected,preference);
          Check(existing.Port==initial&&existing.Existing,"A running server is reused only with the matching content fingerprint");
          other.Identity="unrelated-service";other.Payload="different content";
          Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
          string first=RunLauncher(root,preference,expected),second=RunLauncher(root,preference,expected);
          Check(first==second,"The real launcher starts embedded Python and remembers the chosen address across restarts");
          Check(new Uri(first).Port!=initial&&other.IsListening,"The launcher leaves the other local service running");
          File.WriteAllText(Path.Combine(output,"verification.json"),"{\"version\":\"3.3.1\",\"freePortDoesNotUseHttpProbe\":true,\"busyPortFallsBackAutomatically\":true,\"matchingContentServerReused\":true,\"actualLauncherStartsEmbeddedPython\":true,\"chosenAddressSurvivesRestart\":true,\"otherLocalServiceUnchanged\":true}");
        }
        return 0;
      }catch(Exception error){Console.Error.WriteLine(error);return 1;}
    }
    static string RunLauncher(string root,string preference,string expected){
      string address=null;Exception failure=null;Launcher form=null;
      using(var timeout=new Timer()){
        timeout.Interval=20000;timeout.Tick+=(s,e)=>{failure=new Exception("Launcher startup timed out");form.Close();};
        form=new Launcher(root,preference,url=>{
          try{
            using(var client=new WebClient()){client.Proxy=null;
              Check(client.DownloadString(url+"data/release.json").Trim()==expected,"Actual launcher serves the intended offline content");
              Check(client.DownloadString(url).Contains("id=\"table\""),"Actual launcher serves the periodic table page");
            }
            address=url;
          }catch(Exception error){failure=error;}
          finally{form.Close();}
        });
        form.ShowInTaskbar=false;form.Opacity=0;timeout.Start();Application.Run(form);form.Dispose();
      }
      if(failure!=null)throw failure;Check(address!=null,"Launcher opens its usable local address");return address;
    }
    sealed class MockService : IDisposable {
      readonly TcpListener listener;
      internal volatile string Identity="unrelated-service",Payload="different content";
      internal bool IsListening {get{return listener.Server.IsBound;}}
      internal MockService(int port){
        listener=new TcpListener(IPAddress.Loopback,port);listener.Start();
        Task.Run(()=>{while(true){try{using(var client=listener.AcceptTcpClient()){
          client.ReceiveTimeout=3000;using(var stream=client.GetStream()){
            var reader=new StreamReader(stream,Encoding.ASCII,false,1024,true);string line;do{line=reader.ReadLine();}while(!string.IsNullOrEmpty(line));
            byte[] body=Encoding.UTF8.GetBytes(Payload),header=Encoding.ASCII.GetBytes("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nX-Elementarium: "+Identity+"\r\nContent-Length: "+body.Length+"\r\nConnection: close\r\n\r\n");stream.Write(header,0,header.Length);stream.Write(body,0,body.Length);
          }
        }}catch(SocketException){break;}catch(ObjectDisposedException){break;}catch(IOException){}}});
      }
      public void Dispose(){listener.Stop();}
    }
  }
}
