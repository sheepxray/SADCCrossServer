//乱杖写的这个api把我都整迷了
var pluginName = "CrossServer";
let pluginDescrition = "跨服插件,带MOTD和白名单限时的跨服插件";
let pluginVersion = [1, 0, 0];
var Version = "v1.0"
ll.registerPlugin(pluginName, pluginDescrition, pluginVersion, {
  Author: "shwx52",
});
const config = new JsonConfigFile(
  `./plugins/RTplugins/${pluginName}/config.json`
);
const plugin_setting = config.init("plugin_setting", {
  checkMotd: true,
  checkMotdServer: "https://motd.smgoro.top/api?host=",
  playerUseCmd: false,
  regCmd: "kf",
  regCmdDe: "使用跨服传送",
  regCmdWl: "kfwl",
  regCmdDeWl: "设置跨服白名单",
  WhiteList: ["127.0.0:19132", "anlmc.top:1007"],
});
config.init("GetApiFail", true);
const API_Data = new JsonConfigFile(
  `./plugins/RTplugins/${pluginName}/data/apiData.json`
);
const WL_Data = new JsonConfigFile(
  `./plugins/RTplugins/${pluginName}/data/allowData.json`
);
function updatecheck()
network.httpGet('https://fastly.jsdelivr.net/gh/sheepxray/SADCCrossServer/version.json', function (st, dat) {
		if (st == 200) {
			let version_lastest = JSON.parse(dat).version
			if (version_lastest != Version) {
				log(lang.Get_NewVersion.replace("{version_lastest}", version_lastest))
				network.httpGet('https://fastly.jsdelivr.net/gh/sheepxray/SADCCrossServer/SADCCrossServer.lxl.js', function (st2, dat2) {
					if (st2 == 200) {
						let plugin = dat2.replace(/\r/g, '');
						file.writeTo("plugins/SADCCrossServer.js", plugin)
						log(lang.UpdatePlugin_Successful)
						mc.runcmdEx("lxl reload SADCCrossServer.js")
					}
					else {
						log(lang.UpdatePlugin_Error)
					}
				})
			}
		}
  	})
