const axios = require('axios');

var positions
/*
const apitoken = 'a43ba4b44fc9827d263467d3a05aac8bb55e2d86'
const baseURL = 'https://btcpay.4sats.shop'
require("dotenv").config();
const charge  = require('lightning-charge-client')('https://btcpay.4sats.shop/lightning-charge/btc/', process.env.LCTOKEN)
*/


//console.log(process.env.TELEGRAM)

/*
const lightningPayReq = require('bolt11')
var bolt11 = 'lnbc2u1psdjdidjidjiyrcakpp53q3sxqnus5qutgkep2rxl07nur26jt8ucxrcq58w667utvggmncqdqqxqyjw5q9qtzqqqqqq9qsqsp59wyye5cmhfvr8n6zrl9cv7fr4nf3tzydy5mqkuraq2ncfcl25v9srzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glcllltdguxhg3kggqqqqlgqqqqqeqqjquz8m6jlxu24tf2m5kcpjmh2xu3gnn6n57c49wsyqutz2kuagm8ck2dgkqp5r5694ktq3wxpgjyllk2wvlj2x4ta5g2rgtdl79tlm2rcpt3c79v'
var decoded = lightningPayReq.decode(bolt11)
console.log(decoded)
*/


async function invcharge() {
    const inv = await charge.invoice({ description: "Description", currency: 'USD', amount: 0.01 })
    console.log(inv)
}

async function start(){
    positions = await lnpos()
    //console.log(positions.open)
    positions.open.forEach(element => {
        console.log(element.pid,element.liquidation, element.margin);
        if (element.liquidation>5200000) {
            console.log(element.pid)
            // add margin
            addmargin(element.pid)
        }
    });
}

async function api(url,data=null,m='get') {
    const apitoken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGQxMjUwNC1iMmYwLTQ1ZmItYTE1Mi01ZDVlZDI0OTNkMWYiLCJpc3MiOiJodHRwczovL2FwaS5sbm1hcmtldHMuY29tIiwiYXVkIjpbInBvc2l0aW9ucyIsInVzZXIiXSwianRpIjoiY2tuc3FtaDdxM2tnNDA4cXQ4aDNqMzZ1MyIsImlhdCI6MTYxOTA4NzA0N30.j_MwHPOXVfiVWl9IlVHr0YK_gQVp9EvIOU-gr-UhZQs'
    const baseURL = 'https://api.lnmarkets.com'
    const res = await axios({
        url: baseURL+url, 
        headers: {
            'Authorization' : 'Bearer '+apitoken
        },
        data: data,
        method: m    
    })
    return res.data
}

async function lnpos(){
    return api('/positions?type=open') 
}

async function addmargin(pid){
    return api('/positions/add-margin',{"amount": 1000,"pid": pid},'post')
}

    
async function test(){
   // try {
        const res = await axios({
            method: 'post',
            // working
            //url: baseURL+'/api/v1/stores',
            //url: baseURL+'/api/v1/server/info',
            //url: baseURL+'/api/v1/stores/8vqZyFQ2jf24RbrExXE4mKvkDy2hR1WRB8BoXyWcPJPD/payment-requests',
            //url: baseURL+'/api/v1/stores/8vqZyFQ2jf24RbrExXE4mKvkDy2hR1WRB8BoXyWcPJPD/invoices',
            //url: baseURL+'/api/v1/server/lightning/BTC/info',
            //url: baseURL+'/api/v1/server/lightning/BTC/channels',
            //url: baseURL+'/api/v1/users/me',
            //url: baseURL+'/api/v1/health',
            //url: baseURL+'/api-keys/current',
            //url: baseURL+'/api/v1/server/lightning/BTC/invoices/pay',

            // create invoice in store
            url: baseURL+'/api/v1/stores/8vqZyFQ2jf24RbrExXE4mKvkDy2hR1WRB8BoXyWcPJPD/invoices',

            // create invoice
            //url: baseURL+'/api/v1/server/lightning/BTC/invoices',

            //not working
            //url: baseURL+'/api/v1/server/lightning/btc/channels',
            //url: baseURL+'/api/v1/server/lightning/btc/info',
            //url: baseURL+'/api/v1/server/lightning/btc/invoices',
            data: {
                //"BOLT11": "lnbc100n1psrl0dypp5dmk5dmuj265k5c3kre0ukr5m45r887wjtnedc8a3zkpmgfdw7w9qdq6w35xjueqd9ejqenjdakjqctsdyxqyjw5q9qtzqqqqqq9qsqsp5k7a5h5e8x9pr95yjxm6kcc2vgqq6eaq809usvuwcvd5luu44qgnqrzjqwryaup9lh50kkranzgcdnn2fgvx390wgj5jd07rwr3vxeje0glcllltdguxhg3kggqqqqlgqqqqqeqqjqakkx59p88cyddvm2ac27jj6fj08qpkhgmwc6h77qvuwnqfdychs5jcpmuggs9r28sa50ehp76q5fq56uz3vtlh0gpwtwh8d798k3wssqy8vmjy"
                
                "amount": "0.1",
                "currency": "USD", 
                /*
                "description": "This is a description",
                "expiry": 0,
                "privateRouteHints": false
                */
                
            },
            headers: {
                'Authorization' : 'token '+apitoken
            }
        })
        console.log(res.data)
    /*
    } catch (error) {
        console.error(error)
        //console.log('Thats an error')
    }
    */
    
}

//test()
//invcharge()
start()
//const margin = (6666 / 100000000)
//const price = 53000
//const quant = 300
//const liquidation = (1/price + margin/quant)**-1
//const liquidation = 51000
//const marg2 = quant*(1/liquidation - 1/price) * 100000000
//console.log(liquidation)
//console.log(marg2)

