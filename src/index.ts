import * as inquirer from "inquirer"
import { existsSync, readFileSync, writeFileSync } from "fs"
import * as path from "path"
import chalk from "chalk"
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
  merge(merge1["merge1"], merge2["merge2"])
  promptUser()
}

function merge(merge1: string, merge2: string)
{
  console.clear()
  try
  {
    let xml1 = readFileSync(merge1, "utf-8")
    let xml2 = readFileSync(merge2, "utf-8")
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
      return d1 ? ({...d1, name: e.name, from: d1.name}) : null
    }).filter((e: any) => e)
    let finxml = JSON.parse(xmljs.xml2json(xml2,{compact: false}))
    finxml.elements[0].elements = [{type: "comment", comment: "Ported from "+path.basename(merge1)},{type: "comment", comment: "Using xmltools link git"}, ...final.map((e: any) => ({type: "element", name: "SubTexture", attributes: e}))]
    writeFileSync("./result.xml", xmljs.json2xml(JSON.stringify(finxml), {spaces: 4}))
    return true
  }catch(err){
    console.error(err)
    setTimeout(() => {
      promptUser()
      return false
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

function promptModify() : void
{
  console.clear()
  inquirer.prompt({
    type: "input",
    name: "modify",
    message: "Add the xml file you want to modify dir (ex. C:\\Users\\Me\\Desktop\\DADDY_DEAREST.xml)",
    validate: function (value)
    {
      if(value == "") return true
      if(existsSync(value))
      {
        return true
      }else{
        return "That file doesn't exist"
      }
    }
  }).then(ans => {
    if(ans["modify"] == "") return promptUser()
    try
    {
      let filepath = ans["modify"]
      let xml = readFileSync(filepath, "utf-8")
      let res : Array<{ attributes: { name: string, type: string } }> = JSON.parse(xmljs.xml2json(xml,{compact: false})).elements[0].elements.filter((e: { name: string }) => e.name == "SubTexture")
      inquirer.prompt({
        type: "list",
        name: "group",
        choices: ["By type","Individually"],
        message: "Select how to modify the subtextures properties"
      }).then(ans =>{
          let data: Array<any>
          if(res.some(e => !e.attributes.type))
          {
            data = res.map((e: { attributes: { name: string, type: string } }) => {e.attributes.type = getType(e.attributes.name); return e})
          }else{
            data = res
          }
          let type
          let individualtype = ans["group"]
          if(individualtype == "By type")
          {
            type = new Set(data.map((e: any) => e.attributes.type))
          }else{
            type = new Set(data.map((e: any) => e.attributes.name))
          }
          inquirer.prompt({
            type: "list",
            name: "types",
            choices: [...type]
          }).then(ans => {
            let group = data.filter(e => e.attributes[(individualtype == "By type" ? "type" : "name")] == ans["types"])
            let props: Set<string> = new Set()
            group.forEach(g => {
              Object.keys(g.attributes).forEach((a: any) => {
                props.add(a)
              })
            })
            inquirer.prompt({
              type: "list",
              name: "value",
              choices: [...props].filter(p => p != "name" && p != "type"),
              message: "Select the property you want to modify"
            }).then(ans => {
              let val = ans["value"]
              inquirer.prompt({
                type: "input",
                name: "new",
                message: "Write the new value",
                validate: function (value)
                {
                  if(value == "") return "You must add a new value"
                  if(isNaN(group[0].attributes[val]) === isNaN(value))
                  {
                    return true
                  }else{
                    return "The new value cannot be a " + (isNaN(value) ? "text" : "number")
                  }
                }
              }).then(ans =>{
                group.forEach(e =>{
                  e.attributes[val] = ans["new"]
                })
                let finxml = JSON.parse(xmljs.xml2json(xml,{compact: false}))
                finxml.elements[0].elements = [{type: "comment", comment: "Ported from "+path.basename(filepath)},{type: "comment", comment: "Using xmltools link git"},...finxml.elements[0].elements.filter((e: { attributes: any }) => e.attributes).filter((e: { attributes: { name: any } }) => !group.map(e=>e.attributes.name).includes(e.attributes.name)), ...group]
                writeFileSync(filepath, xmljs.json2xml(JSON.stringify(finxml), {spaces: 4}))
                promptUser()
              })
            })
          })
      })
    }catch(err){
      console.error(err)
      setTimeout(() => {
        promptUser()
        return false
      },1000*60*2)
    }
  })
}

enum Commands
{
  Merge = "Merge an xml file to have the properties of the other one",
  Modify = "Modify properties of the xml",
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
      case Commands.Modify:
        promptModify()
      break;
      case Commands.Quit:
        process.exit()
      break;
    }
  })
}
promptUser()