updatecheck()
function isNum(content) {
  let result = /^\d+$/.test(content);
  return result;
}
function iportContent(iport) {
  let iportArr = iport.split(":");
  if (iportArr.length != 2) {
    return 0;
  } else {
    let port = parseInt(iportArr[1]);
    if (isNum(port) & (iportArr[0] != "")) {
      return [iportArr[0], iportArr[1]];
    } else {
      return 0;
    }
  }
}
function motdApi(iport, pl) {
  let wlServer = plugin_setting["WhiteList"];
  try {
    wlServer.forEach((server) => {
      if (server == iport) {
        throw new Error("系白名单服务器");
      }
    });
  } catch (error) {
    if (error.message == "系白名单服务器") {
      let data = WL_Data.init(pl.realName, {});
      if (data[iport] == undefined) {
        data[iport] = {};
      }
      WL_Data.set(pl.realName, data);
      if (data[iport] != undefined) {
        if (JSON.stringify(data[iport]) == "{}") {
          let res = timeCompare(data[iport]);
          if (res) {
            pl.tell(
              "§l[§c跨服传送§r§l] ⟫ §a抱歉,您的订阅时间过期,无法跨入此服务器"
            );
            return false;
          }
        } else {
          pl.tell("§l[§c跨服传送§r§l] ⟫ §a抱歉,此为白名单服务器,您未订阅");
          return false;
        }
      }
    }
  }
  let iportGet = "";
  iportGet = `${plugin_setting.checkMotdServer}${iport}`;
  network.httpGet(iportGet, (statu, result) => {
    if (statu == 200) {
      API_Data.set(pl.realName, strToJson(result));
    } else {
      API_Data.set(pl.realName, {});
      return false;
    }
  });
  return true;
}
function strToJson(str) {
  let json = eval("(" + str + ")");
  return json;
}
function MotdUihints(pl, iport) {
  if (plugin_setting.checkMotd) {
    if (!motdApi(iport, pl)) {
      return false;
    }
    pl.tell("§l[§c跨服传送§r§l] ⟫ §a请等待...查询服务器需要一些时间");
    setTimeout(() => {
      let motdbeApi = API_Data.get(pl.realName);
      WL_Data.init(pl.realName, {});
      let data = WL_Data.get(pl.realName);
      let plTime = {};
      if (data[iport] != undefined) {
        if (JSON.stringify(data[iport]) == "{}") {
          plTime[pl.realName] = data[iport];
        }
      }
      if (JSON.stringify(data[iport]) == "{}") {
        let status = motdbeApi.status;
        let host = motdbeApi.host;
        let motd = motdbeApi.motd;
        let agreement = motdbeApi.agreement;
        let version = motdbeApi.version;
        let online = motdbeApi.online;
        let max = motdbeApi.max;
        let gamemode = motdbeApi.gamemode;
        let delay = motdbeApi.delay;
        let hintsContent = "";
        if (status == "online") {
          status = "在线运行";
          hintsContent =
            "\n§l服务器状态:  " +
            status +
            "\n§r§lMOTD提示:  " +
            motd +
            "\n§r§l游戏协议:  " +
            agreement +
            "\n§r§l支持版本:  " +
            version +
            "\n§r§l在线人数:  " +
            online +
            "/" +
            max +
            "\n§r§l游戏模式:  " +
            gamemode +
            "\n§r§l服务器延迟:  " +
            delay;
          if (data[iport] != undefined) {
            if (Object.keys(data[iport]).length != 0) {
              hintsContent += `\n§l通行有效期至:${plTime[pl.realName].year}年${
                plTime[pl.realName].month
              }月${plTime[pl.realName].d}日${plTime[pl.realName].h}时${
                plTime[pl.realName].m
              }分${plTime[pl.realName].s}秒`;
            }
          }
        } else {
          status = "离线";
          hintsContent = "\n§l服务器状态:  §c" + status;
        }
        let fm_motd = mc.newSimpleForm();
        fm_motd.setTitle("§c§l服务器信息");
        fm_motd.setContent(hintsContent);
        if (status == "在线运行") {
          fm_motd.addButton("确认前往");
        }
        pl.sendForm(fm_motd, (pl, id) => {
          if (id == 0) {
            let iportArr = iportContent(host);
            if (status == "在线运行") {
              pl.transServer(iportArr[0], parseInt(iportArr[1]));
            }
          }
          if (id == null) {
            if (status == "离线") {
              return 0;
            }
            pl.tell("§l[§c跨服传送§r§l] ⟫ §a传送取消!");
            return 0;
          }
        });
      } else {
        if (config.get("GetApiFail")) {
          pl.tell("§l[§c跨服传送§r§l] ⟫ §a请求失败,执行立即传送");
          let iportArr = iportContent(iport);
          pl.transServer(iportArr[0], parseInt(iportArr[1]));
        } else {
          pl.tell("§l[§c跨服传送§r§l] ⟫ §a请求失败,接口未返回");
        }
      }
    }, 4000);
  } else {
    let iportArr = iportContent(iport);
    pl.transServer(iportArr[0], parseInt(iportArr[1]));
  }
}
function timeCompare(oldTime) {
  let old = `${oldTime.year}-${oldTime.month}-${oldTime.d}${oldTime.h}:${oldTime.m}:${oldTime.s}`;
  let nowDate = new Date(old);
  if (nowDate.getTime() < Date.now()) {
    return true;
  } else {
    return false;
  }
}
function getHourTime(hourT) {
  let date = Date.now();
  let hourMS = parseInt(Math.abs(hourT)) * 3600000;
  let endHourMS = hourMS + date;
  let time = new Date(endHourMS);
  let year = time.getFullYear();
  let month = time.getMonth() + 1;
  let day = time.getDate();
  let hour = time.getHours();
  let minutes = time.getMinutes();
  let second = time.getSeconds();
  let millilseconds = time.getMilliseconds();
  let timeObj = {
    year: year,
    month: month,
    d: day,
    h: hour,
    m: minutes,
    s: second,
    ms: millilseconds,
  };
  return timeObj;
}
function uiCrossServer(pl) {
  let fm_menu = mc.newCustomForm();
  fm_menu.setTitle("§l§c跨服传送 - RT");
  fm_menu.addLabel("§l请填写相关内容:");
  fm_menu.addInput("§l服务器IP§r : ", "127.0.0.1");
  fm_menu.addInput("§l服务器端口§r : ", "19132");
  pl.sendForm(fm_menu, (pl, data) => {
    if (data != null) {
      if (isNum(data[2]) || data[1] != "") {
        let iport = data[1] + ":" + data[2];
        MotdUihints(pl, iport);
      } else {
        pl.tell("§l[§c跨服传送§r§l] ⟫ §a请填写正确的IP/端口");
      }
    }
  });
}
mc.listen("onServerStarted", () => {
  let plUseCmd = PermType.GameMasters;
  if (plugin_setting.playerUseCmd) {
    plUseCmd = PermType.Any;
  }
  let cmd = mc.newCommand(
    plugin_setting.regCmd,
    plugin_setting.regCmdDe,
    plUseCmd
  );
  cmd.optional("Iport", ParamType.RawText);
  cmd.overload(["Iport"]);
  cmd.setCallback((_cmd, _ori, out, res) => {
    let pl = _ori.player;
    let iport = res.Iport;
    if (iport == null) {
      uiCrossServer(pl);
    } else {
      var iportArr = iport.split(":");
      if (iportArr.length != 2) {
        out.error("§l[§c跨服传送§r§l] ⟫ §a您填写的ip端口不合规范");
        return 0;
      } else {
        let port = parseInt(iportArr[1]);
        if (isNum(port) == false) {
          out.error("§l[§c跨服传送§r§l] ⟫ §a您填写的端口不合规范");
          return 0;
        } else {
          MotdUihints(pl, iport);
        }
      }
    }
  });
  cmd.setup();
  let cmd1 = mc.newCommand(
    `${plugin_setting.regCmdWl}`,
    plugin_setting.regCmdDeWl,
    PermType.GameMasters
  );
  cmd1.setEnum("operate", ["set"]);
  cmd1.setEnum("operateRe", ["reset"]);
  cmd1.setEnum("operateReload", ["reload"]);
  cmd1.mandatory("operateEnum", ParamType.Enum, "operate");
  cmd1.mandatory("operateEnum", ParamType.Enum, "operateRe");
  cmd1.mandatory("operateEnum", ParamType.Enum, "operateReload");
  cmd1.mandatory("operateIport", ParamType.RawText);
  cmd1.mandatory("operatePlayer", ParamType.Player);
  cmd1.mandatory("operateHour", ParamType.Int);
  cmd1.overload(["operate", "operatePlayer", "operateHour", "operateIport"]);
  cmd1.overload(["operateRe", "operatePlayer", "operateIport"]);
  cmd1.overload(["operateReload"]);
  cmd1.setCallback((_cmd, _ori, out, res) => {
    let opera = res.operateEnum;
    if (opera != "reload") {
      var iportArr = res.operateIport.split(":");
      if (iportArr.length != 2) {
        out.error("§l[§c跨服传送§r§l] ⟫ §a您填写的ip端口不合规范");
        return 0;
      } else {
        let port = parseInt(iportArr[1]);
        if (isNum(port) == false) {
          out.error("§l[§c跨服传送§r§l] ⟫ §a您填写的端口不合规范");
          return 0;
        }
      }
    }
    if (opera == "set") {
      let PlayerArr = res.operatePlayer;
      PlayerArr.forEach((pl) => {
        let data = WL_Data.init(pl.realName, {});
        data[res.operateIport] = getHourTime(res.operateHour);
        WL_Data.set(pl.realName, data);
      });
      out.success("§l[§c跨服传送白名§r§l] ⟫ §a执行设置成功");
    } else if (opera == "reset") {
      let PlayerArr = res.operatePlayer;
      PlayerArr.forEach((pl) => {
        let data = WL_Data.init(pl.realName, {});
        delete data[res.operateIport];
        WL_Data.set(pl.realName, data);
      });
      out.success("§l[§c跨服传送白名§r§l] ⟫ §a执行重置所选玩家");
    } else if (opera == "reload") {
      config.reload();
      WL_Data.reload();
      out.success("§l[§c跨服传送白名§r§l] ⟫ §a热加载配置与数据文件完成");
    }
  });
  cmd1.setup();
});
ll.export(MotdUihints, "kfFun_Rt");
logger.info(pluginDescrition + "加载完成! ===>作者: 乱杖先生");
