//to deal with shops
var express=require("express");
var router=express.Router();
var shop=require("../schema/shopSchema");
var io=require('../socket');
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
router.get('/',function(req,res){
    res.render('shops',{title:'shops'});
    var myLatLng = {lat: 12.313614, lng: 76.613604};
     io.on('connection', function (socket) {
        socket.emit('mypnt',myLatLng);
        socket.on('marker',function(data){
            console.log(data);
            var dis=getDistanceFromLatLonInKm(myLatLng.lat,myLatLng.lng,data.lat,data.lng);
            console.log("distance between them is "+dis+" kms");
        });
    });
});
router.get('/:id',function(req,res){
    var id=req.params.id;
    var query={};
    query["phone"]=id;
    shop.findOne(query,function(err, shp) {
       res.end("found this: "+shp); 
    });
});
router.post('/findshop',function(req,res){
    var query={};
    query["city"]=req.body.city;
    console.log(req.body);
    var shpArray=new Array();
    shop.find(query,function(err,data){
        if(err){
            throw err;
        }
        else
        {
           
            data.forEach(function(shop){
                 
                var dis=getDistanceFromLatLonInKm(shop.lat,shop.lng,req.body.lat,req.body.lng);
                console.log(dis);
                if((dis<100)&&(shop.online==true))
                {
                   
                    var obj={
                        shopid:shop.shopid,
                        name:shop.name,
                        phone:shop.phone,
                        fare:shop.fare,
                        email:shop.email,
                        lat:shop.lat,
                        lng:shop.lng
                    };
                    shpArray.push(obj);
                    console.log(obj);
                }
            });
            var shopobj={"shops":shpArray};
            res.json(shopobj);
            console.log(shopobj);
        }
    });
    
});
router.post('/addshop',function(req,res){
    var sinfo=req.body;
    var sname=sinfo.name;
    var shid=sinfo.name.substring(0,3)+sinfo.city.substring(0,3)+sinfo.phone.substring(7);
    var data={
        shopid:shid,
        name:sinfo.name,
        city:sinfo.city,
        lat:sinfo.lat,
        lng:sinfo.lng,
        pass:sinfo.pass,
        phone:sinfo.phone
    };
    if(sinfo.email)
    {
        data.email=sinfo.email;
    }
    
    var nshop=new shop(data);
    var query={};
    query['shopid']=shid;
    shop.findOne(query,function(err,shop){
        if(err)
        {
            throw err;
        }
        else
        {
        if(!shop)
        {
            nshop.save(function(err,data){
                if(err) {
                    throw err;
                }
                else
                {
                    res.json(data);
                    console.log(data);
                }
            });
        }
        else 
        {
            res.json(0);  
        }
    }
    });
});
router.post('/updateshop',function(req,res) {
    var sinfo=req.body;
    //console.log(JSON.stringify(sinfo));
    var obj={};
    obj[sinfo.field]=sinfo.value;
    shop.update({shopid:sinfo.shopid},obj,function(err,user){
        if(err) throw err;
        else
        {
            res.json(1);
        }
    });
});
router.post('/deleteshop',function(req,res){
    var sinfo=req.body;
     shop.findOne({phone:sinfo.phone},function(err,shp){
        console.log("This object will get deleted " + shp);
        shp.remove();
    });
    res.end('deleted');
});
module.exports.routes=router;