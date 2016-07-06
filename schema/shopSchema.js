var mongoose=require("mongoose");
var Schema=mongoose.Schema;
var shopSchema=new Schema({
    shopid:{type:String,required:true,unique:true},
    name:{type:String,required:true},
    city:{type:String,required:true},
    email:{type:String},
    lat:{type:Number,required:true},
    lng:{type:Number,required:true},
    pass:{type:String,required:true},
    phone:{type:String,required:true,unique:true},
    fare:{type:Number},
    online:{type:Boolean,default:false},
    shopType:{type:String,default:'manual'}
});

var shop=mongoose.model('shop',shopSchema);
module.exports=shop;