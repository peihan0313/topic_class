var fs = require("fs");
const puppeteer = require('puppeteer');
const apis = require('./apis');


var xbrowser = async function () {
    var writeStream = fs.createWriteStream("result.txt", {
        flags: 'w',
        encoding: "utf8",
        fd: 'null',
        autoClose: true,
    })
    var config = await apis.getConfig("search.txt")
    var url_arr = config[0]
    var Id = config[1][0]
    var Pwd = config[1][1]
    const browser = await puppeteer.launch({ headless: true });
    var learn104Page = await browser.newPage()
    //登入教育網-------------------------
    apis.signInLearn(browser, learn104Page, Id, Pwd)
    //----------------------------------*

    const page = await browser.newPage();
    console.log(url_arr)
    for (var index in url_arr) {
        var linkNum = 0
        var url = url_arr[index]
        var html_path = url.slice(url.length - 6, url.length)
        //一次處理兩個promise----------------------------------
        var results_promise = await Promise.all([
            apis.readFile(html_path),
            apis.pageFrom_txt(page, url, writeStream)
        ]).then(function (results) {
            return [results[0].toString(), results[1]]
        })
        //將要換的html檔讀入---------
        var file_html = results_promise[0]
        //進入頁面並取得頁面筆數
        linkNum = results_promise[1]
        //------------------------------------------*
        var changedSerial = apis.getSerial(file_html)
        if (linkNum !== changedSerial.length) {
            console.log(changedSerial)
            console.log(`${html_path}檔與${url}取得筆數不同!`)
        } else {
            var html_done = await apis.search(browser, url, linkNum, page, writeStream, file_html, changedSerial)

        }
        if (!html_done) {
            console.log(`${url}失敗`)
        } else {
            var writeStream_html = fs.createWriteStream(html_path, {
                flags: 'w',
                encoding: "utf8",
                fd: 'null',
                autoClose: true,
            })
            await writeStream_html.write(html_done)
            writeStream_html.end()

        }


    }
    browser.close()
    writeStream.end()

}
xbrowser()



