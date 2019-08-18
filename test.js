



//npm install request cheerio
//利用cheerio 
const request = require("request");
const cheerio = require("cheerio");
const ramda = require("ramda");
const fs = require("fs");
const enume = require("./enum");  //列舉幣別
const bank = require("./bank");//列舉
var config = require('./config');//config

const dateFormat = require('moment');  //npm install moment
const dateS = dateFormat(new Date()).format('YYYYMMDD');//今日時間

const dateMonth = dateFormat(new Date()).format('YYYY');//今年
const dateS7 = dateFormat(new Date()).subtract(7, 'days').format('YYYYMMDD');//今日-7時間

//console.log(dateS7);
const currentDateTime = dateFormat(new Date()).format('HH:mm:ss');//現在時間
//console.log(currentDateTime);


const earthquake_Bank_Rate = function () {

    const keyss = Object.keys(enume);
    keyss.forEach(element => {
        var rate1 = enume[element].toLowerCase();

        // console.log('rate1',rate1);
        request({
            url: config.urlCurrency + rate1, // 中國牌价(新台幣)

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

            const div = "#bank_huilvtable_" + rate1 + " tr";
            const table_tr = $(div); // 爬最外層的 Table(class=BoxTable) 中的 tr

            for (let i = 1; i < table_tr.length; i++) { // 走訪 tr



                const table_td = table_tr.eq(i).find('td'); // 擷取每個欄位(td)
                const Bankname = table_td.eq(0).text().trim();// 銀行名字

                const minorCur = table_td.eq(1).text();// 幣種

                const Current_purchase = (table_td.eq(2).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(2).text()))).toFixed(5);//現匯買入
                const Cash_sale = (table_td.eq(4).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(4).text()))).toFixed(5);// 現匯賣出
                // const Middle_price = (table_td.eq(6).text().trim() == '--') ? '--' : (1 / (parseFloat(table_td.eq(6).text()))).toFixed(5);  //  平均匯率

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

                const dateString = dateMonth + '-' + date;
                //console.log(dateString);

                // 建立物件並(push)存入結果
                if (result_bank.includes(Bankname) == true) {
                    result.push(Object.assign({ Bankname, rate1, minorCur, Current_purchase, Cash_sale, Middle_price, dateString }));
                }

            }
            // 在終端機(console)列出結果
            fs.writeFileSync("./value/" + dateS + rate1 + ".json", JSON.stringify(result));
            // console.log(result);
        });
    });
}



earthquake_Bank_Rate();//銀行匯率
// 每半小時爬一次資料
setInterval(earthquake_Bank_Rate, 30 * 60 * 1000);


const deletebank = function () {

    const keyss = Object.keys(enume);
    keyss.forEach(element => {
        var rate1 = enume[element].toLowerCase();
        var checkDir1 = fs.existsSync("./value/" + dateS7 + rate1 + ".json");
        if (checkDir1) {
            fs.unlink("./value/" + dateS7 + rate1 + ".json", function () {
                // console.log('已經刪除檔案!');
            });
        }
    });

}

deletebank();//刪除第前7天的銀行
setInterval(deletebank, 1 * 1 * 1000);







