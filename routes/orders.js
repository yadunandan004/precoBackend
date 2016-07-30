"use strict";
var express=require('express');
var router=express.Router();
var io=require('../socket');
var printOrder=require('../schema/printorderSchema');
var shop=require('../schema/shopSchema');
var userschm=require('../schema/userSchema');
const preeco=require("../helper_modules/printer");
var slts=require("../helper_modules/slots");
var shops=[];
var users=[];
//console.log(slots.prototype.constructor);
var slots=new slts();
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
    //var time=new Date(prnt.start);
    
    //console.log(time.getHours()+':'+time.getMinutes());
    let time=new Date();
    let st=prnt.start.split('\:');
    
    if(/am/i.test(st[5]))
    {
        time.setHours(parseInt(st[3]));
    }
    else
    {
        time.setHours(parseInt(st[3])+12);
    }
    time.setDate(parseInt(st[0]));
    time.setMonth(parseInt(st[1]));
    time.setFullYear(parseInt(st[2]));
    time.setMinutes(parseInt(st[4]));
    time.setSeconds(0);
    time.setMilliseconds(0);   
    let duration=parseInt(prnt.dur);
    var ordr=printOrder({
        shopid:prnt.shopid,
        user:prnt.user,
        type:prnt.type,
        start:time,
        duration:duration
    });
    if(/print/i.test(prnt.type))
    {
       if(typeof(prnt.src)!='undefined')
        {
             //console.log("prnt "+JSON.stringify(prnt));
             var obj=JSON.parse(prnt.src);
              ordr.src=obj;
                  slots.addSlot(prnt.user,prnt.shopid,duration,prnt.type,time,obj,(data)=>{
                      if(data==0)
                      {
                        res.json({status:data,reason:'cannot book slot'});  
                      }
                      else
                      {
                            ordr.save(function(err,result){
                                if(err)
                                {
                                    console.log(err);
                                    res.json({status:0,reason:'couldn\'t save order'});
                                }
                                else
                                {
                                    console.log(data);
                                    res.json({status:1,data:data});
                                }
                            });
                      }
                  });
        }
        else
        {
            res.json({status:-1,reason:'print source files not present'});
        }
    }
    else 
    {
      slots.addSlot(prnt.user,prnt.shopid,prnt.dur,prnt.type,time,obj,(data)=>{
           ordr.save(function(err,result){
                if(err)
                {
                    console.log(err);
                    res.json({status:0,reason:'couldn\'t save order'});
                }
                else
                {
                    res.json(result);
                }   
            });
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
    preeco.getPrinters(options, function(err, response){
        console.log(response.result);
    });
}
//getPrinters();


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


function printer(prnt)
{
    var user=prnt.user;
    var obj=prnt.src;
    var cost;
        if(/pb_/i.test(prnt.shop))
        {
                getPrinter(prnt).then((response)=>{
                    preeco.printing(prnt.shop,obj);
                }).then((data)=>{
                    //printer response
                    getFare(prnt.shop);
                }).then((data)=>{
                    cost=data;
                    getUser(user);
                }).then((data)=>{
                    var wlt=JSON.parse(data).wallet-cost;
                                userschm.update({email:user},{wallet:wlt},function(user) {
                                   return user; 
                                });
                }).catch((err)=>{
                    console.log(err);
                    return err;
                })    
    }
    else
    {
        if(typeof(shops[prnt.shop])=="undefined")
        {
            return 0;
        }
        else{
           shops[prnt.shop].emit('new_order',prnt);
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

function getPrinter(prnt)
{
    return new Promise(resolve,reject)
    {
        preeco.getPrinter(prnt.shop, function(err, response){
            if(!err)
            {
                console.log(response);
                resolve(response);
            }
            else
            {
                reject(err);
            }
        });
    }
    
}

function getFare(shop)
{
     return new Promise(resolve,reject)
     {
        shop.findOne({shopid:prnt.shop},(res)=>{
                       let fare=JSON.parse(res).fare;
                       var cost=data.NumOfPages*fare;
                       resolve(cost);
        }); 
     }
}

function getUser(user)
{
     userschm.find({email:user},function(err,result){
                            if(err)
                            {
                                console.log(err);
                                reject(err);
                            }
                            else
                            {
                                resolve(result);
                            }
});
}
function getSlots(shop)
{
    return slots.getSlots(shop);
}
//console.log(slots.getSlots("pb_van769"));
module.exports.routes=router;
module.exports.printer=printer;
module.exports.getslots=getSlots;