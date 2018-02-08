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
    var offline = fs.createWriteStream("offline.txt", {
        flags: 'w',
        encoding: "utf8",
        fd: 'null',
        autoClose: true,
    })
    var writeStream_arr = [writeStream,offline]
    var config = await apis.getConfig("search.txt")
    var url_arr = config[0]
    var Id = config[1][0]
    var Pwd = config[1][1]
    var class_selector = config[2][0]
    const browser = await puppeteer.launch({ headless: true });//若要看瀏覽器操作步驟headless : false 反之 true
    var learn104Page = await browser.newPage()
    //登入教育網-------------------------
    apis.signInLearn(browser, learn104Page, Id, Pwd)
    //----------------------------------*

    const page = await browser.newPage();
    console.log(url_arr)
    for (var index in url_arr) {
        var linkNum = 0
        var url = url_arr[index]
        var html_path =url.match(/[\d\w]{1,15}\.html{0,1}/gi)
        if(html_path==null||html_path.length!=1){
            console.log("檔案搜索錯誤!")
            break
        }else{
            html_path = html_path[0]
            console.log(`${html_path}檔案搜索成功!`)
        }
        //一次處理兩個promise----------------------------------
        var results_promise = await Promise.all([
            apis.readFile(html_path),
            apis.pageFrom_txt(page, url, writeStream_arr,class_selector)
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
            console.log(linkNum)
            console.log(`${html_path}檔與${url}取得筆數不同!`)
        } else {
            var html_done = await apis.search(browser, url, linkNum, page, writeStream_arr, file_html, changedSerial,class_selector)

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
    offline.end()
}
xbrowser()



