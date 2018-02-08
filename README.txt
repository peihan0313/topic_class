安裝
    安裝nodejs 8.9.4以上
    開啟cmd 在檔案當前目錄(topic_class/)執行npm install --save
    安裝完成

說明
    此程式用來協助套主題課程表單
    教育網主題課程頁面會設定有許多連結跳轉到對應的課程
    我們需要將課程的課程代碼即機構代碼記下，到DB查詢課程的serial碼，
    並將serial替換掉html檔裡舊的serial代碼(通常都是舊的課程的serial)
    雖然我們不能直接對線上DB執行操作但
    後台的資料維護裡有實作用課程代碼及機構代碼對DB查詢serial碼的頁面
    這支程式的作用就是幫助我們做完以上事情(點進課程頁->記下課程代碼、機構代碼->至後台資料維護查詢->寄下查詢的代碼->到html檔裡換掉舊的代碼)
執行
    將要套入的頁面放入此資料夾ex. p1.htm ,p2.htm ,... 
    將線上的網址對應頁面[http://xxxx/xxxxx/p1.htm]寫入search.txt
    若有多個頁面請填入多個 ex. 
    [http://xxxx/xxxxx/p1.htm]
    [http://xxxx/xxxxx/p2.htm]
    [http://xxxx/xxxxx/p3.htm]
    將AD帳號密碼寫入search.txt {id:yourADid},{pw:password}
    講html選擇器寫入search.txt (`.ptxt > a`)
    網址用中括號
    AD用大括號
    選擇器用小括號
    解釋一下選擇器因為頁面格式不同的調整有兩個地方
    1.api.js裡面的search()
        try {
            await page.evaluate((i) => {
                document.querySelectorAll(你填入的選擇器)[i - 1].onclick()
            },i)
        } catch (e) {
            console.log(e)
        }
    2.apis.js裡面pageFrom_txt()
        try {
            var linkNum = await page.evaluate((class_selector) => {
                linkNum = document.myclass.querySelectorAll(你填入的選擇器).length
                return linkNum
            },class_selector)
        } catch (e) {
                console.log(`${url}\n取得筆數錯誤!`)
                return 0
        }
    選擇器選到的內容是對應到每個課程的連結(一個課程若有多個連結，請選到一個就好)，且按照順序(不能多不能少，會檢查數量，數量錯誤即停止)。
    開啟cmd到此資料夾執行npm start
    結果詳細內容會寫進result.txt
    有失敗也會呈現在cmd上
    