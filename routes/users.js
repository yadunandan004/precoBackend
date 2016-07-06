//to deal with users
var express = require('express');
var router = express.Router();
var user=require('../schema/userSchema.js');
var shop=require('../schema/shopSchema.js');
var fs = require('fs');
var io=require('../socket');
var dir = './uploads/';

var deleteFolderRecursive = function(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};


/* GET users listing. */
router.get('/',function (req,res) {
   
    res.render('users',{title:'users'});
  
});
router.get('/:id',function(req,res){
    var id=req.params.id;
    var query={};
    query["email"]=id;
    user.findOne(query,function(err, person) {
       res.end("found this: "+person); 
    });
});

//for user login
router.post('/readuser',function(req,res){
    var std=req.body;
    if(typeof(std.email)!=='undefined')
    {
    var query={$and:[{email:std.email},{pass:std.pass}]};
    user.findOne(query).lean().exec(function(err, person) {
        if(person!=null)
        {
            var data=person;
            data.type='user';
            res.json(data);
            console.log("logged person"+data);
        }
        else
        {
            //res.json(0);
            shop.findOne({$and:[{shopid:std.email},{pass:std.pass}]}).lean().exec(function(err, shp) {
                if(shp!=null)
                {
                    
                    shp.type='shop';
                    res.json(shp);
                    console.log(shp.type);
                    console.log("logged shop "+shp.shopid);
                }
                else
                {
                    res.json(0);
                }
            })
        }
    })
    }
    else
    {
        res.send('dataset empty');
    }
});
//for user signup
router.post('/adduser', function(req, res, next) {
    var uinfo=req.body;
    //console.log(uinfo);
    var nuser=new user({
        name:uinfo.name,
        college:uinfo.college,
        email:uinfo.email,
        pass:uinfo.pass,
        phone:uinfo.phone
    });

    user.findOne({email:uinfo.email},function(err, person) {
        if(!person){
            nuser.save(function(err,data){
        if(err) {console.log(err);}
        else {
            if (!fs.existsSync(dir+uinfo.email)){
                fs.mkdirSync(dir+uinfo.email);
            }
            res.json(data);
            console.log(data);
            }
         });
        }
        else{
            res.json(0);
        }
    });
});

router.post('/updateuser',function(req,res){
    var field="name";
    var hes="shetty abhishek";
    var val={};
    val[field]=hes;
    user.update({email:'abshetty08@gmail.com'},val,function(err,user){
        if(err){throw err}
        else
        {
            res.end('user updated');
        }
    });  
});
router.post('/deleteuser',function(req, res, next) {
    var mid=req.body.email;
    user.findOne({email:mid},function(err,person){
        console.log("This object will get deleted " + person);
        person.remove();
        deleteFolderRecursive(dir+'yaduanna@gmail.com');
    });
    res.end('deleted');
})
module.exports.routes = router;
