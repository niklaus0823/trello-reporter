Trello Report
=======

## 1. 概述
该脚本是为了从Trello上抓取卡片和项目，并最终根据过期时间进行排序生成报表

## 2. 使用
### 2.1 安装
在迁出的脚本根目录执行 `npm install .` ，等待执行完成。

### 2.2 配置准备
编辑配置文件 `config/config.json`：

        {
          "DR": {                        // 项目简写，用于运行脚本时确定使用那一套项目配置
            "type": "WR",                // 项目类型，enum('WR', 'DR'), WR:周报，DR：日报
            "name": "niklaus",           // 项目名称，用于生成Excel文件名拼接
            "trello": {
              "key" : "XXX",             // Trello授权Key，可以从`https://trello.com/app-key`获取
              "token" : "XXX",           // Trello授权token，可以从`https://trello.com/app-key`获取
              "username": "XXX"          // Trello拥有者账户名，可以从`https://trello.com/`右上角获取
            },
            "filter" : {
              "boardName" : ["BoardName"],     // 看板过滤，工具只读取在这里存在的看板数据
              "listNames" : ["checklist1"],    // 列表过滤，工具只读取在这里存在的列表数据
              "labels" : ["labels1"]           // 标签过滤，即执行人，工具只读取在这里存在的标签数据
            },
            "mail": {
              "send": false,              // 是否发送，enum(true, false), true:默认发送，false:默认不发送
              "from": "mail1@163.com",    // 寄件邮箱
              "to": ["mail2@163.com"],    // 收件邮箱
              "setting": "$username:$password@smtp.exmail.qq.com" //smtp配置，$username:填写帐号（同邮箱），$password：填写邮箱密码
            }
          }
        }


### 2.2 脚本运行
进入`bin`文件夹，
运行：`./run.sh 项目简写 指定日期（YYYY-MM-DD）` 可以读取`指定日期`的Trello的Comment
如果未指定日期`./run.sh 项目简写`，则默认按当日时间为`指定日期`

### 2.3 输出结果
脚本会在`csv`文件夹里输出：

* 报表excel `{$项目简写)_{$项目名称}_{YYYYMMDD}.xlsx`
* 范例：
    * 项目简写：WR
    * 项目名称：COMMON_冯洁
    * 报告时间: 20160920
    * 生成Excel名：WR_COMMON_冯洁_20160920.xlsx

### 2.4 特殊格式

* 周报-汇报时间：在Checklist的条目中书写如下格式
    * 格式：
        * 清单条目内容 \**汇报日期\**
    * 范例：

          内网API开发 **2016/09/26**

* 日报-时间调整：在Comment中输入如下格式
    * 格式：
        * 第一行固定为“时间调整”
        * 第二行固定为“修改前时间 => 修改后时间”
        * 第三行固定为“理由”
    * 范例：

          时间调整
          2016/09/21 => 2016/09/26
          朱昀砾完成后端API开发，另外朱昀砾和翁天萌已经将后续计划进行重新分配，朱昀砾协助翁天萌开发前端页面。

    * 备注：普通汇报，还是按照正常书写，不需要换行
