'use strict';
function slots()
{
    this.pbslots={};
}
slots.prototype.addSlot=function(user,shop,dur,type,strt,fn)
{
   //creating a queue
    //var recnt
    var avail=this.slotAvailable(shop,strt,dur);
    if(avail==1)
    {
    var id=this.pbslots[shop].length;
    if(id==0)
    {
        this.pbslots[shop].recent=id;
    }
    else if(this.pbslots[shop].recent>strt)
    {
        this.pbslots[shop].recent=id;
    }
    var slot={
        id:id,
        user:user,
        start:strt,
        duration:dur,
        shop:shop,
        type:type
    };
    this.pbslots[shop].push(slot);
    this.Timer(slot);
    fn(slot) ; 
    }
    else
    {
        fn(avail) ;
    }
};

slots.prototype.removeSlot=function(shop,id)
{
    //remove slot from slot array
  for(var i=0;i<this.pbslots[shop].length;i++)
  {
     if(this.pbslots[shop][i].id==id)
       {
           this.pbslots[shop].splice(i, 1);
           return 1;
       }
  }
  return 0;
}

slots.prototype.slotAvailable=function (shop,start,dur)
{
    //checks whether the selected slot is available or not 
    if(this.pbslots[shop].length==0)
    {
        return 1;
    }
    else
    {
        for(var i=0;i<this.pbslots[shop].length;i++)
        {
            var oend=this.pbslots[shop][i].start+this.pbslots[shop][i].dur;
            var nend=start+dur;
            if((this.pbslots[shop][i].start>=start)&&(this.pbslots[shop][i].start<=nend)||(oend>=start)&&(oend<=nend))
            {
                return 0;
            }
        }
        return 1;
    }
}

slots.prototype.getSlots=function (shop)
{
     //returns all slots in the slot array
     if(this.pbslots[shop].length==0)
    {
        return 0;
    }
    else
    {
        return this.pbslots[shop];
    }
}

slots.prototype.Timer=function (order)
{
//starts counting down till the scheduled time        
   let dt=new Date();
   let t=dt.getTime()-order.start;
   (function(ordr,time){
        setTimeout((order)=>{
       //sending request to printer
       this.sessionStart(order);
    },time);
   })(order,t);
}

slots.protoype.sessionStart=function (order)
{
    
    //send auth info to printer
    //this.sendAuth((data)=>{
    //});
    //maintain a session of a user within printer
    (function(order){
        setTimeout((order)=>{
           this.sessionEnd(order); 
        },order.dur);
    })(order);
}
slots.prototype.sessionEnd=function (order)
{
    this.removeSlot(order.shop,order.id);
    //remove auth info from printer
}

slots.prototype.sendAuth=function (info,fun)
{
    fun(1);
}
module.exports=new slots();