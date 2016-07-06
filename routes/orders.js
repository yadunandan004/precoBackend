"use strict";
var express=require('express');
var router=express.Router();
var io=require('../socket');
var printOrder=require('../schema/printorderSchema');
var shop=require('../schema/shopSchema');
var userschm=require('../schema/userSchema');
var CloudPrint = require('cloud-print');
var google = require('googleapis');
var request = require('request');
var OAuth2 = google.auth.OAuth2;
var shops=[];
var users=[];
var pbslots;
const CLIENT_ID='27252076393-mib8gcku331a6lm4o7ba2qn99co06o8h.apps.googleusercontent.com';
const CLIENT_SECRET='aneK1__RTJqAIrO-RnGiUzMf';
const REDIRECT_URL='http://pre-ecobackend-yadunandan004.c9users.io:8080/orders';
const CODE='4/4J7xkJVpzGjaD67zgI6lKTp_xf9zEsWSLl51LuFE6D8';
const ACCESS_TOKEN='ya29.CizYAlvu2paOGJ4hzt0fvkaBnzOEXmMfcJ0SJtyqcqJnEzX83daFcmj-sYW9Sg';
const REFRESH_TOKEN='1/dgzm-flddGGuK7lytr5hzQbQ3P37fWc9f_0gO-dHgfU';
var cloud_print = new CloudPrint(
    {
        service_provider: 'google',
        auth: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URL,
            access_token: ACCESS_TOKEN,
            refresh_token: REFRESH_TOKEN
        }
    });
io.on('connection',function(socket)
{
      console.log('socket established to '+socket.id);
      socket.on("join", function(data) {
        console.log('shop '+data+' with socket id '+socket.id);
        shops[data] = socket;
        var obj={};
        obj['online']=true;
        shop.update({shopid:data},obj,function(err,user){
        if(err) console.log(err) ;
        else
        {
          console.log(data+" is online");
        }
    });
    });
    socket.on("new_user",function(data){
         console.log('user '+data+' with socket id '+socket.id);
         users[data]=socket;
    });
});
router.post('/neworder',function(req,res){
    var prnt=req.body;
    var user=prnt.user;
    var fare;
    //console.log(obj[0].path);
    var ordr=printOrder({
        shopid:prnt.shopid,
        user:prnt.user,
        type:prnt.type,
        start:prnt.start,
        duration:prnt.dur
    });
    if(/print/i.test(prnt.type))
    {
       if(typeof(prnt.src)!='undefined')
        {
             var obj=JSON.parse(prnt.src);
              ordr.src=obj;
              ordr.save(function(err,result){
            if(err)
            {
                console.log(err);
                res.json(-1);
            }
            else
            {
                console.log(JSON.stringify(result));
                var id=result._id;
                  addSlot(prnt.user,prnt.shopid,prnt.dur,prnt.type,prnt.start,(data)=>{
                      var resp={id:id,wait:data};
                        res.json(resp);
                  });
            }   
             });
        }
    }
    else 
    {
        ordr.save(function(err,result){
            if(err)
            {
                console.log(err);
                res.json(-1);
            }
            else
            {
                  addSlot(prnt.user,prnt.shopid,prnt.dur,prnt.type,prnt.start,(data)=>{
                        res.json(result);
                  });
            }   
             });
    }

});

router.post('/addpage',function(req,res){
    var query={};
    query["_id"]=req.body.id;
    var pages=JSON.parse(req.body.page);
    var obj={};
    obj['src']=pages;
    
    printOrder.update(query,{$push:obj},function(err,data){
        if(err)
        {
            throw(err);
        }
        else
        {
            console.log(data);
            res.send({ok:data.ok});
        }
    });
});
router.post('/updateStatus',function(req,res){
    var query={};
    query["_id"]=req.body.id;
    
    //var status=JSON.parse();
    console.log(req.body.sts);
    var obj={};
    obj['status']=req.body.sts;
    var persn=req.body.user;
    var status=req.body.sts;
    var tm=req.body.time;
     printOrder.update(query,{$set:obj},function(err,data){
        if(err)
        {
            throw(err);
        }
        else
        {
            console.log(data);
            users[persn].emit('ordrSts',{status:status,time:tm});
            res.json(1);
        }
    });
});

router.post('/allorders',function(req,res){
    var query={};
    query["user"]=req.body.user;
    printOrder.find(query,function(err,orders)
    {
      //console.log(orders);
      res.json(orders);
    });
});

var getPrinters=function(){
    var options = {};
    cloud_print.getPrinters(options, function(err, response){
        console.log(response.result);
    });
}
//getPrinters();

