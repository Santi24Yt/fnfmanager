import * as inquirer from "inquirer"
import { readdirSync, lstatSync, Stats, existsSync, readFileSync, writeFileSync } from "fs"
import * as path from "path"
import chalk from "chalk"
import { Mod, File, ModData, Directory } from "./mod"
import { copySync, ensureDirSync, removeSync } from "fs-extra"
import xmljs from "xml-js"


async function promptMerge() : Promise<void>
{
  let merge1 = await inquirer.prompt({
    type: "input",
    name: "merge1",
    message: "Add the base xml file dir (ex. C:\\Users\\Me\\Desktop\\DADDY_DEAREST.xml)"
  })
  let merge2 = await inquirer.prompt({
    type: "input",
    name: "merge2",
    message: "Add the xml file you want to port dir (ex. C:\\Users\\Me\\Desktop\\HEX.xml)"
  })
  try
  {
    let xml1 = readFileSync(merge1["merge1"], "utf-8")
    let xml2 = readFileSync(merge2["merge2"], "utf-8")
    let res1 = JSON.parse(xmljs.xml2json(xml1,{compact: false})).elements[0].elements.filter((e: { name: string }) => e.name == "SubTexture")
    let res2 = JSON.parse(xmljs.xml2json(xml2,{compact: false})).elements[0].elements.filter((e: { name: string }) => e.name == "SubTexture")
    let data1 = res1.map((e: { attributes: { name: string } }) => ({...e.attributes, type: getType(e.attributes.name)}))
    let data2 = res2.map((e: { attributes: { name: string } }) => ({...e.attributes, type: getType(e.attributes.name)}))
    let final = data2.map((e: { type: any; name: string },i: any) => {
      let typ = data1.filter((d1: { type: any }) => d1.type == e.type)
      if(typ.length == 0)
      {
          typ = data1.filter((d1: { type: string }) => d1.type == "idle")
      }
      let d1 = typ.find((d1: { name: string }) => d1.name.endsWith(e.name.slice(-4)))
      return d1 ? ({...d1, name: e.name}) : null
    }).filter((e: any) => e)
    let finxml = JSON.parse(xmljs.xml2json(xml2,{compact: false}))
    writeFileSync("./result.xml", xmljs.json2xml(JSON.stringify(finxml), {spaces: 4}))
    promptUser()
  }catch(err){
    console.error(err)
    setTimeout(() => {
      promptUser()
    },1000*60*2)
  }
}

function getType(name: string) :string
{
    name = name.toLowerCase()
    if(name.includes("down"))
    {
        if(name.includes("miss"))
        {
            return "down miss"
        }else{
            return "down"
        }
    }
    if(name.includes("idle"))
    {
        if(name.includes("miss"))
        {
            return "idle miss"
        }else{
            return "idle"
        }
    }
    if(name.includes("left"))
    {
        if(name.includes("miss"))
        {
            return "left miss"
        }else{
            return "left"
        }
    }
    if(name.includes("right"))
    {
        if(name.includes("miss"))
        {
            return "right miss"
        }else{
            return "right"
        }
    }
    if(name.includes("up"))
    {
        if(name.includes("miss"))
        {
            return "up miss"
        }else{
            return "up"
        }
    }
    return "invalid"
}

enum Commands
{
  Merge = "Merge an xml file to have the properties of the other one",
  Modify = "Load mod to game",
  Quit = "Quit/Exit"
}

function promptUser () : void
{
  console.clear()
  console.log(chalk.bold.italic.underline("Friday Night Funkin' xmltools"))
  inquirer.prompt({
    type: "list",
    name: "command",
    message: "Choose an option",
    choices: Object.values(Commands)
  }).then(async ans => {
    switch (ans["command"])
    {
      case Commands.Merge:
        promptMerge()
      break;
      case Commands.Quit:
        process.exit()
      break;
    }
  })
}
promptUser()