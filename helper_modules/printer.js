'use strict';
const CloudPrint = require('cloud-print');
const google = require('googleapis');
const request = require('request');
const OAuth2 = google.auth.OAuth2;
const CLIENT_ID='27252076393-mib8gcku331a6lm4o7ba2qn99co06o8h.apps.googleusercontent.com';
const CLIENT_SECRET='aneK1__RTJqAIrO-RnGiUzMf';
const REDIRECT_URL='http://pre-ecobackend-yadunandan004.c9users.io:8080/orders';
const CODE='4/4J7xkJVpzGjaD67zgI6lKTp_xf9zEsWSLl51LuFE6D8';
const ACCESS_TOKEN='ya29.CizYAlvu2paOGJ4hzt0fvkaBnzOEXmMfcJ0SJtyqcqJnEzX83daFcmj-sYW9Sg';
const REFRESH_TOKEN='1/dgzm-flddGGuK7lytr5hzQbQ3P37fWc9f_0gO-dHgfU';
const nodePrinter=require('node-printer');
//console.log(nodePrinter.getPrinters());
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
cloud_print.printing=function(printerId,Content){
    
    var params = {
	title: 'Print job title',
	content: Content,
	content_type: 'url', //optional, default = url 
	printer_id: printerId,
	//tags: ['tag1', 'tag2'],//optional, default = [], 
	setting: {
		
 
	}
};
    return new Promise(resolve,reject)
    {
        this.print(params,function(err, response){
            if(!err)
            {
                resolve(JSON.stringify(response));
                console.log(response.toString());
            }
            else
            {
                reject(err);
            }
        });
    }
    
}


    
module.exports=cloud_print;