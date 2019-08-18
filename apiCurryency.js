/*
架構:
1.基本知識、數據類型、流程控制。
2.函數
3.模塊
前端:
1.html標籤
2.Css樣式
3.JS語法
4.jQuery
5.Ajax
6.bootstrap....
 */
/*
全域變數：在函式作用域(function scope)之外宣告的變數，全域變數在整個程式中都可以被存取與修改。
區域變數：在函式作用域(function scope)內宣告，每次執行函式時，就會建立區域變數再予以摧毀，而且函式之外的所有程式碼都不能存取這個變數。
var const let
const 可以提醒閱讀程式碼的人，只要我們宣告完以後就不能再去做改變變數了。
var JavaScript最弱的變數宣告 https://blog.johnsonlu.org/%E7%94%A8-let%E3%80%81const-%E5%8F%96%E4%BB%A3-var/
let 變數可能會被重新指定值
*/



const request = require("request");//npm install request cheerio
const cheerio = require("cheerio");//npm install request cheerio  抓取頁面模塊，為服務器特別定制的，快速、靈活、實施的jQuery核心實現。適合各種Web爬蟲程序。
const ramda = require("ramda");//npm install ramda   有許多優秀的 API 或許可以幫助你減少開發上的複雜度 https://ithelp.ithome.com.tw/articles/10191612
const fs = require('fs');
const express = require('express');
const app = express();
const bank = require("./bank");//列舉 TypeScript特性之一，它能嚴格限制數值範圍，較數字或字串安全，不慎打錯字在編譯時就會被揪出來
const enume = require("./enum");  //列舉幣別
const config = require('./config');//config

const dateFormat = require('moment');  //npm install moment
const dateS = dateFormat(new Date()).format('YYYY');//今日時間
console.log(dateS);
//跨網域用 另外解法:https://noob.tw/js-cors/ 還沒試
//跨域是指去向一个为非本origin(协议、域名、端口任意一个不同)的目标地址发送请求的过程，这样之所以会产生问题是因为浏览器的同源策略限制。看起来同源策略影响了我们开发的顺畅性.实则不然,同源策略存在的必要性之一是为了隔离攻击。
//跨域资源共享(CORS) 是一种机制，它使用额外的 HTTP 头来告诉浏览器  让运行在一个 origin (domain) 上的Web应用被准许访问来自不同源服务器上的指定的资源。当一个资源从与该资源本身所在的服务器不同的域、协议或端口请求一个资源时，资源会发起一个跨域 HTTP 请求
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); //就是我們需要設定的域名
    res.header("Access-Control-Allow-Headers", "X-Requested-With");//如果 requestedWith 为 null，则为同步请求。 如果 requestedWith 为 XMLHttpRequest 则为 Ajax 请求。返回数据是json。
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");//允許的請求方式
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


//中國幣別各大銀行匯率
app.get('/api/Currency/:minorCur', (req, res, params) => {
    //console.log(req.params.dateS);
    const datevalue = req.params.minorCur;//api上的參數
    console.log(datevalue);

    request({
        url: config.urlCurrency + datevalue, // 中國牌价(新台幣)
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            return;
        }
        const $ = cheerio.load(body); // 載入 body
        const result = []; // 建立一個儲存結果的容器

        const result_bank = []; // 建立一個儲存結果的容器
        const keys = Object.keys(bank);
        keys.forEach(function (item, index, array) {
            result_bank.push(bank[item].cn);

        });
        //歷史數據
        var Avgrate = check1(datevalue);
        // console.log('123', Avgrate);
        const Avgkey = Object.keys(Avgrate);

        const div = "#bank_huilvtable_" + datevalue + " tr";
        const table_tr = $(div); // 爬最外層的 Table(class=BoxTable) 中的 tr

        for (let i = 1; i < table_tr.length; i++) { // 走訪 tr



            const table_td = table_tr.eq(i).find('td'); // 擷取每個欄位(td)
            const Bankname = table_td.eq(0).text().trim();// 銀行名字

            const minorCur = table_td.eq(1).text();// 幣種
            const Current_purchase = (table_td.eq(2).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(2).text()))).toFixed(5);//現匯買入
            const Cash_sale = (table_td.eq(4).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(4).text()))).toFixed(5);// 現匯賣出
            //const Middle_price = (table_td.eq(6).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(6).text()))).toFixed(5);  //  平均匯率

            const Middle = table_td.eq(6).text().trim();
            var Middle_price = '--';
            if (Middle == '--') {
                if (Current_purchase != '--' && Current_purchase != '--') {
                    Middle_price = (((1 / (parseFloat(table_td.eq(2).text()))) + (1 / (parseFloat(table_td.eq(4).text())))) / 2).toFixed(5);
                }
            } else {
                Middle_price = (1 / (parseFloat(table_td.eq(6).text()))).toFixed(5);
            }

            const date = table_td.eq(7).text().trim().replace(/月/, '-').replace(/日/, '');

            const dateString = dateS + '-' + date;
            //console.log(dateString);
            // 建立物件並(push)存入結果
            if (result_bank.includes(Bankname) == true) {

                Avgkey.forEach(x => {
                    //console.log(' Avgrate[x]', Avgrate[x]);
                    const Mid = Avgrate[x].toFixed(5);
                    if (Bankname.includes(x) == true) {
                        result.push(Object.assign({ Bankname, minorCur, Current_purchase, Cash_sale, Middle_price, Mid, dateString }));
                    }
                })
                // result.push(Object.assign({ Bankname, minorCur, Current_purchase, Cash_sale, Middle_price, dateString }));
            }

        }
        // 在終端機(console)列出結果
        res.send(result);
    });
});

