try {
  const http = require('http');
  const fs = require('fs');
  const DashboardHandler = require('./dashboardHandler.js')
  let data = null

  const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
      if (req.url === '/') {
        fs.readFile('./dash/index.html', (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error loading index.html');
            res.end();
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
            res.end();
          }
        });
      } else if (req.url === '/script.js') {
        fs.readFile('./dash/script.js', (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error loading script.js');
            res.end();
          } else {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.write(data);
            res.end();
          }
        });
      } else if (req.url === '/styles.css') {
        fs.readFile('./dash/styles.css', (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error loading script.js');
            res.end();
          } else {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.write(data);
            res.end();
          }
        });
      } else if (req.url === '/api/truths') {
        const dashboardHandler = new DashboardHandler();
        dashboardHandler.getTruths((data) => {
          if (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(data));
            res.end();
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error getting truths: None found');
            res.end();
          }
        });
      } else if (req.url === '/api/dares') {
        console.log("Recieved Dashboard Dare request")
        const dashboardHandler = new DashboardHandler();
        dashboardHandler.getDares((data) => {
          if (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("json")
            res.write(JSON.stringify(data));
            console.log("json complete")
            res.end();
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error getting truths: None found');
            res.end();
          }
        });
      } else if (req.url === '/api/review/dares') {
        console.log("Recieved Dashboard Dare review request")
        const dashboardHandler = new DashboardHandler();
        dashboardHandler.getDareReviewables((data) => {
          if (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            console.log("json")
            res.write(JSON.stringify(data));
            console.log("json complete")
            res.end();
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error getting truths: None found');
            res.end();
          }
        });
      } else if (req.url === '/api/servers') {
        const dashboardHandler = new DashboardHandler();
        dashboardHandler.getServers((data) => {
          if (data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(data));
            res.end();
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.write('Error getting truths: None found');
            res.end();
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write('Page not found');
        res.end();
      }
    } else if (req.method === 'POST') {
      if (req.url === '/api/truth/delete') {
        let rawBody = '';
        req.on('readable', function() {
          rawBody += req.read();
        });
        req.on('end', function() {
          let body = '';
          if (rawBody.slice(-4) === 'null') {
            body = rawBody.slice(0, -4);
          } else {
            body = rawBody;
          }
          let data = JSON.parse(body)
          const dashboardHandler = new DashboardHandler();
          dashboardHandler.deleteTruth(data.id, (data) => {
            if (!data) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.write('Error deleting truth');
              res.end();
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.write(JSON.stringify({ success: true }));
              res.end();
            }
          });
        });
        req.on('error', function(err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.write('Error deleting truth');
          res.end();
        });
      } else if (req.url === '/api/dare/delete') {
        let rawBody = '';
        req.on('readable', function() {
          rawBody += req.read();
        });
        req.on('end', function() {
          let body = '';
          if (rawBody.slice(-4) === 'null') {
            body = rawBody.slice(0, -4);
          } else {
            body = rawBody;
          }
          let data = JSON.parse(body)
          const dashboardHandler = new DashboardHandler();
          dashboardHandler.deleteDare(data.id, (data) => {
            if (!data) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.write('Error deleting dare');
              res.end();
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.write(JSON.stringify({ success: true }));
              res.end();
            }
          });
        });
        req.on('error', function(err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.write('Error deleting dare');
          res.end();
        });
      }//end api endpoint call
    }//end post
  });//end server

  server.listen(8080);
} catch (error) {
  console.log("Server recovered from a Critical error: ")
  console.log(error)
}

