const {app, BrowserWindow, Menu} = require('electron');
const {ipcMain} = require('electron');
const url = require('url');
const path = require('path');
var net = require('net');
const fs = require('fs');

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {role: 'quit'}
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {role: 'undo'},
            {role: 'redo'},
            {type: 'separator'},
            {role: 'cut'},
            {role: 'copy'},
            {role: 'paste'},
            {role: 'pasteandmatchstyle'},
            {role: 'delete'},
            {role: 'selectall'}
        ]
    },
    {
        label: 'View',
        submenu: [
            {role: 'reload'},
            {role: 'forcereload'},
            {role: 'toggledevtools'},
            {type: 'separator'},
            {role: 'togglefullscreen'}
        ]
    },
    {
        role: 'window',
        submenu: [
            {role: 'minimize'},
            {role: 'close'}
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'HELP!',
                click () { require('electron').shell.openExternal('https://www.google.com/search?q=pghost+site%3Awww.b19.space&oq=pghost+site%3Awww.b19.space') }
            }
        ]
    }
];

generateRandomFreePort(81, 50000, function(thePort, inUse){
  console.log("port: " + thePort + " in use: " + inUse);

  if(!inUse){
    var config = 
    {
      url: "http://localhost:" + thePort + "/",
      server: {
        port: thePort,
        host: "127.0.0.1"
      },
      database: {
        client: "sqlite3",
        connection: {
          filename: ".\\content\\data\\ghost-dev.db"
        }
      },
      mail: {
        transport: 'Direct'
      },
      logging: {
        transports: [
          "file",
          "stdout"
        ]
      },
      process: "local",
      paths: {
        contentPath: ".\\content"
      }
    };

    fs.writeFileSync('resources/ghost/config.development.json', JSON.stringify(config, null, 2));
	  var checker = false;
    let win;
    var ls;
    function createWindow() { 
        var spawn = require('child_process').spawn;

        //ls = spawn('resources/node/node', ['../ghost/index.js'], {cwd: '../ghost'});
		ls = spawn('./../node/node', ['index.js'], {cwd: './resources/ghost'});

        ls.stdout.on('data', function (data) {
          console.log('stdout: ' + data.toString());
		  if(checker == false)
		  {
			win = new BrowserWindow({width: 1024, height: 768});
		
			const menu = Menu.buildFromTemplate(menuTemplate);
			Menu.setApplicationMenu(menu);

			var webContents = win.webContents;

			webContents.on('did-start-loading', function() {
			console.log('did-start-loading');
			});

			webContents.on('did-stop-loading', function() {
			console.log('did-stop-loading');
			});

			webContents.on('did-finish-load', function() {
			console.log('did-finish-load');
			webContents.send('set-url', config.url);
			});

			webContents.on('did-get-response-details', function(e, status, newUrl) {
			console.log('did-get-response-details ' + newUrl);
			});

			win.loadURL(url.format ({ 
			pathname: path.join(__dirname, 'home.html'), 
			protocol: 'file:', 
			slashes: true 
			}));
			
			checker = true;
		  }
        });

        ls.stderr.on('data', function (data) {
          console.log('stderr: ' + data.toString());
        });

        ls.on('exit', function (code) {
          console.log('child process exited with code ' + code.toString());
        });
    }

    app.on('ready', createWindow);

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
          app.quit();
      }
      ls.kill('SIGINT');
    });
  }
});

function generateRandomFreePort(low, high, callback){
  var ran = Math.floor(Math.random() * high) + low;

  portInUse(ran, callback)
}

function portInUse(port, callback) {
  var server = net.createServer(function(socket) {
    socket.write('Echo server\r\n');
    socket.pipe(socket);
  });

  server.listen(port, '127.0.0.1');
  server.on('error', function (e) {
    callback(port, true);
  });

  server.on('listening', function (e) {
    server.close();
    callback(port, false);
  });
}