var print=function(printerId,Content,fn){
    var params = {
	title: 'Print job title',
	content: Content,
	content_type: 'url', //optional, default = url 
	printer_id: printerId,
	//tags: ['tag1', 'tag2'],//optional, default = [], 
	setting: {
		
 
	}
};
cloud_print.print(params,function(err, response){
    fn(JSON.stringify(response));
    console.log(response.toString());
});
}
//print('c576943e-1d99-db08-7a25-391f97668c24','https://upload.wikimedia.org/wikipedia/commons/a/a7/Lorem_Ipsum_Arial.png',function(data)
//{
//    console.log(data);
//});
router.post('/finished',function(req, res) {
    var prnt=req.body;
    var fare;
    var user=prnt.user;
   shop.findOne({shopid:prnt.shopid},(res)=>{
       fare=JSON.parse(res).fare;
       var cost=prnt.NumOfPages*fare;
       
        userschm.find({email:user},function(err,result){
            if(err)
            {
                console.log(err);
            }
            else{
                var wlt=JSON.parse(result).wallet-cost;
                userschm.update({email:user},{wallet:wlt},function(user) {
                   res.json(user); 
                });
            }
        });
   }); 
});
router.post('/execorder',function(req, res) {
    var id=req.body.id;
    printOrder.findOne({_id:id},function(err,order){
        if(err)
        {
            res.json(0);
        }
        else
        {
            if(order.user==pbslots[order.shopid][0].user)
            {
                if(pbslots[order.shopid][0].type.match(/print/))
                {
                    printer(order)
                }
                else
                {
                    
                }
            }
        }
    });
});
/*function checkSlot(shop,id)
{

    if(pbslots[shop].length==0)
    {
        return 0;
    }
    else
    {
        if(pbslots[shop].recent==pbslots[shop][id].start)
        {
            return 1;
        }
        else
        {
            return 0;
        }
    }
}*/

function slotAvailable(shop,start,dur)
{
    //checks whether the selected slot is available or not 
    if(pbslots[shop].length==0)
    {
        return 1;
    }
    else
    {
        for(var i=0;i<pbslots[shop].length;i++)
        {
            var oend=pbslots[shop][i].start+pbslots[shop][i].dur;
            var nend=start+dur;
            if((pbslots[shop][i].start>=start)&&(pbslots[shop][i].start<=nend)||(oend>=start)&&(oend<=nend))
            {
                return 0;
            }
        }
        return 1;
    }
}

function getSlots(shop)
{
     //returns all slots in the slot array
     if(pbslots[shop].length==0)
    {
        return 0;
    }
    else
    {
        return pbslots[shop];
    }
}

function addSlot(user,shop,dur,type,strt,fn)
{
   //creating a queue
    //var recnt
    var avail=slotAvailable(shop,strt,dur);
    if(avail==1)
    {
    var id=pbslots[shop].length;
    if(id==0)
    {
        pbslots[shop].recent=id;
    }
    else if(pbslots[shop].recent>strt)
    {
        pbslots[shop].recent=id;
    }
    var slot={
        id:id,
        user:user,
        start:strt,
        duration:dur,
        shop:shop,
        type:type
    };
    pbslots[shop].push(slot);
    Timer(slot);
    fn(slot) ; 
    }
    else
    {
        fn(avail) ;
    }
}
function removeSlot(shop,id)
{
    //remove slot from slot array
  for(var i=0;i<pbslots[shop].length;i++)
  {
     if(pbslots[shop][i].id==id)
       {
           pbslots[shop].splice(i, 1);
           return 1;
       }
  }
  return 0;
}

function Timer(order)
{
//starts counting down till the scheduled time        
   let dt=new Date();
   let t=dt.getTime()-order.start;
   (function(ordr,time){
        setTimeout((order)=>{
       //sending request to printer
       sessionStart(order);
    },time);
   })(order,t);
}

function sessionStart(order)
{
    
    //send auth info to printer
    sendAuth((data)=>{
        
    });
    //maintain a session of a user within printer
    (function(order){
        setTimeout((order)=>{
           sessionEnd(order); 
        },order.dur);
    })(order);
}
function sessionEnd(order)
{
    removeSlot(order.shop,order.id);
    //remove auth info from printer
}

function sendAuth(info,fun)
{
    fun(1);
}
function printer(prnt,ordr,user,fare,obj)
{
        if(/pb_/i.test(prnt.shopid))
        {
        cloud_print.getPrinter(prnt.shopid, function(err, response){
            console.log(response);
            ordr.save(function(err,result){
            if(err)
            {
                console.log(err);
            }
            else
            {
               print(prnt.shopid,obj,(data)=>{
                   //res.json(data);
                   shop.findOne({shopid:prnt.shopid},(res)=>{
                       fare=JSON.parse(res).fare;
                       var cost=data.NumOfPages*fare;
                       
                        userschm.find({email:user},function(err,result){
                            if(err)
                            {
                                console.log(err);
                            }
                            else{
                                var wlt=JSON.parse(result).wallet-cost;
                                userschm.update({email:user},{wallet:wlt},function(user) {
                                   return user; 
                                });
                            }
                        });
                   });
                   //users[prnt.user].emit('finished',data);
               });
            }
            });
        })
    }
    else
    {
        if(typeof(shops[prnt.shopid])=="undefined")
        {
            return 0;
        }
        else{
           shops[prnt.shopid].emit('new_order',prnt);
           return prnt;
        }
    }
}

function scanner(shop,user,res)
{
  
   
}

function copier()
{
  
    
}
module.exports.routes=router;
module.exports.getslots=getSlots;