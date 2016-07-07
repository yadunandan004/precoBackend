"use strict";
var express=require('express');
var router=express.Router();
var io=require('../socket');
var printOrder=require('../schema/printorderSchema');
var shop=require('../schema/shopSchema');
var userschm=require('../schema/userSchema');
var preeco=require("../helper_modules/printer");
var slots=require("../helper_modules/slots");
var shops=[];
var users=[];


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
                  slots.addSlot(prnt.user,prnt.shopid,prnt.dur,prnt.type,prnt.start,obj,(data)=>{
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
                  slots.addSlot(prnt.user,prnt.shopid,prnt.dur,prnt.type,prnt.start,obj,(data)=>{
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
        if(/pb_/i.test(prnt.shop))
        {
        preeco.getPrinter(prnt.shop, function(err, response){
            console.log(response);
               preeco.printing(prnt.shop,obj,(data)=>{
                   //res.json(data);
                   shop.findOne({shopid:prnt.shop},(res)=>{
                       let fare=JSON.parse(res).fare;
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
module.exports.routes=router;
module.exports.printer=printer;
module.exports.getslots=slots.getSlots;