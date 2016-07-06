'use strict';
const express = require('express');
var multer  =   require('multer');
var router = express.Router();
var io=require('../socket');
var PDFParser = require('pdf2json/pdfparser');
var NodeOffice = require("nodeoffice/lib/node-office");
var JSZip = require('jszip');
var fs = require('fs');
var cheerio = require('cheerio');
var slots=require("./orders").getslots;
var pdfParser = new PDFParser();
var print=require('../schema/printSchema');

var test_file='/home/ubuntu/workspace/preeco/uploads//';

var detect_pages=function(filename,user,fn){
  //console.log(file);
  var file='/home/ubuntu/workspace/preeco/uploads/'+user+'/'+filename;
  
  var fil_typ=file.substr(file.lastIndexOf('.')+1);
if(fil_typ=='pdf')
{
  pdfParser.on('pdfParser_dataReady', function(data) {
    fn(data.formImage.Pages.length);
    console.log('Number of pages:',data.formImage.Pages.length);
  });
  pdfParser.loadPDF(file);
}
else
{
  if((fil_typ==('docx'||'pptx'))||(fil_typ.includes('xls')))
  {
    
  fs.readFile(file, function (err, content) {
          var zip = new JSZip();
         
          zip.loadAsync(content).then(function(zip){
            if(fil_typ=='docx')
            {
              zip.file('word/document.xml').async("string")
              .then(function (content) {
                  // use content
                  var xml=content;
                  var $xml = cheerio.load(xml, {xmlMode: true});
                 var breaks = $xml('w\\:lastRenderedPageBreak');
                  var tpages=breaks.length+1;
                  console.log( 'Number of pages in the '+fil_typ+' : '+tpages);
                  fn(tpages);
                 
              });
            }
            if(fil_typ=='pptx')
          {
            zip.file('ppt/presentation.xml').async("string")
              .then(function (content) {
                  // use content
                  var xml=content;
                  var $xml = cheerio.load(xml, {xmlMode: true});
                 var breaks = $xml('p\\:sldId');
                  var tpages=breaks.length;
                  console.log( 'Number of pages in the '+fil_typ+' : '+tpages);
                  fn(tpages);
                 
              });
          }
          if(fil_typ.includes('xls'))
          {
             zip.file('xl/workbook.xml').async("string")
              .then(function (content) {
                  // use content
                  var xml=content;
                  var $xml = cheerio.load(xml, {xmlMode: true});
                 var breaks = $xml('sheet');
                  var tpages=breaks.length;
                  console.log( 'Number of pages in the '+fil_typ+' : '+tpages);
                  fn(tpages);
                 
              });
          }
          });
        });
  }
  else
  {
    fn(1);
    console.log( 'Number of pages in the '+fil_typ+' : '+1);
  }
}
}
//detect_pages('SOPASU.docx','yadunandan4992@gmail.com');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    var user=req.body.user;
    if (user!=undefined)
    {
      user=user.replace(/\"/g, "");
    }
    console.log(JSON.stringify(file));
    console.log('upload user: '+user);
    console.log('filename: '+file.originalname);
    callback(null, './uploads/'+user);
    var pfile=new print({
      src:"/preeco/uploads/"+user+"/"+file.originalname,
      user:user
    });
    console.log(user);
    pfile.save(function(err){
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log('uploading complete');
      }
    });
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});

//var upload = multer({ storage : storage}).single('docs');
/* GET home page. */
var upload = multer({ storage: storage });

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.post('/readpage',function(req,res){
    var query={};
    query["user"]=req.body.user;
   //res.end("finished");
   var file;
   var str;
   print.find(query,function(err,data){
     if(err)
     {
       console.log(err);
     }
     else
     {
        data.forEach(function(file){
          str=str+"\n"+file.toString();
        })
        res.end(str);
      }
   });
});
router.post('/addpage',upload.array('docs'),function(req,res){
   console.log('body: '+JSON.stringify(req.body));
    res.end("finished");
});

router.post('/fare',function(req,res){
  var files=JSON.parse(req.body.docs).files;
  var user=req.body.user;
  var shopfare=req.body.fare;
  //var shopid=req.body.shopid;
  var total=0;
  var upfiles=0;
  //var slotstkn=slots(shopid);
  for(var i=0;i<files.length;i++)
  {
    console.log('copies: '+files[i].copies);
    detect_pages(files[i].name,user,function(data){
      upfiles++;
      total=total+data*files[i].copies;
      //console.log('total: '+total+'total files: '+files.length+'current file: '+i);
      if(upfiles==files.length)
      {
        res.json(total*shopfare);
        console.log('fare: '+total*shopfare);
      }
    });
  }
   
});
module.exports.routes = router;