//port:3000
app.listen(config.apiPort, () => {
    console.log('Listening on port 3000...');
});
//偵測連線，並傳入一個callback function







function check1(datevalue) {
    const result2 = []; // 建立一個歷史儲存結果的容器
    // console.log('Avgrate', 'Avgrate');
    for (let j = 0; j < 7; j++) {
        const date7 = dateFormat(new Date()).subtract(j, 'days').format('YYYYMMDD');//今日-7時間
        var checkDir1 = fs.existsSync("./value/" + date7 + datevalue + ".json");
        if (checkDir1) {
            var file_contents = fs.readFileSync("./value/" + date7 + datevalue + ".json", 'utf-8');
            result2.push(JSON.parse(file_contents))
            const result1 = ramda.flatten(result2)//ramda.flatten  https://fanerge.github.io/2017/Ramda%E5%BA%93%E5%AD%A6%E4%B9%A0.html
            var Avgrate1 = check2(result1);

            //  console.log('Avgrate1', Avgrate1);
        }
    }
    return Avgrate1;
}



function check2(result1) {

    var sum = 0;
    var count;
    let ratelobj = {};
    let AVGOBJ = {};


    result1.forEach(item => {
        if (item.Middle_price != '--') {
            if (typeof (AVGOBJ[item.Bankname]) == "undefined") {
                AVGOBJ[item.Bankname] = 0;
            }
            AVGOBJ[item.Bankname] += 1;
        }
    });

    console.log('AVGOBJ', AVGOBJ);

    result1.forEach(item => {

        if (item.Middle_price == '--') {
            item.Middle_price = '0';
        }
        if (typeof (ratelobj[item.Bankname]) == "undefined") {
            ratelobj[item.Bankname] = 0;
        }
        ratelobj[item.Bankname] += (parseFloat(item.Middle_price));
    });

    /*在javascript中，有用，foreach及為...在這幾個走訪陣列的迴圈可以使用，然而for..in它可以走訪物件的屬性名稱value與值key。
    for (变量 in 對象)
    {
        code
    }
     */
    for (key in AVGOBJ) {
        let avg = ratelobj[key] / AVGOBJ[key];
        console.log('avg', avg);
        ratelobj[key] = avg
    }

    console.log('ratelobj', ratelobj);
    return ratelobj;
}





//http://localhost:3000/api/bank
/* app.get('/api/Bank',(req, res, params) => {
  res.send(bank);
  //console.log(bank)
}); */


//http://localhost:3000/api/參數
//http://localhost:3000/api/20190624bank
/* app.get('/api/:dateS', (req, res, params) => {
  //console.log(req.params.dateS);
  const date = req.params.dateS;//api上的參數
  const checkDir = fs.existsSync("./currency/" + date + ".json");//判斷資料夾是否有此json
  console.log(checkDir);
  if (checkDir) {
    //讀檔案
    const obj = JSON.parse(fs.readFileSync("./currency/" + date + ".json", 'utf8'));
    res.send(obj);
  }
}); */